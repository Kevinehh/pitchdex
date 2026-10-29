using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;

namespace Pitchdex.Application.Accounts;

public sealed class ListAccountsHandler(IAppDbContext db, TimeProvider clock)
{
    public async Task<IReadOnlyList<AccountDto>> Handle(CancellationToken ct)
    {
        var accounts = await db.ConnectedAccounts.AsNoTracking().ToListAsync(ct);
        return await AccountQueries.ToDtosAsync(db, accounts, clock.GetUtcNow(), ct);
    }
}
