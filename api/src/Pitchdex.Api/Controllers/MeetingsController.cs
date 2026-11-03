using Microsoft.AspNetCore.Mvc;
using Pitchdex.Application.Meetings;

namespace Pitchdex.Api.Controllers;

/// <summary>Calls leads booked on the founder's Calendly.</summary>
[ApiController]
[Route("api/meetings")]
[Produces("application/json")]
public sealed class MeetingsController : ControllerBase
{
    /// <summary>Every call starting in a stretch of up to 45 days, canceled ones included.</summary>
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<MeetingDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public Task<IReadOnlyList<MeetingDto>> List(
        [FromQuery] ListMeetingsQuery query,
        [FromServices] ListMeetingsHandler handler,
        CancellationToken ct) =>
        handler.Handle(query, ct);

    /// <summary>Calls still to come, soonest first.</summary>
    [HttpGet("upcoming")]
    [ProducesResponseType<IReadOnlyList<MeetingDto>>(StatusCodes.Status200OK)]
    public Task<IReadOnlyList<MeetingDto>> Upcoming([FromServices] ListUpcomingMeetingsHandler handler, CancellationToken ct) =>
        handler.Handle(ct);
}
