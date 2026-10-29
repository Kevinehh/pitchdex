using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;
using Pitchdex.Application.Inbox;
using Pitchdex.Domain.Accounts;
using Pitchdex.Domain.Campaigns;
using Pitchdex.Domain.Messages;

namespace Pitchdex.Application.Dashboard;

/// <summary>Everything the dashboard shows, in one request.</summary>
/// <param name="Sending">Sent in the last 24 hours against what the connected accounts allow.</param>
/// <param name="PendingInvitations">Connection requests still waiting to be accepted.</param>
public sealed record DashboardDto(
    IReadOnlyList<SendingStat> Sending,
    int UnreadConversations,
    int PendingInvitations,
    int ActiveCampaigns,
    ReplyStats Replies,
    IReadOnlyList<ActivityDto> Activity,
    SetupDto Setup);

/// <param name="Limit">The connected accounts' daily limits for this kind, added up. 0 with none connected.</param>
public sealed record SendingStat(MessageKind Kind, int Sent, int Limit);

/// <summary>Leads who wrote back, counted as people rather than messages.</summary>
/// <param name="ContactedLast30Days">Leads sent anything in the last 30 days.</param>
/// <param name="RepliedLast30Days">Of those, the ones who wrote back.</param>
public sealed record ReplyStats(int ThisWeek, int LastWeek, int ContactedLast30Days, int RepliedLast30Days);

public enum ActivityKind
{
    EmailSent,
    InvitationSent,
    LinkedInMessageSent,
    EmailReply,
    LinkedInReply,
    InvitationAccepted,
    StepFailed,
}

/// <summary>One line of the Recent activity feed.</summary>
/// <param name="Detail">Why a step failed. Empty for the other kinds.</param>
/// <param name="StoppedCampaigns">For replies: the campaigns that stopped sending to the lead.</param>
public sealed record ActivityDto(
    string Id,
    ActivityKind Kind,
    Guid? LeadId,
    string? LeadName,
    Guid? CampaignId,
    string? CampaignName,
    string? Detail,
    int StoppedCampaigns,
    DateTimeOffset At);

/// <summary>The getting-started checklist, ticked off from what actually exists.</summary>
public sealed record SetupDto(bool HasMailbox, bool HasLinkedIn, bool HasLeads, bool HasCampaign, bool HasLaunchedCampaign);

public sealed class GetDashboardHandler(IAppDbContext db, TimeProvider clock)
{
    private const int ActivityItems = 12;

    public async Task<DashboardDto> Handle(CancellationToken ct)
    {
        var now = clock.GetUtcNow();
        var connected = await db.ConnectedAccounts.AsNoTracking()
            .Where(a => a.Status == AccountStatus.Connected)
            .ToListAsync(ct);

        return new DashboardDto(
            await SendingAsync(now, connected, ct),
            await Conversations.InView(db, ConversationView.Unread).CountAsync(ct),
            await PendingInvitationsAsync(now, ct),
            await db.Campaigns.CountAsync(c => c.Status == CampaignStatus.Active, ct),
            await RepliesAsync(now, ct),
            await ActivityAsync(ct),
            new SetupDto(
                connected.Any(a => a.Channel == AccountChannel.Email),
                connected.Any(a => a.Channel == AccountChannel.LinkedIn),
                await db.Leads.AnyAsync(ct),
                await db.Campaigns.AnyAsync(ct),
                await db.Campaigns.AnyAsync(c => c.Status != CampaignStatus.Draft, ct)));
    }

    /// <summary>
    /// The same 24-hour window the sending limits use, against the connected accounts' own
    /// limits added together, so the numbers match what's left.
    /// </summary>
    private async Task<IReadOnlyList<SendingStat>> SendingAsync(
        DateTimeOffset now,
        List<ConnectedAccount> connected,
        CancellationToken ct)
    {
        var since = now.AddHours(-24);
        var sent = await db.Messages.AsNoTracking()
            .Where(m => m.Direction == MessageDirection.Outbound && m.SentAt > since)
            .GroupBy(m => m.Kind)
            .Select(g => new { Kind = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Kind, x => x.Count, ct);

        SendingStat Stat(MessageKind kind, AccountChannel channel) => new(
            kind,
            sent.GetValueOrDefault(kind),
            connected.Where(a => a.Channel == channel).Sum(a => a.DailyLimit(kind)));

        return
        [
            Stat(MessageKind.LinkedInInvitation, AccountChannel.LinkedIn),
            Stat(MessageKind.LinkedInMessage, AccountChannel.LinkedIn),
            Stat(MessageKind.Email, AccountChannel.Email),
        ];
    }

    /// <summary>Requests a sequence still waits on. Older ones have lapsed.</summary>
    private Task<int> PendingInvitationsAsync(DateTimeOffset now, CancellationToken ct)
    {
        var since = now - SendingLimits.InvitationAcceptanceWindow;
        return db.Messages.CountAsync(m =>
            m.Kind == MessageKind.LinkedInInvitation &&
            m.Direction == MessageDirection.Outbound &&
            m.AcceptedAt == null &&
            m.SentAt > since, ct);
    }

    private async Task<ReplyStats> RepliesAsync(DateTimeOffset now, CancellationToken ct)
    {
        var messages = db.Messages.AsNoTracking().Where(m => m.LeadId != null);
        var weekAgo = now.AddDays(-7);
        var twoWeeksAgo = now.AddDays(-14);
        var monthAgo = now.AddDays(-30);

        var inbound = messages.Where(m => m.Direction == MessageDirection.Inbound);
        var contacted = messages
            .Where(m => m.Direction == MessageDirection.Outbound && m.SentAt > monthAgo)
            .Select(m => m.LeadId)
            .Distinct();

        return new ReplyStats(
            await inbound.Where(m => m.SentAt > weekAgo).Select(m => m.LeadId).Distinct().CountAsync(ct),
            await inbound.Where(m => m.SentAt > twoWeeksAgo && m.SentAt <= weekAgo).Select(m => m.LeadId).Distinct().CountAsync(ct),
            await contacted.CountAsync(ct),
            await inbound
                .Where(m => m.SentAt > monthAgo && contacted.Contains(m.LeadId))
                .Select(m => m.LeadId)
                .Distinct()
                .CountAsync(ct));
    }

    /// <summary>
    /// Built from what's already stored: sent messages, replies and failed steps, newest first.
    /// Events with no message behind them (a campaign paused, an account disconnected) need an
    /// activity log of their own later.
    /// </summary>
    private async Task<IReadOnlyList<ActivityDto>> ActivityAsync(CancellationToken ct)
    {
        var messages = await db.Messages.AsNoTracking()
            .Where(m => m.LeadId != null)
            .OrderByDescending(m => m.SentAt)
            .Take(ActivityItems)
            .Select(m => new
            {
                m.Id,
                m.Kind,
                m.Direction,
                m.LeadId,
                LeadName = db.Leads.Where(l => l.Id == m.LeadId).Select(l => l.FullName).FirstOrDefault(),
                CampaignId = db.Enrollments.Where(e => e.Id == m.EnrollmentId).Select(e => (Guid?)e.CampaignId).FirstOrDefault(),
                CampaignName = db.Enrollments
                    .Where(e => e.Id == m.EnrollmentId)
                    .Join(db.Campaigns, e => e.CampaignId, c => c.Id, (e, c) => c.Name)
                    .FirstOrDefault(),
                Stopped = m.Direction == MessageDirection.Inbound
                    ? db.Enrollments.Count(e => e.LeadId == m.LeadId && e.Status == EnrollmentStatus.Replied)
                    : 0,
                m.SentAt,
            })
            .ToListAsync(ct);

        var acceptances = await db.Messages.AsNoTracking()
            .Where(m => m.Kind == MessageKind.LinkedInInvitation && m.AcceptedAt != null && m.LeadId != null)
            .OrderByDescending(m => m.AcceptedAt)
            .Take(ActivityItems)
            .Select(m => new
            {
                m.Id,
                m.LeadId,
                LeadName = db.Leads.Where(l => l.Id == m.LeadId).Select(l => l.FullName).FirstOrDefault(),
                CampaignId = db.Enrollments.Where(e => e.Id == m.EnrollmentId).Select(e => (Guid?)e.CampaignId).FirstOrDefault(),
                CampaignName = db.Enrollments
                    .Where(e => e.Id == m.EnrollmentId)
                    .Join(db.Campaigns, e => e.CampaignId, c => c.Id, (e, c) => c.Name)
                    .FirstOrDefault(),
                AcceptedAt = m.AcceptedAt!.Value,
            })
            .ToListAsync(ct);

        var failures = await db.Enrollments.AsNoTracking()
            .Where(e => e.Status == EnrollmentStatus.Failed)
            .OrderByDescending(e => e.UpdatedAt)
            .Take(ActivityItems)
            .Select(e => new
            {
                e.Id,
                e.LeadId,
                LeadName = db.Leads.Where(l => l.Id == e.LeadId).Select(l => l.FullName).FirstOrDefault(),
                e.CampaignId,
                CampaignName = db.Campaigns.Where(c => c.Id == e.CampaignId).Select(c => c.Name).FirstOrDefault(),
                e.LastError,
                e.UpdatedAt,
            })
            .ToListAsync(ct);

        return messages
            .Select(m => new ActivityDto(
                $"message-{m.Id}",
                KindOf(m.Kind, m.Direction),
                m.LeadId,
                m.LeadName,
                m.CampaignId,
                m.CampaignName,
                Detail: null,
                m.Stopped,
                m.SentAt))
            .Concat(acceptances.Select(a => new ActivityDto(
                $"accepted-{a.Id}",
                ActivityKind.InvitationAccepted,
                a.LeadId,
                a.LeadName,
                a.CampaignId,
                a.CampaignName,
                Detail: null,
                StoppedCampaigns: 0,
                a.AcceptedAt)))
            .Concat(failures.Select(f => new ActivityDto(
                $"failure-{f.Id}",
                ActivityKind.StepFailed,
                f.LeadId,
                f.LeadName,
                f.CampaignId,
                f.CampaignName,
                f.LastError,
                StoppedCampaigns: 0,
                f.UpdatedAt)))
            .OrderByDescending(a => a.At)
            .Take(ActivityItems)
            .ToList();
    }

    private static ActivityKind KindOf(MessageKind kind, MessageDirection direction) =>
        (kind, direction) switch
        {
            (MessageKind.Email, MessageDirection.Inbound) => ActivityKind.EmailReply,
            (_, MessageDirection.Inbound) => ActivityKind.LinkedInReply,
            (MessageKind.Email, _) => ActivityKind.EmailSent,
            (MessageKind.LinkedInInvitation, _) => ActivityKind.InvitationSent,
            _ => ActivityKind.LinkedInMessageSent,
        };
}
