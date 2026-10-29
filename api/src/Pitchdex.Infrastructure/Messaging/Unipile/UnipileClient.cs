using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Pitchdex.Application.Integrations;

namespace Pitchdex.Infrastructure.Messaging.Unipile;

/// <summary>
/// The raw Unipile REST API (https://developer.unipile.com). One method per endpoint
/// Pitchdex uses. Responses are read as JSON documents and picked apart by the classes
/// that use them, so a field Unipile adds or renames never breaks deserialization.
/// </summary>
internal sealed class UnipileClient(HttpClient http)
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public async Task<string> CreateHostedLinkAsync(HostedLinkRequest request, CancellationToken ct)
    {
        using var response = await SendAsync(
            new HttpRequestMessage(HttpMethod.Post, "hosted/accounts/link")
            {
                Content = JsonContent.Create(request, options: Json),
            },
            ct);

        return response.RootElement.GetProperty("url").GetString()
            ?? throw new ProviderException("Unipile didn't return a sign-in link.");
    }

    public Task<JsonDocument> ListAccountsAsync(CancellationToken ct) =>
        SendAsync(new HttpRequestMessage(HttpMethod.Get, "accounts?limit=250"), ct);

    public Task<JsonDocument> GetAccountAsync(string accountId, CancellationToken ct) =>
        SendAsync(new HttpRequestMessage(HttpMethod.Get, $"accounts/{Uri.EscapeDataString(accountId)}"), ct);

    public Task<JsonDocument> SendEmailAsync(
        string accountId,
        string toAddress,
        string? toName,
        string subject,
        string body,
        string idempotencyKey,
        string? replyTo,
        CancellationToken ct)
    {
        var to = JsonSerializer.Serialize(new[] { new { display_name = toName ?? toAddress, identifier = toAddress } });
        var form = new MultipartFormDataContent
        {
            { new StringContent(accountId), "account_id" },
            { new StringContent(subject), "subject" },
            { new StringContent(body), "body" },
            { new StringContent(to), "to" },
        };

        // Unipile threads the email under the one it answers.
        if (replyTo is not null)
        {
            form.Add(new StringContent(replyTo), "reply_to");
        }

        var request = new HttpRequestMessage(HttpMethod.Post, "emails") { Content = form };
        request.Headers.Add("Idempotency-Key", idempotencyKey);
        return SendAsync(request, ct);
    }

    /// <summary>A LinkedIn profile, looked up by the part of the link after /in/.</summary>
    public Task<JsonDocument> GetUserProfileAsync(string accountId, string publicIdentifier, CancellationToken ct) =>
        SendAsync(
            new HttpRequestMessage(
                HttpMethod.Get,
                $"users/{Uri.EscapeDataString(publicIdentifier)}?account_id={Uri.EscapeDataString(accountId)}"),
            ct);

    public async Task SendInvitationAsync(string accountId, string providerId, string? note, CancellationToken ct)
    {
        var body = new InvitationRequest(providerId, accountId, note);
        using var _ = await SendAsync(
            new HttpRequestMessage(HttpMethod.Post, "users/invite") { Content = JsonContent.Create(body, options: Json) },
            ct);
    }

    /// <summary>Messages a LinkedIn user, starting the chat if there isn't one yet.</summary>
    public Task<JsonDocument> StartChatAsync(string accountId, string providerId, string text, CancellationToken ct)
    {
        var form = new MultipartFormDataContent
        {
            { new StringContent(accountId), "account_id" },
            { new StringContent(providerId), "attendees_ids" },
            { new StringContent(text), "text" },
        };

        return SendAsync(new HttpRequestMessage(HttpMethod.Post, "chats") { Content = form }, ct);
    }

    public Task<JsonDocument> ListEmailsAsync(string accountId, DateTimeOffset after, string? cursor, CancellationToken ct) =>
        SendAsync(new HttpRequestMessage(HttpMethod.Get, PageQuery("emails", accountId, after, cursor)), ct);

    public Task<JsonDocument> ListMessagesAsync(string accountId, DateTimeOffset after, string? cursor, CancellationToken ct) =>
        SendAsync(new HttpRequestMessage(HttpMethod.Get, PageQuery("messages", accountId, after, cursor)), ct);

    /// <summary>One page of the account's connections.</summary>
    public Task<JsonDocument> ListRelationsAsync(string accountId, string? cursor, CancellationToken ct)
    {
        var query = $"users/relations?account_id={Uri.EscapeDataString(accountId)}&limit=100";
        return SendAsync(
            new HttpRequestMessage(HttpMethod.Get, cursor is null ? query : $"{query}&cursor={Uri.EscapeDataString(cursor)}"),
            ct);
    }

    private static string PageQuery(string path, string accountId, DateTimeOffset after, string? cursor)
    {
        var query = $"{path}?account_id={Uri.EscapeDataString(accountId)}&limit=100" +
            $"&after={Uri.EscapeDataString(after.UtcDateTime.ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'", CultureInfo.InvariantCulture))}";
        return cursor is null ? query : $"{query}&cursor={Uri.EscapeDataString(cursor)}";
    }

    /// <summary>Sends a request and returns the JSON body, or throws a ProviderException with Unipile's reason.</summary>
    private async Task<JsonDocument> SendAsync(HttpRequestMessage request, CancellationToken ct)
    {
        using (request)
        {
            HttpResponseMessage response;
            try
            {
                response = await http.SendAsync(request, ct);
            }
            catch (HttpRequestException ex)
            {
                throw new ProviderException("Couldn't reach Unipile. Check the Unipile address in settings.", ex);
            }

            using (response)
            {
                var text = await response.Content.ReadAsStringAsync(ct);
                if (!response.IsSuccessStatusCode)
                {
                    throw new ProviderException($"Unipile refused the request: {ReadError(text, (int)response.StatusCode)}");
                }

                return JsonDocument.Parse(string.IsNullOrWhiteSpace(text) ? "{}" : text);
            }
        }
    }

    /// <summary>Unipile errors are problem-details JSON. Falls back to the status code.</summary>
    private static string ReadError(string body, int status)
    {
        try
        {
            using var json = JsonDocument.Parse(body);
            foreach (var field in new[] { "detail", "title", "message" })
            {
                if (json.RootElement.TryGetProperty(field, out var value) && value.GetString() is { Length: > 0 } message)
                {
                    return message;
                }
            }
        }
        catch (JsonException)
        {
            // Not JSON; use the status code below.
        }

        return $"HTTP {status}";
    }
}

internal sealed record HostedLinkRequest(
    [property: JsonPropertyName("type")] string Type,
    [property: JsonPropertyName("providers")] IReadOnlyList<string>? Providers,
    [property: JsonPropertyName("api_url")] string ApiUrl,
    [property: JsonPropertyName("expiresOn")] string ExpiresOn,
    [property: JsonPropertyName("success_redirect_url")] string SuccessRedirectUrl,
    [property: JsonPropertyName("failure_redirect_url")] string FailureRedirectUrl,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("notify_url")] string NotifyUrl,
    [property: JsonPropertyName("reconnect_account")] string? ReconnectAccount);

internal sealed record InvitationRequest(
    [property: JsonPropertyName("provider_id")] string ProviderId,
    [property: JsonPropertyName("account_id")] string AccountId,
    [property: JsonPropertyName("message")] string? Message);
