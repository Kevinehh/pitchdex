using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;

namespace Pitchdex.Application.Investors;

/// <summary>A cheque range found in the data. Max is empty for "and up", as in $50M+.</summary>
public sealed record CheckSizeRange(long Min, long? Max);

/// <summary>Every value Explore's filters can offer, taken from the investors themselves.</summary>
public sealed record InvestorFiltersDto(
    IReadOnlyList<string> Stages,
    IReadOnlyList<string> Industries,
    IReadOnlyList<string> Geographies,
    IReadOnlyList<string> FundTypes,
    IReadOnlyList<string> Roles,
    IReadOnlyList<CheckSizeRange> CheckSizes);

public sealed class GetInvestorFiltersHandler(IAppDbContext db)
{
    public async Task<InvestorFiltersDto> Handle(CancellationToken ct)
    {
        var investors = db.Investors.AsNoTracking();

        var stages = await investors.SelectMany(i => i.Stages).Distinct().OrderBy(s => s).ToListAsync(ct);
        var industries = await investors.SelectMany(i => i.Industries).Distinct().OrderBy(s => s).ToListAsync(ct);
        var geographies = await investors.SelectMany(i => i.Geographies).Distinct().OrderBy(s => s).ToListAsync(ct);

        var fundTypes = await investors
            .Where(i => i.FundType != null)
            .Select(i => i.FundType!)
            .Distinct()
            .OrderBy(s => s)
            .ToListAsync(ct);

        var roles = await investors
            .Where(i => i.InvestmentRole != null)
            .Select(i => i.InvestmentRole!)
            .Distinct()
            .OrderBy(s => s)
            .ToListAsync(ct);

        var checkSizes = await investors
            .Where(i => i.CheckSizeMin != null)
            .Select(i => new { Min = i.CheckSizeMin!.Value, Max = i.CheckSizeMax })
            .Distinct()
            .OrderBy(r => r.Min)
            .ToListAsync(ct);

        return new InvestorFiltersDto(
            stages,
            industries,
            geographies,
            fundTypes,
            roles,
            checkSizes.Select(r => new CheckSizeRange(r.Min, r.Max)).ToList());
    }
}
