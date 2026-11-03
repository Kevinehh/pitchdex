using Pitchdex.Domain.Common;

namespace Pitchdex.Domain.Leads;

/// <summary>
/// An investor a founder plans to contact or is already talking to.
/// </summary>
public sealed class Lead : IHasTimestamps, IWorkspaceOwned
{
    public Guid Id { get; private init; } = Guid.CreateVersion7();

    public Guid WorkspaceId { get; set; }

    public required string FullName { get; set; }

    public required string Email { get; set; }

    public string? Firm { get; set; }

    public LeadStatus Status { get; set; } = LeadStatus.New;

    /// <summary>The investor this lead was saved from in Explore. Empty for leads added by hand.</summary>
    public Guid? InvestorId { get; set; }

    public string? LinkedInUrl { get; set; }

    /// <summary>The messaging provider's id for this person on LinkedIn, looked up on first contact.</summary>
    public string? LinkedInProviderId { get; set; }

    /// <summary>What the lead's LinkedIn profile showed last time. Empty until it's first looked up.</summary>
    public LinkedInSnapshot? LinkedIn { get; set; }

    /// <summary>When the profile was last looked up, whether or not that worked. Schedules the next refresh.</summary>
    public DateTimeOffset? LinkedInCheckedAt { get; set; }

    /// <summary>Marked important by the founder. Starred conversations get their own Inbox tab.</summary>
    public bool IsStarred { get; set; }

    /// <summary>When the conversation was archived. Cleared when the lead writes again, so it comes back.</summary>
    public DateTimeOffset? ArchivedAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
