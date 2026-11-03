using Microsoft.EntityFrameworkCore;
using Pitchdex.Domain.Accounts;
using Pitchdex.Domain.Campaigns;
using Pitchdex.Domain.Investors;
using Pitchdex.Domain.Leads;
using Pitchdex.Domain.Meetings;
using Pitchdex.Domain.Messages;
using Pitchdex.Domain.Workspaces;

namespace Pitchdex.Application.Common;

/// <summary>
/// The database as use cases see it. Infrastructure provides the real one.
/// </summary>
public interface IAppDbContext
{
    DbSet<Campaign> Campaigns { get; }

    DbSet<CampaignStep> CampaignSteps { get; }

    DbSet<Enrollment> Enrollments { get; }

    DbSet<ConnectedAccount> ConnectedAccounts { get; }

    DbSet<Message> Messages { get; }

    DbSet<Investor> Investors { get; }

    DbSet<Lead> Leads { get; }

    DbSet<Meeting> Meetings { get; }

    DbSet<Workspace> Workspaces { get; }

    DbSet<WorkspaceMember> WorkspaceMembers { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
