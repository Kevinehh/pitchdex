using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pitchdex.Application.Common;
using Pitchdex.Application.Integrations;

namespace Pitchdex.Application.Leads;

/// <param name="Refreshed">Profiles looked up successfully.</param>
/// <param name="Failed">Lookups that failed, such as for a broken profile link. They're tried again later.</param>
public sealed record ProfileRefreshResult(int Refreshed, int Failed);

/// <summary>
/// Fills in leads' LinkedIn pictures and headlines in the background: leads never looked up
/// first, so a lead shows their profile soon after being added, then the oldest, since
/// LinkedIn's picture links expire. Every lookup is a profile view, which LinkedIn limits
/// (campaigns' own lookups count too), so each run takes a few and each day has a cap.
/// </summary>
public sealed class RefreshLinkedInProfilesHandler(
    IAppDbContext db,
    ILinkedInChannel linkedIn,
    TimeProvider clock,
    ILogger<RefreshLinkedInProfilesHandler> logger)
{
    private const int PerRun = 5;

    /// <summary>Under the roughly 100 views a day LinkedIn tolerates, leaving room for campaigns.</summary>
    private const int PerDay = 80;

    public async Task<ProfileRefreshResult> Handle(CancellationToken ct)
    {
        var account = await LinkedInProfiles.LookupAccountAsync(db, ct);
        if (account is null)
        {
            return new ProfileRefreshResult(0, 0);
        }

        var now = clock.GetUtcNow();
        var checkedToday = await db.Leads.CountAsync(l => l.LinkedInCheckedAt > now.AddDays(-1), ct);
        var room = Math.Min(PerRun, PerDay - checkedToday);
        if (room <= 0)
        {
            return new ProfileRefreshResult(0, 0);
        }

        var stale = now - LinkedInProfiles.RefreshAfter;
        var leads = await db.Leads
            .Where(l => l.LinkedInUrl != null && l.ArchivedAt == null &&
                (l.LinkedInCheckedAt == null || l.LinkedInCheckedAt < stale))
            .OrderBy(l => l.LinkedInCheckedAt != null)
            .ThenBy(l => l.LinkedInCheckedAt)
            .ThenByDescending(l => l.CreatedAt)
            .Take(room)
            .ToListAsync(ct);

        int refreshed = 0, failed = 0;
        foreach (var lead in leads)
        {
            var identifier = LinkedInProfiles.Identifier(lead);
            if (identifier is null)
            {
                // Not a profile link. Marked as checked so it isn't picked again every run.
                lead.LinkedInCheckedAt = now;
                failed++;
                continue;
            }

            try
            {
                var person = await linkedIn.GetProfileAsync(account.ExternalId, identifier, withBackground: false, ct);
                LinkedInProfiles.Apply(lead, person, now);
                refreshed++;
            }
            catch (ProviderException ex)
            {
                logger.LogWarning("Couldn't look up the LinkedIn profile of lead {LeadId}: {Reason}", lead.Id, ex.Message);
                lead.LinkedInCheckedAt = now;
                failed++;
            }
        }

        await db.SaveChangesAsync(ct);
        return new ProfileRefreshResult(refreshed, failed);
    }
}
