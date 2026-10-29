using Pitchdex.Domain.Common;

namespace Pitchdex.Domain.Campaigns;

/// <summary>One lead's progress through one campaign.</summary>
public sealed class Enrollment : IHasTimestamps, IWorkspaceOwned
{
    /// <summary>Failed sends are retried this many times before the enrollment is marked Failed.</summary>
    public const int MaxAttempts = 3;

    public Guid Id { get; private init; } = Guid.CreateVersion7();

    public Guid WorkspaceId { get; set; }

    public Guid CampaignId { get; set; }

    public Guid LeadId { get; set; }

    public EnrollmentStatus Status { get; set; } = EnrollmentStatus.Active;

    /// <summary>Position of the next step to send.</summary>
    public int NextStepPosition { get; set; }

    /// <summary>When the next step is due. Empty once the enrollment has finished.</summary>
    public DateTimeOffset? NextRunAt { get; set; }

    /// <summary>Failed tries at the current step.</summary>
    public int Attempts { get; set; }

    /// <summary>Why the last try failed or is waiting, in words the founder can read.</summary>
    public string? LastError { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public void Finish(EnrollmentStatus status, string? reason = null)
    {
        Status = status;
        NextRunAt = null;
        LastError = reason;
    }
}

public enum EnrollmentStatus
{
    Active,

    /// <summary>Every step was sent.</summary>
    Completed,

    /// <summary>The lead replied, so the sequence stopped.</summary>
    Replied,

    /// <summary>A step kept failing. LastError says why.</summary>
    Failed,

    /// <summary>Stopped by the founder.</summary>
    Stopped,
}
