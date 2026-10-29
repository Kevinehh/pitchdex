using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;

namespace Pitchdex.Application.Campaigns;

/// <summary>
/// Every campaign, newest first. Ordered by when it was made, not last changed, so pausing
/// or editing a campaign never moves it around the list.
/// </summary>
public sealed class ListCampaignsHandler(IAppDbContext db)
{
    public async Task<IReadOnlyList<CampaignSummaryDto>> Handle(CancellationToken ct)
    {
        var campaigns = await db.Campaigns
            .AsNoTracking()
            .OrderByDescending(c => c.CreatedAt)
            .ThenBy(c => c.Id)
            .Select(c => new { c.Id, c.Name, c.Status, StepCount = c.Steps.Count, c.UpdatedAt })
            .ToListAsync(ct);

        var ids = campaigns.Select(c => c.Id).ToList();
        var counts = await CampaignQueries.CountsAsync(db, ids, ct);
        var stats = await CampaignQueries.StatsAsync(db, ids, ct);

        return campaigns
            .Select(c => new CampaignSummaryDto(c.Id, c.Name, c.Status, c.StepCount, counts[c.Id], stats[c.Id], c.UpdatedAt))
            .ToList();
    }
}

public sealed class GetCampaignHandler(IAppDbContext db)
{
    public async Task<CampaignDto> Handle(Guid campaignId, CancellationToken ct) =>
        await CampaignQueries.ToDtoAsync(db, await CampaignQueries.LoadAsync(db, campaignId, ct), ct);
}
