using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;

namespace Pitchdex.Api.Workers;

/// <summary>
/// Runs background work once per workspace, each in its own scope with that workspace set,
/// so use cases see exactly that workspace's data, the same as in a signed-in request.
/// One workspace failing doesn't stop the others.
/// </summary>
public static class WorkspaceScopes
{
    public static async Task ForEachAsync(
        IServiceScopeFactory scopes,
        ILogger logger,
        Func<IServiceProvider, CancellationToken, Task> work,
        CancellationToken ct)
    {
        List<Guid> workspaceIds;
        await using (var scope = scopes.CreateAsyncScope())
        {
            workspaceIds = await scope.ServiceProvider.GetRequiredService<IAppDbContext>()
                .Workspaces.Select(w => w.Id).ToListAsync(ct);
        }

        foreach (var workspaceId in workspaceIds)
        {
            try
            {
                await using var scope = scopes.CreateAsyncScope();
                scope.ServiceProvider.GetRequiredService<WorkspaceContext>().Id = workspaceId;
                await work(scope.ServiceProvider, ct);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(ex, "Background work failed for workspace {WorkspaceId}", workspaceId);
            }
        }
    }
}
