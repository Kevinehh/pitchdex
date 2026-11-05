using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;
using Pitchdex.Domain.Workspaces;

namespace Pitchdex.Application.Workspaces;

/// <param name="OnboardedAt">Empty until the founder finishes or skips the onboarding survey.</param>
public sealed record WorkspaceDto(Guid Id, string Name, DateTimeOffset? OnboardedAt)
{
    public static WorkspaceDto From(Workspace workspace) => new(workspace.Id, workspace.Name, workspace.OnboardedAt);
}

/// <summary>
/// Gives a newly signed-up founder their workspace. The very first sign-up takes over the
/// workspace that holds everything made before sign-in existed; everyone else gets a new one.
/// </summary>
public sealed class SetUpWorkspaceHandler(IAppDbContext db)
{
    public async Task<WorkspaceDto> Handle(Guid userId, string founderFirstName, CancellationToken ct)
    {
        var first = await db.Workspaces.FirstOrDefaultAsync(w => w.Id == Workspace.FirstWorkspaceId, ct);
        var firstIsUnclaimed = first is not null &&
            !await db.WorkspaceMembers.AnyAsync(m => m.WorkspaceId == Workspace.FirstWorkspaceId, ct);

        var workspace = firstIsUnclaimed ? first! : new Workspace { Name = $"{founderFirstName}'s workspace" };
        if (!firstIsUnclaimed)
        {
            db.Workspaces.Add(workspace);
        }

        db.WorkspaceMembers.Add(new WorkspaceMember { WorkspaceId = workspace.Id, UserId = userId, Role = WorkspaceRole.Owner });
        await db.SaveChangesAsync(ct);

        return WorkspaceDto.From(workspace);
    }
}

/// <summary>The workspace a user belongs to. One each for now; teams come later.</summary>
public sealed class FindUserWorkspaceHandler(IAppDbContext db)
{
    public async Task<WorkspaceDto?> Handle(Guid userId, CancellationToken ct) =>
        await db.WorkspaceMembers
            .Where(m => m.UserId == userId)
            .OrderBy(m => m.CreatedAt)
            .Join(db.Workspaces, m => m.WorkspaceId, w => w.Id, (m, w) => new WorkspaceDto(w.Id, w.Name, w.OnboardedAt))
            .FirstOrDefaultAsync(ct);
}
