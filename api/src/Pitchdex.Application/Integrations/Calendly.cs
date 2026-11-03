namespace Pitchdex.Application.Integrations;

/// <summary>
/// The parts of Calendly's API Pitchdex reads. Every call takes the founder's own token, so
/// each workspace only ever sees its own calendar.
/// </summary>
public interface ICalendlyClient
{
    /// <summary>Whose token this is. Throws a ProviderException when Calendly refuses it.</summary>
    Task<CalendlyUser> GetCurrentUserAsync(string token, CancellationToken ct);

    /// <summary>The user's events starting after <paramref name="startsAfter"/>, canceled ones included.</summary>
    Task<IReadOnlyList<CalendlyEvent>> ListEventsAsync(string token, string userUri, DateTimeOffset startsAfter, CancellationToken ct);

    /// <summary>The people who booked one event.</summary>
    Task<IReadOnlyList<CalendlyInvitee>> ListInviteesAsync(string token, string eventUri, CancellationToken ct);
}

/// <param name="SchedulingUrl">Their booking page, such as https://calendly.com/jane.</param>
public sealed record CalendlyUser(string Uri, string Name, string Email, string SchedulingUrl);

public sealed record CalendlyEvent(
    string Uri,
    string Name,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    bool IsCanceled,
    string? JoinUrl,
    DateTimeOffset CreatedAt);

public sealed record CalendlyInvitee(string Uri, string Email, string Name, bool IsCanceled);
