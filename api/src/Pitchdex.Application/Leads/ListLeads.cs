using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;
using Pitchdex.Domain.Leads;

namespace Pitchdex.Application.Leads;

/// <summary>The columns the Leads table can sort by.</summary>
public enum LeadSort
{
    Updated,
    Name,
    Firm,
    Email,
    Status,
}

public sealed record ListLeadsQuery
{
    public int Page { get; init; } = 1;

    public int PageSize { get; init; } = 50;

    public LeadStatus? Status { get; init; }

    public string? Search { get; init; }

    /// <summary>Only leads in this campaign.</summary>
    public Guid? CampaignId { get; init; }

    /// <summary>Only leads that were never added to a campaign.</summary>
    public bool NoCampaign { get; init; }

    public LeadSort SortBy { get; init; } = LeadSort.Updated;

    public SortDirection SortDirection { get; init; } = SortDirection.Desc;
}

public sealed class ListLeadsValidator : AbstractValidator<ListLeadsQuery>
{
    public ListLeadsValidator()
    {
        RuleFor(q => q.Page).GreaterThan(0);
        RuleFor(q => q.PageSize).InclusiveBetween(1, 100);
        RuleFor(q => q.Search).MaximumLength(200);
        RuleFor(q => q.NoCampaign)
            .Equal(false)
            .When(q => q.CampaignId is not null)
            .WithMessage("Choose a campaign or no campaign, not both.");
    }
}

public sealed class ListLeadsHandler(IAppDbContext db)
{
    public async Task<Paged<LeadDto>> Handle(ListLeadsQuery query, CancellationToken ct)
    {
        // Reads never track changes, and only the columns the DTO needs are loaded.
        var leads = db.Leads.AsNoTracking();

        if (query.Status is { } status)
        {
            leads = leads.Where(l => l.Status == status);
        }

        if (query.CampaignId is { } campaignId)
        {
            leads = leads.Where(l => db.Enrollments.Any(e => e.LeadId == l.Id && e.CampaignId == campaignId));
        }
        else if (query.NoCampaign)
        {
            leads = leads.Where(l => !db.Enrollments.Any(e => e.LeadId == l.Id));
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLowerInvariant();
            leads = leads.Where(l =>
                l.FullName.ToLower().Contains(search) ||
                l.Email.ToLower().Contains(search) ||
                (l.Firm != null && l.Firm.ToLower().Contains(search)));
        }

        var total = await leads.CountAsync(ct);
        var items = await Sort(leads, query.SortBy, query.SortDirection)
            .ThenByDescending(l => l.UpdatedAt)
            .ThenBy(l => l.Id)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(l => new LeadDto(
                l.Id,
                l.FullName,
                l.Email,
                l.Firm,
                l.LinkedInUrl,
                l.Status,
                l.IsStarred,
                l.InvestorId,
                LeadDto.LinkedInOf(l.LinkedIn),
                db.Enrollments
                    .Where(e => e.LeadId == l.Id)
                    .OrderBy(e => e.CreatedAt)
                    .Join(db.Campaigns, e => e.CampaignId, c => c.Id, (e, c) => new LeadCampaignDto(c.Id, c.Name, c.Status, e.Status))
                    .ToList(),
                l.UpdatedAt))
            .ToListAsync(ct);

        return new Paged<LeadDto>(items, total, query.Page, query.PageSize);
    }

    /// <summary>
    /// Status sorts in pipeline order (New → Contacted → Replied → Meeting → Passed),
    /// not alphabetically. Leads without a firm go last in either direction.
    /// </summary>
    private static IOrderedQueryable<Lead> Sort(IQueryable<Lead> leads, LeadSort sortBy, SortDirection direction) =>
        sortBy switch
        {
            LeadSort.Name => leads.OrderByDirection(l => l.FullName, direction),
            LeadSort.Email => leads.OrderByDirection(l => l.Email, direction),
            LeadSort.Firm => leads
                .OrderBy(l => l.Firm == null)
                .ThenByDirection(l => l.Firm, direction),
            LeadSort.Status => leads.OrderByDirection(
                l => l.Status == LeadStatus.New ? 0
                    : l.Status == LeadStatus.Contacted ? 1
                    : l.Status == LeadStatus.Replied ? 2
                    : l.Status == LeadStatus.Meeting ? 3
                    : 4,
                direction),
            _ => leads.OrderByDirection(l => l.UpdatedAt, direction),
        };
}
