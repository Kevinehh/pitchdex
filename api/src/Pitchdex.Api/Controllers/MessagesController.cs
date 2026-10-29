using Microsoft.AspNetCore.Mvc;
using Pitchdex.Application.Common;
using Pitchdex.Application.Inbox;
using Pitchdex.Application.Messaging;

namespace Pitchdex.Api.Controllers;

/// <summary>Sending to leads, and the Inbox.</summary>
[ApiController]
[Route("api/messages")]
[Produces("application/json")]
public sealed class MessagesController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<Paged<MessageDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public Task<Paged<MessageDto>> List(
        [FromQuery] ListMessagesQuery query,
        [FromServices] ListMessagesHandler handler,
        CancellationToken ct) =>
        handler.Handle(query, ct);

    [HttpPost("email")]
    [ProducesResponseType<MessageDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status502BadGateway)]
    public async Task<ActionResult<MessageDto>> SendEmail(
        SendEmailCommand command,
        [FromServices] SendEmailHandler handler,
        CancellationToken ct) =>
        StatusCode(StatusCodes.Status201Created, await handler.Handle(command, ct));

    /// <summary>A LinkedIn connection request or message.</summary>
    [HttpPost("linkedin")]
    [ProducesResponseType<MessageDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status502BadGateway)]
    public async Task<ActionResult<MessageDto>> SendLinkedIn(
        SendLinkedInCommand command,
        [FromServices] SendLinkedInHandler handler,
        CancellationToken ct) =>
        StatusCode(StatusCodes.Status201Created, await handler.Handle(command, ct));

    /// <summary>Pulls new replies and accepted connection requests now, instead of waiting for the background sync.</summary>
    [HttpPost("sync")]
    [ProducesResponseType<InboxSyncResult>(StatusCodes.Status200OK)]
    public async Task<InboxSyncResult> Sync(
        [FromServices] SyncInboxHandler inbox,
        [FromServices] SyncInvitationsHandler invitations,
        CancellationToken ct)
    {
        var result = await inbox.Handle(ct);
        var accepted = await invitations.Handle(ct);
        return result with { AcceptedInvitations = accepted.Accepted };
    }
}
