using Pitchdex.Domain.Common;

namespace Pitchdex.Domain.Leads;

/// <summary>
/// A campaign step viewed a lead's LinkedIn profile, so they were told who looked. Kept to
/// hold each account to a daily number of views, and so a view isn't repeated after a restart.
/// </summary>
public sealed class ProfileView : IWorkspaceOwned
{
    public Guid Id { get; private init; } = Guid.CreateVersion7();

    public Guid WorkspaceId { get; set; }

    public Guid LeadId { get; set; }

    public Guid AccountId { get; set; }

    public Guid? EnrollmentId { get; set; }

    public Guid? CampaignStepId { get; set; }

    public DateTimeOffset ViewedAt { get; set; }
}
