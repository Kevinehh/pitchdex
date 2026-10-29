using Pitchdex.Domain.Common;

namespace Pitchdex.Domain.Campaigns;

/// <summary>
/// A sequence of email and LinkedIn steps that leads are enrolled in. The sequence
/// engine sends each lead's next step when it's due, inside the sending hours.
/// </summary>
public sealed class Campaign : IHasTimestamps, IWorkspaceOwned
{
    public Guid Id { get; private init; } = Guid.CreateVersion7();

    public Guid WorkspaceId { get; set; }

    public required string Name { get; set; }

    public CampaignStatus Status { get; set; } = CampaignStatus.Draft;

    /// <summary>The mailbox email steps are sent from.</summary>
    public Guid? EmailAccountId { get; set; }

    /// <summary>The LinkedIn account LinkedIn steps are sent from.</summary>
    public Guid? LinkedInAccountId { get; set; }

    /// <summary>The founder's time zone, as an IANA id such as "America/Toronto".</summary>
    public string TimeZoneId { get; set; } = "America/New_York";

    /// <summary>Sending starts at this hour, local time (0–23).</summary>
    public int SendFromHour { get; set; } = 9;

    /// <summary>Sending stops at this hour, local time (1–24).</summary>
    public int SendUntilHour { get; set; } = 17;

    public bool WeekdaysOnly { get; set; } = true;

    public List<CampaignStep> Steps { get; set; } = [];

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}

public enum CampaignStatus
{
    /// <summary>Being set up. Nothing sends.</summary>
    Draft,

    /// <summary>Sending steps to enrolled leads.</summary>
    Active,

    /// <summary>Stopped for now. Enrolled leads keep their place and continue on resume.</summary>
    Paused,
}

/// <summary>One step of a campaign: what to send, and how long to wait after the previous step.</summary>
public sealed class CampaignStep
{
    public Guid Id { get; private init; } = Guid.CreateVersion7();

    public Guid CampaignId { get; set; }

    /// <summary>Order in the sequence, starting at 0.</summary>
    public int Position { get; set; }

    public StepType Type { get; set; }

    /// <summary>Days to wait after the previous step. Ignored for the first step, which sends right away.</summary>
    public int DelayDays { get; set; }

    /// <summary>Email steps only. Can use {{firstName}} and the other template fields.</summary>
    public string? Subject { get; set; }

    /// <summary>The message. Optional for connection requests, which then go without a note.</summary>
    public string Body { get; set; } = "";
}

public enum StepType
{
    Email,
    LinkedInInvitation,
    LinkedInMessage,
}
