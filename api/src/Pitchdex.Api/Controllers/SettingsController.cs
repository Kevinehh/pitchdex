using Microsoft.AspNetCore.Mvc;
using Pitchdex.Application.Meetings;
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

    /// <summary>Saves the onboarding survey, or marks it skipped when no answers are sent.</summary>
    [HttpPut("onboarding")]
    [ProducesResponseType<WorkspaceDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public Task<WorkspaceDto> CompleteOnboarding(
        CompleteOnboardingCommand command,
        [FromServices] CompleteOnboardingHandler handler,
        CancellationToken ct) =>
        handler.Handle(command, ct);

    [HttpGet("calendly")]
    [ProducesResponseType<CalendlySettingsDto>(StatusCodes.Status200OK)]
    public Task<CalendlySettingsDto> GetCalendly([FromServices] GetCalendlySettingsHandler handler, CancellationToken ct) =>
        handler.Handle(ct);

    /// <summary>The booking link that fills {{calendly}}. An empty link clears it.</summary>
    [HttpPut("calendly/link")]
    [ProducesResponseType<CalendlySettingsDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public Task<CalendlySettingsDto> UpdateCalendlyLink(
        UpdateCalendlyLinkCommand command,
        [FromServices] UpdateCalendlyLinkHandler handler,
        CancellationToken ct) =>
        handler.Handle(command, ct);

    /// <summary>Connects Calendly with a personal access token, so bookings mark leads as Meeting.</summary>
    [HttpPost("calendly/connection")]
    [ProducesResponseType<CalendlySettingsDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status502BadGateway)]
    public Task<CalendlySettingsDto> ConnectCalendly(
        ConnectCalendlyCommand command,
        [FromServices] ConnectCalendlyHandler handler,
        CancellationToken ct) =>
        handler.Handle(command, ct);

    [HttpDelete("calendly/connection")]
    [ProducesResponseType<CalendlySettingsDto>(StatusCodes.Status200OK)]
    public Task<CalendlySettingsDto> DisconnectCalendly([FromServices] DisconnectCalendlyHandler handler, CancellationToken ct) =>
        handler.Handle(ct);

    /// <summary>Checks Calendly for bookings now and says what it found.</summary>
    [HttpPost("calendly/check")]
    [ProducesResponseType<CalendlyCheckDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public Task<CalendlyCheckDto> CheckCalendly([FromServices] CheckCalendlyHandler handler, CancellationToken ct) =>
        handler.Handle(ct);
}
