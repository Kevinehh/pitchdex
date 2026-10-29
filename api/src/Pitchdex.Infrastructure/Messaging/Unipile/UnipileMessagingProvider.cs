using System.Globalization;
using System.Text.Json;
using Pitchdex.Application.Integrations;
using Pitchdex.Domain.Accounts;
using Pitchdex.Domain.Messages;

namespace Pitchdex.Infrastructure.Messaging.Unipile;

/// <summary>Pitchdex's messaging interfaces, carried out through Unipile.</summary>
internal sealed class UnipileMessagingProvider(UnipileClient unipile, MessagingSettings settings, TimeProvider clock)
    : IAccountProvider, IEmailChannel, ILinkedInChannel, IInboxProvider
{
    /// <summary>Unipile's names for the sign-in options each kind of account offers.</summary>
    /// <summary>Google and Microsoft sign-in only: no IMAP/SMTP mailboxes that founders set up by hand.</summary>
    private static readonly string[] EmailProviders = ["GOOGLE", "OUTLOOK"];
    private static readonly string[] LinkedInProviders = ["LINKEDIN"];

    /// <summary>How many pages one sync reads per account, so a huge backlog can't stall the others.</summary>
    private const int MaxPagesPerSync = 5;

    /// <summary>The workspace id rides along as the link's name, and comes back in the webhook.</summary>
    public async Task<Uri> CreateConnectLinkAsync(AccountChannel channel, Guid workspaceId, CancellationToken ct)
    {
        var providers = channel == AccountChannel.Email ? EmailProviders : LinkedInProviders;
        return new Uri(await unipile.CreateHostedLinkAsync(
            HostedLink("create", providers, null, channel, workspaceId.ToString()), ct));
    }

    public async Task<Uri> CreateReconnectLinkAsync(string accountExternalId, CancellationToken ct) =>
        new(await unipile.CreateHostedLinkAsync(HostedLink("reconnect", null, accountExternalId, channel: null, name: "reconnect"), ct));

    private HostedLinkRequest HostedLink(
        string type,
        IReadOnlyList<string>? providers,
        string? reconnectAccount,
        AccountChannel? channel,
        string name) =>
        new(
            type,
            providers,
            settings.UnipileBaseUrl!,
            // Short-lived on purpose: the link is used right away.
            clock.GetUtcNow().AddHours(1).UtcDateTime.ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'", CultureInfo.InvariantCulture),
            settings.ConnectedRedirectUrl(channel),
            settings.FailedRedirectUrl(channel),
            name,
            settings.AccountWebhookUrl,
            reconnectAccount);

    public async Task<IReadOnlyList<ProviderAccount>> ListAccountsAsync(CancellationToken ct)
    {
        using var response = await unipile.ListAccountsAsync(ct);
        return response.Items().Select(ToAccount).OfType<ProviderAccount>().ToList();
    }

    public async Task<ProviderAccount?> GetAccountAsync(string externalId, CancellationToken ct)
    {
        using var response = await unipile.GetAccountAsync(externalId, ct);
        return ToAccount(response.RootElement);
    }

    /// <summary>Email and LinkedIn accounts become ProviderAccounts. Other kinds (WhatsApp, calendars) are skipped.</summary>
    private static ProviderAccount? ToAccount(JsonElement item)
    {
        var id = item.Str("id");
        var type = item.Str("type");
        if (id is null || type is null)
        {
            return null;
        }

        var (channel, address) = type switch
        {
            "LINKEDIN" => (AccountChannel.LinkedIn, item.Str("connection_params", "im", "publicIdentifier") ?? item.Str("connection_params", "im", "username")),
            "GOOGLE_OAUTH" or "OUTLOOK" or "ICLOUD" => (AccountChannel.Email, item.Str("connection_params", "mail", "username")),
            "MAIL" => (AccountChannel.Email, item.Str("connection_params", "mail", "imap_user")),
            _ => ((AccountChannel?)null, (string?)null),
        };

        if (channel is null)
        {
            return null;
        }

        return new ProviderAccount(id, channel.Value, type, item.Str("name") ?? address ?? type, address, ReadStatus(item));
    }

    /// <summary>Unipile reports a status per data source. Any source asking for credentials means reconnect.</summary>
    private static AccountStatus ReadStatus(JsonElement item)
    {
        if (!item.TryGetProperty("sources", out var sources) || sources.ValueKind != JsonValueKind.Array)
        {
            return AccountStatus.Connected;
        }

        var statuses = sources.EnumerateArray().Select(s => s.Str("status")).ToList();
        return statuses.Any(s => s is "CREDENTIALS" or "PERMISSIONS" or "ERROR" or "STOPPED")
            ? AccountStatus.NeedsReconnect
            : AccountStatus.Connected;
    }

    public async Task<SentItem> SendAsync(OutgoingEmail email, CancellationToken ct)
    {
        using var response = await unipile.SendEmailAsync(
            email.AccountExternalId, email.ToAddress, email.ToName, email.Subject, email.Body, email.IdempotencyKey, email.ReplyToExternalId, ct);

        var root = response.RootElement;
        return new SentItem(root.Str("provider_id") ?? root.Str("tracking_id"), root.Str("thread_id"));
    }

    public async Task<string> ResolveProfileIdAsync(string accountExternalId, string publicIdentifier, CancellationToken ct)
    {
        using var profile = await unipile.GetUserProfileAsync(accountExternalId, publicIdentifier, ct);
        return profile.RootElement.Str("provider_id")
            ?? throw new ProviderException("LinkedIn didn't return that profile. Check the lead's LinkedIn link.");
    }

    public Task SendInvitationAsync(string accountExternalId, string profileId, string? note, CancellationToken ct) =>
        unipile.SendInvitationAsync(accountExternalId, profileId, note, ct);

    public async Task<SentItem> SendMessageAsync(string accountExternalId, string profileId, string text, CancellationToken ct)
    {
        using var response = await unipile.StartChatAsync(accountExternalId, profileId, text, ct);
        var root = response.RootElement;
        return new SentItem(root.Str("message_id"), root.Str("chat_id"));
    }

    public async Task<IReadOnlyList<LinkedInConnection>> ListRecentConnectionsAsync(string accountExternalId, int max, CancellationToken ct)
    {
        var results = new List<LinkedInConnection>();
        string? cursor = null;

        while (results.Count < max)
        {
            using var response = await unipile.ListRelationsAsync(accountExternalId, cursor, ct);
            results.AddRange(response.Items()
                .Select(item => item.Str("member_id") is { } id ? new LinkedInConnection(id, item.Str("public_identifier")) : null)
                .OfType<LinkedInConnection>());

            cursor = response.Cursor();
            if (cursor is null)
            {
                break;
            }
        }

        return results.Take(max).ToList();
    }

    public async Task<IReadOnlyList<ProviderMessage>> FetchSinceAsync(ConnectedAccount account, DateTimeOffset since, CancellationToken ct)
    {
        var results = new List<ProviderMessage>();
        string? cursor = null;

        for (var page = 0; page < MaxPagesPerSync; page++)
        {
            using var response = account.Channel == AccountChannel.Email
                ? await unipile.ListEmailsAsync(account.ExternalId, since, cursor, ct)
                : await unipile.ListMessagesAsync(account.ExternalId, since, cursor, ct);

            results.AddRange(response.Items()
                .Select(item => account.Channel == AccountChannel.Email ? ToEmail(item, account) : ToLinkedInMessage(item))
                .OfType<ProviderMessage>());

            cursor = response.Cursor();
            if (cursor is null)
            {
                break;
            }
        }

        return results.OrderBy(m => m.SentAt).ToList();
    }

    private static ProviderMessage? ToEmail(JsonElement item, ConnectedAccount account)
    {
        var id = item.Str("id");
        if (id is null)
        {
            return null;
        }

        var from = item.Str("from_attendee", "identifier");
        return new ProviderMessage(
            id,
            item.Str("thread_id"),
            MessageKind.Email,
            SentByAccount: from is not null && string.Equals(from, account.Address, StringComparison.OrdinalIgnoreCase),
            item.Str("subject"),
            item.Str("body_plain") is { Length: > 0 } plain ? plain : item.Str("body") ?? "",
            from,
            item.Date("date") ?? DateTimeOffset.UtcNow);
    }

    private static ProviderMessage? ToLinkedInMessage(JsonElement item)
    {
        var id = item.Str("id");
        if (id is null)
        {
            return null;
        }

        return new ProviderMessage(
            id,
            item.Str("chat_id"),
            MessageKind.LinkedInMessage,
            SentByAccount: item.Flag("is_sender"),
            Subject: null,
            item.Str("text") ?? "",
            item.Str("sender_id"),
            item.Date("timestamp") ?? DateTimeOffset.UtcNow);
    }
}
