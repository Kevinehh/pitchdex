using Pitchdex.Domain.Campaigns;
using Pitchdex.Domain.Common;
using Pitchdex.Domain.Messages;

namespace Pitchdex.Domain.Accounts;

/// <summary>
/// A founder's mailbox or LinkedIn account, connected through the messaging provider.
/// Pitchdex never stores passwords or sessions, only the provider's id for the account.
/// </summary>
public sealed class ConnectedAccount : IHasTimestamps, IWorkspaceOwned
{
    public Guid Id { get; private init; } = Guid.CreateVersion7();

    public Guid WorkspaceId { get; set; }

    /// <summary>The provider's id for this account. Unique.</summary>
    public required string ExternalId { get; set; }

    public AccountChannel Channel { get; set; }

    /// <summary>The provider's account type, such as GOOGLE_OAUTH, OUTLOOK, MAIL or LINKEDIN.</summary>
    public required string ProviderType { get; set; }

    public required string DisplayName { get; set; }

    /// <summary>The email address, or the LinkedIn profile name.</summary>
    public string? Address { get; set; }

    public AccountStatus Status { get; set; } = AccountStatus.Connected;

    /// <summary>When new messages were last pulled in. Empty until the first sync.</summary>
    public DateTimeOffset? LastSyncedAt { get; set; }

    /// <summary>Connection requests a day. Only LinkedIn accounts send them.</summary>
    public int DailyInvitationLimit { get; set; } = SendingLimits.DefaultPerDay(MessageKind.LinkedInInvitation);

    /// <summary>LinkedIn messages a day.</summary>
    public int DailyMessageLimit { get; set; } = SendingLimits.DefaultPerDay(MessageKind.LinkedInMessage);

    /// <summary>Emails a day. Only mailboxes send them.</summary>
    public int DailyEmailLimit { get; set; } = SendingLimits.DefaultPerDay(MessageKind.Email);

    public int DailyLimit(MessageKind kind) => kind switch
    {
        MessageKind.Email => DailyEmailLimit,
        MessageKind.LinkedInInvitation => DailyInvitationLimit,
        _ => DailyMessageLimit,
    };

    /// <summary>Sets one daily limit, kept between 0 (none of that kind) and the safe maximum.</summary>
    public void SetDailyLimit(MessageKind kind, int limit)
    {
        var safe = Math.Clamp(limit, 0, SendingLimits.MaxPerDay(kind));
        switch (kind)
        {
            case MessageKind.Email: DailyEmailLimit = safe; break;
            case MessageKind.LinkedInInvitation: DailyInvitationLimit = safe; break;
            default: DailyMessageLimit = safe; break;
        }
    }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}

public enum AccountChannel
{
    Email,
    LinkedIn,
}

public enum AccountStatus
{
    Connected,

    /// <summary>The provider lost access, for example after a password change. The founder must reconnect.</summary>
    NeedsReconnect,

    /// <summary>No longer exists at the provider.</summary>
    Disconnected,
}
