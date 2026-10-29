using Microsoft.AspNetCore.Mvc;
using Pitchdex.Application.Common;
using Pitchdex.Application.Inbox;

namespace Pitchdex.Api.Controllers;

/// <summary>The Inbox: one conversation per lead, across email and LinkedIn.</summary>
[ApiController]
[Route("api/conversations")]
[Produces("application/json")]
public sealed class ConversationsController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<Paged<ConversationSummaryDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public Task<Paged<ConversationSummaryDto>> List(
        [FromQuery] ListConversationsQuery query,
        [FromServices] ListConversationsHandler handler,
        CancellationToken ct) =>
        handler.Handle(query, ct);

    [HttpGet("counts")]
    [ProducesResponseType<ConversationCounts>(StatusCodes.Status200OK)]
    public Task<ConversationCounts> Counts([FromServices] CountConversationsHandler handler, CancellationToken ct) =>
        handler.Handle(ct);

    /// <summary>The conversation with one lead. The id is the lead's.</summary>
    [HttpGet("{leadId:guid}")]
    [ProducesResponseType<ConversationDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public Task<ConversationDto> Get(Guid leadId, [FromServices] GetConversationHandler handler, CancellationToken ct) =>
        handler.Handle(leadId, ct);

    /// <summary>Archives or restores the conversation, or marks it read or unread.</summary>
    [HttpPatch("{leadId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid leadId,
        UpdateConversationCommand command,
        [FromServices] UpdateConversationHandler handler,
        CancellationToken ct)
    {
        await handler.Handle(leadId, command, ct);
        return NoContent();
    }

    [HttpPost("{leadId:guid}/reply")]
    [ProducesResponseType<MessageDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status502BadGateway)]
    public async Task<ActionResult<MessageDto>> Reply(
        Guid leadId,
        ReplyCommand command,
        [FromServices] ReplyToConversationHandler handler,
        CancellationToken ct) =>
        StatusCode(StatusCodes.Status201Created, await handler.Handle(leadId, command, ct));
}
