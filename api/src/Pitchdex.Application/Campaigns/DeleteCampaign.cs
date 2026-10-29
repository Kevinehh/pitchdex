using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;

namespace Pitchdex.Application.Campaigns;

/// <summary>
/// Deletes a campaign with its steps and enrollments. Messages already sent stay in the
/// inbox and on the lead; they just lose their link to the campaign.
/// </summary>
public sealed class DeleteCampaignHandler(IAppDbContext db)
{
    public async Task Handle(Guid campaignId, CancellationToken ct)
    {
        var campaign = await db.Campaigns.FirstOrDefaultAsync(c => c.Id == campaignId, ct)
            ?? throw new NotFoundException("That campaign doesn't exist.");

        db.Campaigns.Remove(campaign);
        await db.SaveChangesAsync(ct);
    }
}
