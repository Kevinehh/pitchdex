using Microsoft.AspNetCore.Mvc;
using Pitchdex.Application.Common;
using Pitchdex.Application.Leads;

namespace Pitchdex.Api.Controllers;

/// <summary>
/// Translates HTTP to use cases. No business logic lives here.
/// </summary>
[ApiController]
[Route("api/leads")]
[Produces("application/json")]
public sealed class LeadsController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<Paged<LeadDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public Task<Paged<LeadDto>> List(
        [FromQuery] ListLeadsQuery query,
        [FromServices] ListLeadsHandler handler,
        CancellationToken ct) =>
        handler.Handle(query, ct);

    [HttpPost]
    [ProducesResponseType<LeadDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<LeadDto>> Create(
        CreateLeadCommand command,
        [FromServices] CreateLeadHandler handler,
        CancellationToken ct)
    {
        var lead = await handler.Handle(command, ct);
        return StatusCode(StatusCodes.Status201Created, lead);
    }

    /// <summary>Changes a lead's status or star. Fields left out stay as they are.</summary>
    [HttpPatch("{id:guid}")]
    [ProducesResponseType<LeadDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public Task<LeadDto> Update(
        Guid id,
        UpdateLeadCommand command,
        [FromServices] UpdateLeadHandler handler,
        CancellationToken ct) =>
        handler.Handle(id, command, ct);

    /// <summary>Saves an investor from Explore as a lead. 201 when new, 200 when it already was one.</summary>
    [HttpPost("from-investor")]
    [ProducesResponseType<LeadDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<LeadDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LeadDto>> CreateFromInvestor(
        SaveInvestorAsLeadCommand command,
        [FromServices] SaveInvestorAsLeadHandler handler,
        CancellationToken ct)
    {
        var result = await handler.Handle(command, ct);
        if (result is null)
        {
            return NotFound();
        }

        return result.Created ? StatusCode(StatusCodes.Status201Created, result.Lead) : Ok(result.Lead);
    }
}
