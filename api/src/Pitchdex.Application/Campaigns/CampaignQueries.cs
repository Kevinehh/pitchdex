using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;
using Pitchdex.Domain.Campaigns;
using Pitchdex.Domain.Messages;

namespace Pitchdex.Application.Campaigns;

internal static class CampaignQueries
{
    /// <summary>Enrollment counts per campaign, in one query.</summary>
    public static async Task<Dictionary<Guid, EnrollmentCounts>> CountsAsync(
        IAppDbContext db,
        IReadOnlyCollection<Guid> campaignIds,
        CancellationToken ct)
    {
        var rows = await db.Enrollments
            .Where(e => campaignIds.Contains(e.CampaignId))
            .GroupBy(e => new { e.CampaignId, e.Status })
            .Select(g => new { g.Key.CampaignId, g.Key.Status, Count = g.Count() })
            .ToListAsync(ct);

        return campaignIds.ToDictionary(id => id, id =>
        {
            int Count(EnrollmentStatus status) =>
                rows.Where(r => r.CampaignId == id && r.Status == status).Sum(r => r.Count);

            return new EnrollmentCounts(
                rows.Where(r => r.CampaignId == id).Sum(r => r.Count),
                Count(EnrollmentStatus.Active),
                Count(EnrollmentStatus.Completed),
                Count(EnrollmentStatus.Replied),
                Count(EnrollmentStatus.Failed),
                Count(EnrollmentStatus.Stopped));
        });
    }

    /// <summary>
    /// What each campaign has sent and who answered, in two queries: messages counted by
    /// campaign and kind, and one row of yes/no flags per enrolled lead, added up here.
    /// Fine for thousands of leads; past that these become counters kept as steps send.
    /// </summary>
    public static async Task<Dictionary<Guid, CampaignStats>> StatsAsync(
        IAppDbContext db,
        IReadOnlyCollection<Guid> campaignIds,
        CancellationToken ct)
    {
        var enrollments = db.Enrollments.Where(e => campaignIds.Contains(e.CampaignId));

        var sent = await db.Messages
            .Where(m => m.Direction == MessageDirection.Outbound)
            .Join(enrollments, m => m.EnrollmentId, e => e.Id, (m, e) => new { e.CampaignId, m.Kind, Accepted = m.AcceptedAt != null })
            .GroupBy(x => new { x.CampaignId, x.Kind })
            .Select(g => new { g.Key.CampaignId, g.Key.Kind, Count = g.Count(), Accepted = g.Count(x => x.Accepted) })
            .ToListAsync(ct);

        // A reply counts for a campaign when a lead it reached wrote back after being added;
        // per channel, only where the campaign reached them.
        var leads = await enrollments
            .Select(e => new
            {
                e.CampaignId,
                Emailed = db.Messages.Any(m => m.EnrollmentId == e.Id && m.Kind == MessageKind.Email),
                OnLinkedIn = db.Messages.Any(m => m.EnrollmentId == e.Id && m.Kind != MessageKind.Email),
                RepliedByEmail = db.Messages.Any(m =>
                    m.LeadId == e.LeadId && m.Direction == MessageDirection.Inbound &&
                    m.Kind == MessageKind.Email && m.SentAt >= e.CreatedAt),
                RepliedOnLinkedIn = db.Messages.Any(m =>
                    m.LeadId == e.LeadId && m.Direction == MessageDirection.Inbound &&
                    m.Kind != MessageKind.Email && m.SentAt >= e.CreatedAt),
            })
            .ToListAsync(ct);

        return campaignIds.ToDictionary(id => id, id =>
        {
            var mine = leads.Where(l => l.CampaignId == id).ToList();
            int Sent(MessageKind kind) => sent.Where(s => s.CampaignId == id && s.Kind == kind).Sum(s => s.Count);

            return new CampaignStats(
                LeadsContacted: mine.Count(l => l.Emailed || l.OnLinkedIn),
                LeadsReplied: mine.Count(l =>
                    (l.Emailed || l.OnLinkedIn) && (l.RepliedByEmail || l.RepliedOnLinkedIn)),
                Email: new ChannelStats(
                    Sent(MessageKind.Email),
                    Invitations: 0,
                    InvitationsAccepted: 0,
                    LeadsReached: mine.Count(l => l.Emailed),
                    LeadsReplied: mine.Count(l => l.Emailed && l.RepliedByEmail)),
                LinkedIn: new ChannelStats(
                    Sent(MessageKind.LinkedInInvitation) + Sent(MessageKind.LinkedInMessage),
                    Invitations: Sent(MessageKind.LinkedInInvitation),
                    InvitationsAccepted: sent
                        .Where(s => s.CampaignId == id && s.Kind == MessageKind.LinkedInInvitation)
                        .Sum(s => s.Accepted),
                    LeadsReached: mine.Count(l => l.OnLinkedIn),
                    LeadsReplied: mine.Count(l => l.OnLinkedIn && l.RepliedOnLinkedIn)));
        });
    }

    public static async Task<CampaignDto> ToDtoAsync(IAppDbContext db, Campaign campaign, CancellationToken ct)
    {
        var counts = await CountsAsync(db, [campaign.Id], ct);
        var stats = await StatsAsync(db, [campaign.Id], ct);
        var steps = campaign.Steps
            .OrderBy(s => s.Position)
            .Select(s => new StepDto(s.Id, s.Position, s.ParentStepId, s.Branch, s.Type, s.DelayDays, s.WaitDays, s.Subject, s.Body))
            .ToList();

        return new CampaignDto(
            campaign.Id,
            campaign.Name,
            campaign.Status,
            campaign.EmailAccountId,
            campaign.LinkedInAccountId,
            campaign.TimeZoneId,
            campaign.SendFromHour,
            campaign.SendUntilHour,
            campaign.WeekdaysOnly,
            steps,
            counts[campaign.Id],
            stats[campaign.Id],
            campaign.UpdatedAt);
    }

    public static async Task<Campaign> LoadAsync(IAppDbContext db, Guid campaignId, CancellationToken ct) =>
        await db.Campaigns.Include(c => c.Steps).FirstOrDefaultAsync(c => c.Id == campaignId, ct)
            ?? throw new NotFoundException("That campaign doesn't exist.");
}
