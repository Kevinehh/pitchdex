using Pitchdex.Domain.Common;

namespace Pitchdex.Domain.Meetings;

/// <summary>
/// A call someone booked on the founder's Calendly, one per person who booked. Linked to the
/// lead whose email they booked with; calls from anyone else are kept too, so the Calendar
/// shows the founder's whole schedule, and are linked if that email later becomes a lead's.
/// </summary>
public sealed class Meeting : IHasTimestamps, IWorkspaceOwned
{
    public Guid Id { get; private init; } = Guid.CreateVersion7();

    public Guid WorkspaceId { get; set; }

    /// <summary>The lead who booked. Empty when the email they booked with isn't a lead's.</summary>
    public Guid? LeadId { get; set; }

    /// <summary>The name they gave Calendly when booking.</summary>
    public required string InviteeName { get; set; }

    /// <summary>The email they booked with, which is how they're matched to a lead.</summary>
    public required string InviteeEmail { get; set; }

    /// <summary>The Calendly event type's name, such as "30 Minute Meeting".</summary>
    public required string Title { get; set; }

    public DateTimeOffset StartsAt { get; set; }

    public DateTimeOffset EndsAt { get; set; }

    /// <summary>The video call link, when the event type has one.</summary>
    public string? JoinUrl { get; set; }

    public MeetingStatus Status { get; set; } = MeetingStatus.Scheduled;

    /// <summary>Calendly's address for the event. Its status and time are refreshed from it.</summary>
    public required string EventUri { get; init; }

    /// <summary>Calendly's address for this person's booking of the event. One meeting per invitee.</summary>
    public required string InviteeUri { get; init; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}

public enum MeetingStatus
{
    Scheduled,
    Canceled,
}
