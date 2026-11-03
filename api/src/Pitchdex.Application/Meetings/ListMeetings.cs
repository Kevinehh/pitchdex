using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;
using Pitchdex.Domain.Meetings;

namespace Pitchdex.Application.Meetings;

/// <summary>A call someone booked, with who it's with.</summary>
/// <param name="LeadId">The lead who booked. Empty when the email they used isn't a lead's.</param>
/// <param name="Name">The lead's name, or the name they gave Calendly.</param>
/// <param name="Email">The email they booked with.</param>
public sealed record MeetingDto(
    Guid Id,
    Guid? LeadId,
    string Name,
    string Email,
    string? Firm,
    string? PictureUrl,
    string Title,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    string? JoinUrl,
    MeetingStatus Status);

/// <summary>The calls still to come, soonest first, from leads or not. A call stays listed until it ends.</summary>
public sealed class ListUpcomingMeetingsHandler(IAppDbContext db, TimeProvider clock)
{
    private const int MaxMeetings = 20;

    public async Task<IReadOnlyList<MeetingDto>> Handle(CancellationToken ct)
    {
        var now = clock.GetUtcNow();
        return await MeetingQueries.ListAsync(
            db,
            db.Meetings.Where(m => m.Status == MeetingStatus.Scheduled && m.EndsAt > now),
            soonestFirst: true,
            MaxMeetings,
            ct);
    }
}

internal static class MeetingQueries
{
    /// <summary>Every meeting with one lead, newest first: what the Inbox's side panel shows.</summary>
    public static Task<List<MeetingDto>> ForLeadAsync(IAppDbContext db, Guid leadId, CancellationToken ct) =>
        ListAsync(db, db.Meetings.Where(m => m.LeadId == leadId), soonestFirst: false, 10, ct);

    /// <summary>
    /// The meetings with their leads, when they have one, sorted by start time. Sorted and cut before building the
    /// DTOs, since the database can't sort by a field of a record it hasn't built yet.
    /// </summary>
    public static Task<List<MeetingDto>> ListAsync(
        IAppDbContext db,
        IQueryable<Meeting> meetings,
        bool soonestFirst,
        int take,
        CancellationToken ct)
    {
        var joined =
            from m in meetings.AsNoTracking()
            join l in db.Leads on m.LeadId equals l.Id into leads
            from lead in leads.DefaultIfEmpty()
            select new { Meeting = m, Lead = lead };
        var sorted = soonestFirst
            ? joined.OrderBy(x => x.Meeting.StartsAt)
            : joined.OrderByDescending(x => x.Meeting.StartsAt);

        return sorted
            .Take(take)
            .Select(x => new MeetingDto(
                x.Meeting.Id,
                x.Meeting.LeadId,
                x.Lead == null ? x.Meeting.InviteeName : x.Lead.FullName,
                x.Meeting.InviteeEmail,
                x.Lead == null ? null : x.Lead.Firm,
                x.Lead == null || x.Lead.LinkedIn == null ? null : x.Lead.LinkedIn.PictureUrl,
                x.Meeting.Title,
                x.Meeting.StartsAt,
                x.Meeting.EndsAt,
                x.Meeting.JoinUrl,
                x.Meeting.Status))
            .ToListAsync(ct);
    }
}
