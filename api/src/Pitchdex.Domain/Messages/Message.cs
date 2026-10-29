using Pitchdex.Domain.Common;

namespace Pitchdex.Domain.Messages;

/// <summary>
/// One email, LinkedIn message or LinkedIn connection request, sent or received
/// through a connected account. Only conversations with leads are stored.
/// </summary>
public sealed class Message : IHasTimestamps, IWorkspaceOwned
{
    public Guid Id { get; private init; } = Guid.CreateVersion7();

    public Guid WorkspaceId { get; set; }

    public Guid AccountId { get; set; }

    /// <summary>The lead this conversation is with. Empty if it couldn't be matched.</summary>
    public Guid? LeadId { get; set; }

    /// <summary>The campaign enrollment and step that sent this. Empty for manual sends and replies.</summary>
    public Guid? EnrollmentId { get; set; }

    public Guid? CampaignStepId { get; set; }

    public MessageKind Kind { get; set; }

    public MessageDirection Direction { get; set; }

    /// <summary>The provider's id for the message, used to avoid storing it twice.</summary>
    public string? ExternalId { get; set; }

    /// <summary>The email thread or LinkedIn chat it belongs to.</summary>
    public string? ThreadId { get; set; }

    public string? Subject { get; set; }

    public required string Body { get; set; }

    /// <summary>The other person: an email address, or the provider's LinkedIn profile id.</summary>
    public string? CounterpartIdentifier { get; set; }

    public DateTimeOffset SentAt { get; set; }

    /// <summary>When the founder opened this received message. Empty means unread. Unused for sent messages.</summary>
    public DateTimeOffset? ReadAt { get; set; }

    /// <summary>For a sent connection request: when the lead accepted it. Empty while pending.</summary>
    public DateTimeOffset? AcceptedAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}

public enum MessageKind
{
    Email,
    LinkedInMessage,
    LinkedInInvitation,
}

public enum MessageDirection
{
    Outbound,
    Inbound,
}
