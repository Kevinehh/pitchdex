using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;
using Pitchdex.Application.Integrations;
using Pitchdex.Application.Workspaces;
using Pitchdex.Domain.Leads;
using Pitchdex.Domain.Meetings;
using Pitchdex.Domain.Workspaces;

namespace Pitchdex.Application.Meetings;

/// <summary>What one check found.</summary>
/// <param name="Booked">Calls newly linked to a lead, which moved that lead to Meeting.</param>
/// <param name="EventsFound">Calendly events in the window checked, whoever booked them.</param>
/// <param name="UnmatchedEmails">People who booked with an email that isn't any lead's. Their calls are kept, unlinked.</param>
public sealed record CalendlySyncResult(int Booked, int Canceled, int EventsFound, IReadOnlyList<string> UnmatchedEmails)
{
    public static readonly CalendlySyncResult None = new(0, 0, 0, []);
}

/// <summary>
/// Reads the founder's Calendly bookings into meetings, so the Calendar shows every call. A
/// call booked with a lead's email is linked to that lead and moves them to Meeting; a canceled
/// call is marked so. Polls rather than using Calendly webhooks, which need a paid Calendly
/// plan and a public address; a booking shows up within a few minutes either way.
/// </summary>
public sealed class SyncCalendlyMeetingsHandler(
    IAppDbContext db,
    WorkspaceContext workspace,
    ICalendlyClient calendly,
    ISecretProtector secrets,
    TimeProvider clock)
{
    /// <summary>The worker runs every couple of minutes; Calendly is checked at most this often.</summary>
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(5);

    /// <summary>How far back the first check looks, so calls already booked are found.</summary>
    private static readonly TimeSpan FirstLookBack = TimeSpan.FromDays(30);

    /// <summary>
    /// How far back later checks look. Calendly never changes past events, and new bookings
    /// are always in the future, so a day covers cancellations and late-running calls.
    /// </summary>
    private static readonly TimeSpan LookBack = TimeSpan.FromDays(1);

    /// <param name="force">Checks now, even if the last check was recent. Used right after connecting.</param>
    public async Task<CalendlySyncResult> Handle(bool force, CancellationToken ct)
    {
        var current = await CurrentWorkspace.LoadAsync(db, workspace, ct);
        if (current.Calendly is not { } connection)
        {
            return CalendlySyncResult.None;
        }

        var now = clock.GetUtcNow();
        if (!force && connection.SyncedAt is { } last && now - last < Interval)
        {
            return CalendlySyncResult.None;
        }

        var result = CalendlySyncResult.None;
        try
        {
            result = await SyncAsync(connection, secrets.Unprotect(connection.ProtectedToken), now, ct);
            connection.LastError = null;
        }
        catch (ProviderException ex)
        {
            connection.LastError = ex.Message;
        }
        catch (CryptographicException)
        {
            connection.LastError = "Pitchdex can no longer read the saved token. Connect Calendly again.";
        }

        connection.SyncedAt = now;
        await db.SaveChangesAsync(ct);
        return result;
    }

    private async Task<CalendlySyncResult> SyncAsync(
        CalendlyConnection connection,
        string token,
        DateTimeOffset now,
        CancellationToken ct)
    {
        var startsAfter = now - (connection.SyncedAt is null ? FirstLookBack : LookBack);
        var events = await calendly.ListEventsAsync(token, connection.UserUri, startsAfter, ct);
        if (events.Count == 0)
        {
            return CalendlySyncResult.None;
        }

        var eventUris = events.Select(e => e.Uri).ToList();
        var known = (await db.Meetings.Where(m => eventUris.Contains(m.EventUri)).ToListAsync(ct))
            .ToLookup(m => m.EventUri);
        var unlinked = known.SelectMany(meetings => meetings).Where(m => m.LeadId is null).ToList();
        var canceled = 0;

        foreach (var calendlyEvent in events)
        {
            if (known.Contains(calendlyEvent.Uri))
            {
                foreach (var meeting in known[calendlyEvent.Uri])
                {
                    canceled += Refresh(meeting, calendlyEvent) ? 1 : 0;
                }

                continue;
            }

            unlinked.AddRange(await AddMeetingsAsync(token, calendlyEvent, ct));
        }

        var booked = await LinkToLeadsAsync(unlinked, ct);
        var unmatched = unlinked
            .Where(m => m.LeadId is null && m.InviteeEmail.Length > 0)
            .Select(m => m.InviteeEmail.ToLowerInvariant())
            .Distinct()
            .Order()
            .ToList();
        return new CalendlySyncResult(booked, canceled, events.Count, unmatched);
    }

    /// <summary>Picks up a new time or title, and a cancellation. True when it was just canceled.</summary>
    private static bool Refresh(Meeting meeting, CalendlyEvent calendlyEvent)
    {
        meeting.Title = calendlyEvent.Name;
        meeting.StartsAt = calendlyEvent.StartsAt;
        meeting.EndsAt = calendlyEvent.EndsAt;
        meeting.JoinUrl = calendlyEvent.JoinUrl;

        if (!calendlyEvent.IsCanceled || meeting.Status == MeetingStatus.Canceled)
        {
            return false;
        }

        meeting.Status = MeetingStatus.Canceled;
        return true;
    }

    /// <summary>A meeting for each person who booked the event, not yet linked to any lead.</summary>
    private async Task<IEnumerable<Meeting>> AddMeetingsAsync(string token, CalendlyEvent calendlyEvent, CancellationToken ct)
    {
        var invitees = await calendly.ListInviteesAsync(token, calendlyEvent.Uri, ct);
        var meetings = invitees.Select(invitee => new Meeting
        {
            InviteeName = invitee.Name.Length > 0 ? invitee.Name : invitee.Email,
            InviteeEmail = invitee.Email,
            Title = calendlyEvent.Name,
            StartsAt = calendlyEvent.StartsAt,
            EndsAt = calendlyEvent.EndsAt,
            JoinUrl = calendlyEvent.JoinUrl,
            Status = calendlyEvent.IsCanceled || invitee.IsCanceled ? MeetingStatus.Canceled : MeetingStatus.Scheduled,
            EventUri = calendlyEvent.Uri,
            InviteeUri = invitee.Uri,
        }).ToList();

        db.Meetings.AddRange(meetings);
        return meetings;
    }

    /// <summary>
    /// Links each call to the lead whose email it was booked with. A call still on moves that
    /// lead to Meeting. Returns how many of those there were.
    /// </summary>
    private async Task<int> LinkToLeadsAsync(List<Meeting> meetings, CancellationToken ct)
    {
        var emails = meetings
            .Select(m => m.InviteeEmail.ToLowerInvariant())
            .Where(email => email.Length > 0)
            .Distinct()
            .ToList();
        if (emails.Count == 0)
        {
            return 0;
        }

        var leads = await db.Leads.Where(l => emails.Contains(l.Email.ToLower())).ToListAsync(ct);
        var booked = 0;

        foreach (var meeting in meetings)
        {
            var lead = leads.FirstOrDefault(l => l.Email.Equals(meeting.InviteeEmail, StringComparison.OrdinalIgnoreCase));
            if (lead is null)
            {
                continue;
            }

            meeting.LeadId = lead.Id;
            if (meeting.Status == MeetingStatus.Scheduled)
            {
                // A booked call is the strongest signal there is, whatever the lead was marked before.
                lead.Status = LeadStatus.Meeting;
                booked++;
            }
        }

        return booked;
    }
}
