using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;
using Pitchdex.Domain.Accounts;
using Pitchdex.Domain.Campaigns;
using Pitchdex.Domain.Messages;

namespace Pitchdex.Application.Accounts;

/// <param name="Limits">One per kind the account sends: invitations and messages, or emails.</param>
public sealed record AccountDto(
    Guid Id,
    AccountChannel Channel,
    string ProviderType,
    string DisplayName,
    string? Address,
    AccountStatus Status,
    DateTimeOffset? LastSyncedAt,
    IReadOnlyList<DailyLimitDto> Limits);

/// <summary>One daily sending limit, with what's been sent against it.</summary>
/// <param name="SentLast24Hours">Counted over the same rolling window the limit is checked on.</param>
public sealed record DailyLimitDto(MessageKind Kind, int Limit, int Default, int Max, int SentLast24Hours);

internal static class AccountQueries
{
    /// <summary>The accounts as the API shows them, with one query for what each has sent today.</summary>
    public static async Task<IReadOnlyList<AccountDto>> ToDtosAsync(
        IAppDbContext db,
        IReadOnlyCollection<ConnectedAccount> accounts,
        DateTimeOffset now,
        CancellationToken ct)
    {
        var ids = accounts.Select(a => a.Id).ToList();
        var since = now.AddDays(-1);
        var sent = await db.Messages.AsNoTracking()
            .Where(m => ids.Contains(m.AccountId) && m.Direction == MessageDirection.Outbound && m.SentAt >= since)
            .GroupBy(m => new { m.AccountId, m.Kind })
            .Select(g => new { g.Key.AccountId, g.Key.Kind, Count = g.Count() })
            .ToListAsync(ct);

        return accounts
            .OrderBy(a => a.Channel)
            .ThenBy(a => a.DisplayName)
            .Select(account => new AccountDto(
                account.Id,
                account.Channel,
                account.ProviderType,
                account.DisplayName,
                account.Address,
                account.Status,
                account.LastSyncedAt,
                SendingLimits.KindsFor(account.Channel)
                    .Select(kind => new DailyLimitDto(
                        kind,
                        account.DailyLimit(kind),
                        SendingLimits.DefaultPerDay(kind),
                        SendingLimits.MaxPerDay(kind),
                        sent.Where(s => s.AccountId == account.Id && s.Kind == kind).Sum(s => s.Count)))
                    .ToList()))
            .ToList();
    }
}
