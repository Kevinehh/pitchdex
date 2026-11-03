using FluentValidation;
using Pitchdex.Application.Common;

namespace Pitchdex.Application.Meetings;

/// <summary>The calls starting from <see cref="From"/> up to, not including, <see cref="To"/>.</summary>
public sealed record ListMeetingsQuery
{
    public DateTimeOffset From { get; init; }

    public DateTimeOffset To { get; init; }
}

public sealed class ListMeetingsValidator : AbstractValidator<ListMeetingsQuery>
{
    /// <summary>Six weeks fill a month on the calendar; a little more leaves room for time zones.</summary>
    private static readonly TimeSpan MaxRange = TimeSpan.FromDays(45);

    public ListMeetingsValidator()
    {
        RuleFor(q => q.To)
            .GreaterThan(q => q.From)
            .WithMessage("The end must be after the start.");
        RuleFor(q => q.To)
            .Must((q, to) => to - q.From <= MaxRange)
            .WithMessage("Ask for 45 days or fewer at a time.");
    }
}

/// <summary>Every call in a stretch of time, canceled ones included, soonest first: what the Calendar shows.</summary>
public sealed class ListMeetingsHandler(IAppDbContext db)
{
    private const int MaxMeetings = 500;

    public async Task<IReadOnlyList<MeetingDto>> Handle(ListMeetingsQuery query, CancellationToken ct)
    {
        // Postgres only compares UTC times, and the browser may send its own offset.
        var from = query.From.ToUniversalTime();
        var to = query.To.ToUniversalTime();
        return await MeetingQueries.ListAsync(
            db,
            db.Meetings.Where(m => m.StartsAt >= from && m.StartsAt < to),
            soonestFirst: true,
            MaxMeetings,
            ct);
    }
}
