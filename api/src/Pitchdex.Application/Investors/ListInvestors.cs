using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;
using Pitchdex.Domain.Investors;

namespace Pitchdex.Application.Investors;

/// <summary>The columns Explore can sort by.</summary>
public enum InvestorSort
{
    Name,
    Firm,
    CheckSize,
}

public sealed record ListInvestorsQuery
{
    public int Page { get; init; } = 1;

    public int PageSize { get; init; } = 100;

    /// <summary>Matches name, firm or job title.</summary>
    public string? Search { get; init; }

    public List<string> Stages { get; init; } = [];

    public List<string> Industries { get; init; } = [];

    public List<string> Geographies { get; init; } = [];

    public List<string> FundTypes { get; init; } = [];

    public List<string> Roles { get; init; } = [];

    /// <summary>With CheckSizeMax, a cheque range such as $100k to $500k. Leave Max empty for "and up".</summary>
    public long? CheckSizeMin { get; init; }

    public long? CheckSizeMax { get; init; }

    public InvestorSort SortBy { get; init; } = InvestorSort.Name;

    public SortDirection SortDirection { get; init; } = SortDirection.Asc;
}

public sealed class ListInvestorsValidator : AbstractValidator<ListInvestorsQuery>
{
    public ListInvestorsValidator()
    {
        RuleFor(q => q.Page).GreaterThan(0);
        RuleFor(q => q.PageSize).InclusiveBetween(1, 100);
        RuleFor(q => q.Search).MaximumLength(200);
        RuleFor(q => q.Stages.Count).LessThanOrEqualTo(30).OverridePropertyName("stages");
        RuleFor(q => q.Industries.Count).LessThanOrEqualTo(30).OverridePropertyName("industries");
        RuleFor(q => q.Geographies.Count).LessThanOrEqualTo(30).OverridePropertyName("geographies");
        RuleFor(q => q.FundTypes.Count).LessThanOrEqualTo(30).OverridePropertyName("fundTypes");
        RuleFor(q => q.Roles.Count).LessThanOrEqualTo(30).OverridePropertyName("roles");
        RuleFor(q => q.CheckSizeMin).GreaterThanOrEqualTo(0);
        RuleFor(q => q.CheckSizeMax)
            .GreaterThan(q => q.CheckSizeMin ?? 0)
            .When(q => q.CheckSizeMax is not null);
    }
}

public sealed class ListInvestorsHandler(IAppDbContext db)
{
    public async Task<Paged<InvestorDto>> Handle(ListInvestorsQuery query, CancellationToken ct)
    {
        var investors = db.Investors.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLowerInvariant();
            investors = investors.Where(i =>
                i.FullName.ToLower().Contains(search) ||
                (i.FirmName != null && i.FirmName.ToLower().Contains(search)) ||
                (i.Title != null && i.Title.ToLower().Contains(search)));
        }

        // List filters match investors that have any of the chosen values.
        if (query.Stages.Count > 0)
        {
            investors = investors.Where(i => i.Stages.Any(s => query.Stages.Contains(s)));
        }

        if (query.Industries.Count > 0)
        {
            investors = investors.Where(i => i.Industries.Any(s => query.Industries.Contains(s)));
        }

        if (query.Geographies.Count > 0)
        {
            investors = investors.Where(i => i.Geographies.Any(s => query.Geographies.Contains(s)));
        }

        if (query.FundTypes.Count > 0)
        {
            investors = investors.Where(i => i.FundType != null && query.FundTypes.Contains(i.FundType));
        }

        if (query.Roles.Count > 0)
        {
            investors = investors.Where(i => i.InvestmentRole != null && query.Roles.Contains(i.InvestmentRole));
        }

        // Cheque size: the investor's typical range overlaps the chosen one. Ranges that
        // only touch at the edge, like $0–$100k and $100k–$500k, don't count.
        if (query.CheckSizeMin is { } min)
        {
            investors = investors.Where(i => i.CheckSizeMax == null || i.CheckSizeMax > min);
        }

        if (query.CheckSizeMax is { } max)
        {
            investors = investors.Where(i => i.CheckSizeMin != null && i.CheckSizeMin < max);
        }

        var total = await investors.CountAsync(ct);
        var items = await Sort(investors, query.SortBy, query.SortDirection)
            .ThenBy(i => i.FullName)
            .ThenBy(i => i.Id)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(i => new InvestorDto(
                i.Id,
                i.FullName,
                i.Title,
                i.FirmName,
                i.FirmDomain,
                i.LinkedInUrl,
                i.Location,
                i.FundType,
                i.InvestmentRole,
                i.Stages,
                i.Industries,
                i.Geographies,
                i.CheckSizeMin,
                i.CheckSizeMax,
                db.Leads.Where(l => l.InvestorId == i.Id).Select(l => (Guid?)l.Id).FirstOrDefault()))
            .ToListAsync(ct);

        return new Paged<InvestorDto>(items, total, query.Page, query.PageSize);
    }

    /// <summary>
    /// Investors with no firm or no cheque size go last in either direction. Name and
    /// id then break ties, so paging never shows the same investor twice.
    /// </summary>
    private static IOrderedQueryable<Investor> Sort(
        IQueryable<Investor> investors,
        InvestorSort sortBy,
        SortDirection direction) =>
        sortBy switch
        {
            InvestorSort.Firm => investors
                .OrderBy(i => i.FirmName == null)
                .ThenByDirection(i => i.FirmName, direction),

            // Smallest cheque first when ascending. Open-ended ranges ("$50M+") count as
            // the biggest within the same minimum.
            InvestorSort.CheckSize => investors
                .OrderBy(i => i.CheckSizeMin == null)
                .ThenByDirection(i => i.CheckSizeMin, direction)
                .ThenByDirection(i => i.CheckSizeMax == null, direction)
                .ThenByDirection(i => i.CheckSizeMax, direction),

            _ => investors.OrderByDirection(i => i.FullName, direction),
        };
}
