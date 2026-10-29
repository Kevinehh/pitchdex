using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;
using Pitchdex.Application.Integrations;
using Pitchdex.Domain.Accounts;

namespace Pitchdex.Application.Accounts;

/// <summary>
/// Brings every known account up to date with the provider: name, address and status, and
/// Disconnected for ones the provider no longer has. It never adds accounts: a new account
/// joins a workspace only through <see cref="AddConnectedAccountHandler"/>, which knows whose
/// it is. Runs in the background for all workspaces, and when a founder presses Refresh.
/// </summary>
public sealed class SyncAccountsHandler(
    IAppDbContext db,
    IAccountProvider provider,
    WorkspaceContext workspace,
    TimeProvider clock)
{
    public async Task<IReadOnlyList<AccountDto>> Handle(CancellationToken ct)
    {
        var remote = (await provider.ListAccountsAsync(ct)).ToDictionary(a => a.ExternalId);

        // Every workspace's accounts: the provider's list covers them all in one call.
        var known = await db.ConnectedAccounts.IgnoreQueryFilters().ToListAsync(ct);
        foreach (var account in known)
        {
            if (remote.TryGetValue(account.ExternalId, out var latest))
            {
                AddConnectedAccountHandler.Apply(account, latest);
            }
            else
            {
                account.Status = AccountStatus.Disconnected;
            }
        }

        await db.SaveChangesAsync(ct);

        // What the founder who pressed Refresh sees: their own accounts only.
        var mine = known.Where(a => a.WorkspaceId == workspace.Id).ToList();
        return await AccountQueries.ToDtosAsync(db, mine, clock.GetUtcNow(), ct);
    }
}
