using Pitchdex.Domain.Accounts;
using Pitchdex.Domain.Leads;
using Pitchdex.Domain.Messages;

namespace Pitchdex.Application.Integrations;

/*
 * What Pitchdex needs from a messaging provider. Unipile implements these today, and a
 * practice version stands in when no Unipile key is set. Use cases only ever see these
 * interfaces, so swapping providers never touches them.
 */

/// <summary>An account as the provider reports it.</summary>
public sealed record ProviderAccount(
    string ExternalId,
    AccountChannel Channel,
    string ProviderType,
    string DisplayName,
    string? Address,
    AccountStatus Status);

/// <summary>Connecting accounts and listing the ones connected.</summary>
public interface IAccountProvider
{
    /// <summary>
    /// A link to the provider's own sign-in page. The founder signs in there, so Pitchdex
    /// never sees a password, then the provider sends them back to the Account page. The
    /// workspace goes with the link, so the new account can be added to the right one.
    /// </summary>
    Task<Uri> CreateConnectLinkAsync(AccountChannel channel, Guid workspaceId, CancellationToken ct);

    /// <summary>A link that signs an account back in after the provider lost access.</summary>
    Task<Uri> CreateReconnectLinkAsync(string accountExternalId, CancellationToken ct);

    Task<IReadOnlyList<ProviderAccount>> ListAccountsAsync(CancellationToken ct);

    /// <summary>One account, or empty if the provider doesn't have it.</summary>
    Task<ProviderAccount?> GetAccountAsync(string externalId, CancellationToken ct);

    /// <summary>Unlinks an account at the provider, so it stops syncing and stops being billed.</summary>
    Task RemoveAccountAsync(string externalId, CancellationToken ct);
}

/// <param name="IdempotencyKey">Stops a retried request from sending twice.</param>
/// <param name="ReplyToExternalId">The provider's id for the email this answers, so it lands in the same thread.</param>
public sealed record OutgoingEmail(
    string AccountExternalId,
    string ToAddress,
    string? ToName,
    string Subject,
    string Body,
    string IdempotencyKey,
    string? ReplyToExternalId = null);

/// <summary>The provider's ids for something just sent, when it reports them.</summary>
public sealed record SentItem(string? ExternalId, string? ThreadId);

public interface IEmailChannel
{
    Task<SentItem> SendAsync(OutgoingEmail email, CancellationToken ct);
}

public interface ILinkedInChannel
{
    /// <summary>
    /// A person's profile, by the part of their link after /in/ or by the provider's id for them.
    /// Each lookup counts as a LinkedIn profile view. <paramref name="withBackground"/> adds their
    /// work history, education and About section, which costs LinkedIn a few more requests.
    /// </summary>
    Task<LinkedInPerson> GetProfileAsync(string accountExternalId, string identifier, bool withBackground, CancellationToken ct);

    /// <summary>
    /// Like GetProfileAsync, but LinkedIn tells the person: they see the account under "Who viewed
    /// your profile". Plain lookups don't tell them.
    /// </summary>
    Task<LinkedInPerson> ViewProfileAsync(string accountExternalId, string identifier, CancellationToken ct);

    Task SendInvitationAsync(string accountExternalId, string profileId, string? note, CancellationToken ct);

    /// <summary>Only works with people already connected to the account.</summary>
    Task<SentItem> SendMessageAsync(string accountExternalId, string profileId, string text, CancellationToken ct);

    /// <summary>
    /// The account's most recent connections, up to <paramref name="max"/>. Accepted connection
    /// requests show up here, which is how acceptance is detected.
    /// </summary>
    Task<IReadOnlyList<LinkedInConnection>> ListRecentConnectionsAsync(string accountExternalId, int max, CancellationToken ct);
}

/// <summary>Someone the LinkedIn account is connected to.</summary>
/// <param name="ProviderId">The provider's id for the person, the same id messages and invitations use.</param>
/// <param name="PublicIdentifier">The part of their profile link after /in/.</param>
public sealed record LinkedInConnection(string ProviderId, string? PublicIdentifier);

/// <summary>A LinkedIn profile as the provider reports it.</summary>
/// <param name="ProviderId">The provider's id for the person, needed for every action.</param>
/// <param name="Degree">How close they are to the account that looked them up.</param>
/// <param name="Background">Only when asked for.</param>
public sealed record LinkedInPerson(
    string ProviderId,
    string? Headline,
    string? Location,
    string? PictureUrl,
    LinkedInDegree? Degree,
    bool IsOpenProfile,
    bool IsPremium,
    LinkedInBackground? Background = null);

/// <summary>The longer part of a profile, shown when a founder opens a lead.</summary>
public sealed record LinkedInBackground(
    string? About,
    int? Followers,
    int? Connections,
    int? SharedConnections,
    IReadOnlyList<LinkedInRole> Experience,
    IReadOnlyList<LinkedInSchool> Education);

/// <param name="End">Empty while they're still in the role.</param>
public sealed record LinkedInRole(string Position, string? Company, string? LogoUrl, DateOnly? Start, DateOnly? End, string? Description);

public sealed record LinkedInSchool(string School, string? Degree, string? LogoUrl, DateOnly? Start, DateOnly? End);

/// <summary>A message the provider has, sent or received, for the inbox sync to store.</summary>
/// <param name="CounterpartIdentifier">The other person: an email address, or a LinkedIn profile id.</param>
public sealed record ProviderMessage(
    string ExternalId,
    string? ThreadId,
    MessageKind Kind,
    bool SentByAccount,
    string? Subject,
    string Body,
    string? CounterpartIdentifier,
    DateTimeOffset SentAt);

public interface IInboxProvider
{
    /// <summary>Messages in one account newer than <paramref name="since"/>, oldest first.</summary>
    Task<IReadOnlyList<ProviderMessage>> FetchSinceAsync(
        ConnectedAccount account,
        DateTimeOffset since,
        CancellationToken ct);
}

/// <summary>The provider refused or failed a request. The message is safe to show the founder.</summary>
public sealed class ProviderException(string message, Exception? inner = null) : Exception(message, inner);
