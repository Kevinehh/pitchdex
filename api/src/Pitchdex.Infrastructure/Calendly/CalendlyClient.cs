using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using Pitchdex.Application.Integrations;

namespace Pitchdex.Infrastructure.Calendly;

/// <summary>
/// Calendly's REST API v2 (https://developer.calendly.com). Read-only calls, each made with
/// the founder's own personal access token. Responses are read field by field, like the
/// Unipile client, so a field Calendly adds never breaks anything.
/// </summary>
internal sealed class CalendlyClient(HttpClient http) : ICalendlyClient
{
    public const string BaseAddress = "https://api.calendly.com/";

    /// <summary>Calendly's largest page. A founder rarely has more events than this in a month.</summary>
    private const int PageSize = 100;

    /// <summary>Stops a runaway listing; ten pages is a thousand events.</summary>
    private const int MaxPages = 10;

    public async Task<CalendlyUser> GetCurrentUserAsync(string token, CancellationToken ct)
    {
        using var json = await GetAsync(token, "users/me", ct);
        var user = json.RootElement.GetProperty("resource");
        return new CalendlyUser(
            Text(user, "uri") ?? throw new ProviderException("Calendly didn't say whose token this is."),
            Text(user, "name") ?? "",
            Text(user, "email") ?? "",
            Text(user, "scheduling_url") ?? "");
    }

    public async Task<IReadOnlyList<CalendlyEvent>> ListEventsAsync(
        string token,
        string userUri,
        DateTimeOffset startsAfter,
        CancellationToken ct)
    {
        var query = $"scheduled_events?user={Uri.EscapeDataString(userUri)}&count={PageSize}&sort=start_time:asc" +
            $"&min_start_time={Uri.EscapeDataString(startsAfter.UtcDateTime.ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", CultureInfo.InvariantCulture))}";

        return await ListAsync(token, query, item => new CalendlyEvent(
            Text(item, "uri") ?? "",
            Text(item, "name") ?? "Meeting",
            Date(item, "start_time"),
            Date(item, "end_time"),
            Text(item, "status") == "canceled",
            JoinUrl(item),
            Date(item, "created_at")), ct);
    }

    public Task<IReadOnlyList<CalendlyInvitee>> ListInviteesAsync(string token, string eventUri, CancellationToken ct)
    {
        // The event's address comes back from Calendly; only ever follow it to Calendly.
        if (!eventUri.StartsWith(BaseAddress + "scheduled_events/", StringComparison.Ordinal))
        {
            throw new ProviderException("Calendly returned an event Pitchdex can't read.");
        }

        return ListAsync(token, $"{eventUri}/invitees?count={PageSize}", item => new CalendlyInvitee(
            Text(item, "uri") ?? "",
            Text(item, "email") ?? "",
            Text(item, "name") ?? "",
            Text(item, "status") == "canceled"), ct);
    }

    /// <summary>Every page of a collection, following next_page_token.</summary>
    private async Task<IReadOnlyList<T>> ListAsync<T>(
        string token,
        string query,
        Func<JsonElement, T> read,
        CancellationToken ct)
    {
        var items = new List<T>();
        string? pageToken = null;
        for (var page = 0; page < MaxPages; page++)
        {
            var path = pageToken is null ? query : $"{query}&page_token={Uri.EscapeDataString(pageToken)}";
            using var json = await GetAsync(token, path, ct);

            foreach (var item in json.RootElement.GetProperty("collection").EnumerateArray())
            {
                items.Add(read(item));
            }

            pageToken = json.RootElement.TryGetProperty("pagination", out var pagination)
                ? Text(pagination, "next_page_token")
                : null;
            if (pageToken is null)
            {
                break;
            }
        }

        return items;
    }

    /// <summary>Calls Calendly and returns the JSON body, or throws a ProviderException the founder can act on.</summary>
    private async Task<JsonDocument> GetAsync(string token, string path, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, path);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        HttpResponseMessage response;
        try
        {
            response = await http.SendAsync(request, ct);
        }
        catch (HttpRequestException ex)
        {
            throw new ProviderException("Couldn't reach Calendly. Try again in a minute.", ex);
        }

        using (response)
        {
            var text = await response.Content.ReadAsStringAsync(ct);
            if (response.StatusCode == HttpStatusCode.Unauthorized)
            {
                throw new ProviderException("Calendly didn't accept the token. Create a new personal access token and connect again.");
            }

            if (!response.IsSuccessStatusCode)
            {
                throw new ProviderException($"Calendly refused the request: {ReadError(text, (int)response.StatusCode)}");
            }

            return JsonDocument.Parse(text);
        }
    }

    /// <summary>Calendly errors carry a title and a message. Falls back to the status code.</summary>
    private static string ReadError(string body, int status)
    {
        try
        {
            using var json = JsonDocument.Parse(body);
            return Text(json.RootElement, "message") ?? Text(json.RootElement, "title") ?? $"HTTP {status}";
        }
        catch (JsonException)
        {
            return $"HTTP {status}";
        }
    }

    /// <summary>The video call link, kept only when it's https so it's always safe to link to.</summary>
    private static string? JoinUrl(JsonElement calendlyEvent) =>
        calendlyEvent.TryGetProperty("location", out var location) &&
        location.ValueKind == JsonValueKind.Object &&
        Text(location, "join_url") is { } url &&
        url.StartsWith("https://", StringComparison.OrdinalIgnoreCase)
            ? url
            : null;

    private static string? Text(JsonElement element, string name) =>
        element.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String ? value.GetString() : null;

    private static DateTimeOffset Date(JsonElement element, string name) =>
        DateTimeOffset.Parse(Text(element, name) ?? throw new ProviderException($"Calendly left out {name}."), CultureInfo.InvariantCulture);
}
