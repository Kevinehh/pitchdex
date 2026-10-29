using Microsoft.AspNetCore.Mvc;
using Pitchdex.Application.Workspaces;

namespace Pitchdex.Api.Controllers;

/// <summary>Workspace-wide defaults.</summary>
[ApiController]
[Route("api/settings")]
[Produces("application/json")]
public sealed class SettingsController : ControllerBase
{
    [HttpGet("working-hours")]
    [ProducesResponseType<WorkingHoursDto>(StatusCodes.Status200OK)]
    public Task<WorkingHoursDto> GetWorkingHours([FromServices] GetWorkingHoursHandler handler, CancellationToken ct) =>
        handler.Handle(ct);

    /// <summary>The sending window new campaigns start with. Existing campaigns keep theirs.</summary>
    [HttpPut("working-hours")]
    [ProducesResponseType<WorkingHoursDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public Task<WorkingHoursDto> UpdateWorkingHours(
        UpdateWorkingHoursCommand command,
        [FromServices] UpdateWorkingHoursHandler handler,
        CancellationToken ct) =>
        handler.Handle(command, ct);
}
