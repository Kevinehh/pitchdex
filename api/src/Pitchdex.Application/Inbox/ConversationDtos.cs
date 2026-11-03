using Pitchdex.Application.Leads;
using Pitchdex.Application.Meetings;
using Pitchdex.Domain.Accounts;
using Pitchdex.Domain.Leads;
using Pitchdex.Domain.Messages;

namespace Pitchdex.Application.Inbox;

/// <summary>Which conversations the Inbox shows.</summary>
public enum ConversationView
{
    /// <summary>Everything not archived.</summary>
    All,
    Unread,
    Starred,
    Archived,
}

/// <summary>One row of the Inbox: a lead and the latest message with them, by any channel.</summary>
/// <param name="LastSnippet">The start of the latest message, for a one-line preview.</param>
public sealed record ConversationSummaryDto(
    Guid LeadId,
    string LeadName,
    string? LeadFirm,
    string? LeadPictureUrl,
    LeadStatus LeadStatus,
    MessageKind LastKind,
    MessageDirection LastDirection,
    string LastSnippet,
    DateTimeOffset LastMessageAt,
    int UnreadCount,
    bool IsStarred,
    bool IsArchived);

/// <summary>How many conversations each Inbox tab holds.</summary>
public sealed record ConversationCounts(int Unread, int Starred, int Archived);

/// <summary>A whole conversation, with what the side panel shows about the lead.</summary>
/// <param name="Meetings">Calls the lead booked on the founder's Calendly, newest first.</param>
public sealed record ConversationDto(
    ConversationLeadDto Lead,
    bool IsArchived,
    int UnreadCount,
    IReadOnlyList<MessageDto> Messages,
    IReadOnlyList<LeadCampaignDto> Campaigns,
    IReadOnlyList<MeetingDto> Meetings,
    ReplyOptionsDto Reply);

/// <summary>
/// The lead, plus what's known about them from Explore when they were saved from there, and
/// from LinkedIn once their profile has been looked up.
/// </summary>
public sealed record ConversationLeadDto(
    Guid Id,
    string FullName,
    string Email,
    string? Firm,
    string? LinkedInUrl,
    LeadStatus Status,
    bool IsStarred,
    string? Title,
    string? Location,
    string? Website,
    LeadLinkedInDto? LinkedIn);

/// <param name="DefaultChannel">The channel the lead last wrote on, so a reply goes back the same way.</param>
/// <param name="CalendlyUrl">The founder's booking link, to drop into a reply. Empty when none is set.</param>
public sealed record ReplyOptionsDto(
    bool CanEmail,
    bool CanLinkedIn,
    AccountChannel DefaultChannel,
    string? EmailSubject,
    string? CalendlyUrl);
