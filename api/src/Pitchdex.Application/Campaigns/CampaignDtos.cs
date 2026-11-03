using Pitchdex.Domain.Campaigns;

namespace Pitchdex.Application.Campaigns;

/// <summary>A saved step. ParentStepId and Branch place it in the tree; the first step has neither.</summary>
public sealed record StepDto(
    Guid Id,
    int Position,
    Guid? ParentStepId,
    StepBranch? Branch,
    StepType Type,
    int DelayDays,
    int WaitDays,
    string? Subject,
    string Body);

/// <summary>How many enrolled leads are in each state.</summary>
public sealed record EnrollmentCounts(int Total, int Active, int Completed, int Replied, int Failed, int Stopped);

/// <summary>
/// How a campaign is doing. A lead counts as reached on a channel once a step went out
/// to them there, and as replied on it when they wrote back there after being added.
/// </summary>
/// <param name="LeadsContacted">Leads at least one step has gone out to.</param>
public sealed record CampaignStats(
    int LeadsContacted,
    int LeadsReplied,
    ChannelStats Email,
    ChannelStats LinkedIn);

/// <param name="Sent">Messages sent: emails, or LinkedIn invitations and messages together.</param>
/// <param name="Invitations">LinkedIn connection requests among them. Always 0 for email.</param>
/// <param name="InvitationsAccepted">Of those requests, the ones leads accepted.</param>
public sealed record ChannelStats(int Sent, int Invitations, int InvitationsAccepted, int LeadsReached, int LeadsReplied);

/// <summary>A campaign with everything the editor needs.</summary>
public sealed record CampaignDto(
    Guid Id,
    string Name,
    CampaignStatus Status,
    Guid? EmailAccountId,
    Guid? LinkedInAccountId,
    string TimeZoneId,
    int SendFromHour,
    int SendUntilHour,
    bool WeekdaysOnly,
    IReadOnlyList<StepDto> Steps,
    EnrollmentCounts Counts,
    CampaignStats Stats,
    DateTimeOffset UpdatedAt);

/// <summary>A row in the campaigns list.</summary>
public sealed record CampaignSummaryDto(
    Guid Id,
    string Name,
    CampaignStatus Status,
    int StepCount,
    EnrollmentCounts Counts,
    CampaignStats Stats,
    DateTimeOffset UpdatedAt);
