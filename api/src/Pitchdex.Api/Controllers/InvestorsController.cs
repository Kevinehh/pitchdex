using Microsoft.AspNetCore.Mvc;
using Pitchdex.Application.Common;
using Pitchdex.Application.Investors;

namespace Pitchdex.Api.Controllers;

/// <summary>The shared investor database behind the Explore page.</summary>
[ApiController]
[Route("api/investors")]
[Produces("application/json")]
public sealed class InvestorsController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<Paged<InvestorDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public Task<Paged<InvestorDto>> List(
        [FromQuery] ListInvestorsQuery query,
        [FromServices] ListInvestorsHandler handler,
        CancellationToken ct) =>
        handler.Handle(query, ct);

    [HttpGet("filters")]
    [ProducesResponseType<InvestorFiltersDto>(StatusCodes.Status200OK)]
    public Task<InvestorFiltersDto> Filters(
        [FromServices] GetInvestorFiltersHandler handler,
        CancellationToken ct) =>
        handler.Handle(ct);
}
