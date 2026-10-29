using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;
using Pitchdex.Domain.Accounts;

namespace Pitchdex.Application.Accounts;

internal static class AccountLookup
{
    /// <summary>The account, checked to be of the right kind and able to send right now.</summary>
    public static async Task<ConnectedAccount> GetUsableAsync(
        IAppDbContext db,
        Guid accountId,
        AccountChannel channel,
        CancellationToken ct)
    {
        var account = await db.ConnectedAccounts.FirstOrDefaultAsync(a => a.Id == accountId, ct)
            ?? throw new NotFoundException("That account isn't connected.");

        if (account.Channel != channel)
        {
            throw new UseCaseException(
                channel == AccountChannel.Email ? "Choose an email account." : "Choose a LinkedIn account.");
        }

        return account.Status switch
        {
            AccountStatus.Connected => account,
            AccountStatus.NeedsReconnect => throw new UseCaseException(
                $"{account.DisplayName} needs reconnecting. Reconnect it in Settings first."),
            _ => throw new UseCaseException($"{account.DisplayName} is no longer connected."),
        };
    }
}
