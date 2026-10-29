using Pitchdex.Domain.Accounts;

namespace Pitchdex.Infrastructure.Messaging;

/// <summary>
/// The "Messaging" section of the API's settings. Without a Unipile key the app runs in
/// practice mode, which simulates connected accounts and replies so everything can be
/// tried locally. Keep the key in user secrets, never in appsettings files.
/// </summary>
public sealed record MessagingSettings
{
    public const string Section = "Messaging";

    /// <summary>The web app's address. Founders come back here after signing in to an account.</summary>
    public string FrontendUrl { get; init; } = "http://localhost:5173";

    /// <summary>Your Unipile DSN, such as https://api8.unipile.com:13851.</summary>
    public string? UnipileBaseUrl { get; init; }

    public string? UnipileApiKey { get; init; }

    /// <summary>
    /// This API's public address, such as https://api.pitchdex.ai. Unipile calls it when a
    /// founder finishes connecting an account. Locally, a tunnel (ngrok) to this API.
    /// </summary>
    public string? PublicApiUrl { get; init; }

    /// <summary>Shared with Unipile in the webhook address, so only Unipile can add accounts. Keep it in user secrets.</summary>
    public string? WebhookSecret { get; init; }

    public bool UsesUnipile =>
        !string.IsNullOrWhiteSpace(UnipileBaseUrl) && !string.IsNullOrWhiteSpace(UnipileApiKey);

    /// <summary>Where Unipile reports a newly connected account, with the workspace that started it.</summary>
    public string AccountWebhookUrl =>
        $"{PublicApiUrl?.TrimEnd('/')}/api/webhooks/unipile/accounts?secret={Uri.EscapeDataString(WebhookSecret ?? "")}";

    /// <summary>
    /// Where the provider sends the founder after signing in: the Account page, which then
    /// refreshes the accounts. Mailboxes land on its Email accounts tab. A reconnect doesn't
    /// know the channel, so it lands on the first tab.
    /// </summary>
    public string ConnectedRedirectUrl(AccountChannel? channel) => AccountPageUrl(connected: true, channel);

    public string FailedRedirectUrl(AccountChannel? channel) => AccountPageUrl(connected: false, channel);

    private string AccountPageUrl(bool connected, AccountChannel? channel) =>
        $"{FrontendUrl.TrimEnd('/')}/account?connected={(connected ? 1 : 0)}" +
        (channel == AccountChannel.Email ? "&tab=email" : "");
}
