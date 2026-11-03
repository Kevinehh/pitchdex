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

/// <summary>
/// One step of a campaign. Steps form a tree: each one follows its parent, and a condition
/// step has up to two children, one on its Yes branch and one on its No branch. The first
/// step has no parent.
/// </summary>
public sealed class CampaignStep
{
    public Guid Id { get; private init; } = Guid.CreateVersion7();

    public Guid CampaignId { get; set; }

    /// <summary>The step this one follows. Empty for the first step.</summary>
    public Guid? ParentStepId { get; set; }

    /// <summary>Which answer of its parent condition leads here. Empty when the parent isn't a condition.</summary>
    public StepBranch? Branch { get; set; }

    /// <summary>Order in the editor, starting at 0: parents before children, Yes branches before No.</summary>
    public int Position { get; set; }

    public StepType Type { get; set; }

    /// <summary>Days to wait after the step before. Ignored for the first step, which goes right away.</summary>
    public int DelayDays { get; set; }

    /// <summary>
    /// Conditions that wait for something, like an accepted invitation: how many days after
    /// the invitation went out before the answer is No. 0 for every other step.
    /// </summary>
    public int WaitDays { get; set; }

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

    /// <summary>Views their LinkedIn profile, so they see the founder under "Who viewed your profile".</summary>
    LinkedInProfileView,

    /// <summary>Condition: did they accept the connection request within WaitDays of it going out?</summary>
    IfInvitationAccepted,

    /// <summary>Condition: does the lead have an email address to write to?</summary>
    IfHasEmail,
}

public enum StepBranch
{
    Yes,
    No,
}

public static class StepTypes
{
    /// <summary>Conditions send nothing: they pick which branch the lead goes down.</summary>
    public static bool IsCondition(this StepType type) =>
        type is StepType.IfInvitationAccepted or StepType.IfHasEmail;

    /// <summary>Steps that act through the campaign's LinkedIn account.</summary>
    public static bool UsesLinkedIn(this StepType type) =>
        type is StepType.LinkedInInvitation or StepType.LinkedInMessage or StepType.LinkedInProfileView;
}
