using Microsoft.AspNetCore.Mvc;
using Pitchdex.Application.Campaigns;
using Pitchdex.Application.Common;

namespace Pitchdex.Api.Controllers;

[ApiController]
[Route("api/campaigns")]
[Produces("application/json")]
public sealed class CampaignsController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<CampaignSummaryDto>>(StatusCodes.Status200OK)]
    public Task<IReadOnlyList<CampaignSummaryDto>> List([FromServices] ListCampaignsHandler handler, CancellationToken ct) =>
        handler.Handle(ct);

    [HttpPost]
    [ProducesResponseType<CampaignDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CampaignDto>> Create(
        CreateCampaignCommand command,
        [FromServices] CreateCampaignHandler handler,
        CancellationToken ct) =>
        StatusCode(StatusCodes.Status201Created, await handler.Handle(command, ct));

    [HttpGet("{id:guid}")]
    [ProducesResponseType<CampaignDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public Task<CampaignDto> Get(Guid id, [FromServices] GetCampaignHandler handler, CancellationToken ct) =>
        handler.Handle(id, ct);

    /// <summary>Saves the whole campaign from the editor: settings and steps.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType<CampaignDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public Task<CampaignDto> Update(
        Guid id,
        UpdateCampaignCommand command,
        [FromServices] UpdateCampaignHandler handler,
        CancellationToken ct) =>
        handler.Handle(command with { CampaignId = id }, ct);

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, [FromServices] DeleteCampaignHandler handler, CancellationToken ct)
    {
        await handler.Handle(id, ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/launch")]
    [ProducesResponseType<CampaignDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public Task<CampaignDto> Launch(Guid id, [FromServices] ChangeCampaignStatusHandler handler, CancellationToken ct) =>
        handler.Handle(id, CampaignAction.Launch, ct);

    [HttpPost("{id:guid}/pause")]
    [ProducesResponseType<CampaignDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public Task<CampaignDto> Pause(Guid id, [FromServices] ChangeCampaignStatusHandler handler, CancellationToken ct) =>
        handler.Handle(id, CampaignAction.Pause, ct);

    [HttpPost("{id:guid}/resume")]
    [ProducesResponseType<CampaignDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public Task<CampaignDto> Resume(Guid id, [FromServices] ChangeCampaignStatusHandler handler, CancellationToken ct) =>
        handler.Handle(id, CampaignAction.Resume, ct);

    [HttpGet("{id:guid}/enrollments")]
    [ProducesResponseType<Paged<EnrollmentDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public Task<Paged<EnrollmentDto>> Enrollments(
        Guid id,
        [FromQuery] ListEnrollmentsQuery query,
        [FromServices] ListEnrollmentsHandler handler,
        CancellationToken ct) =>
        handler.Handle(id, query, ct);

    [HttpPost("{id:guid}/enrollments")]
    [ProducesResponseType<EnrollResult>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public Task<EnrollResult> Enroll(
        Guid id,
        EnrollLeadsCommand command,
        [FromServices] EnrollLeadsHandler handler,
        CancellationToken ct) =>
        handler.Handle(command with { CampaignId = id }, ct);

    [HttpPost("{id:guid}/enrollments/{enrollmentId:guid}/stop")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> StopEnrollment(
        Guid id,
        Guid enrollmentId,
        [FromServices] StopEnrollmentHandler handler,
        CancellationToken ct)
    {
        await handler.Handle(id, enrollmentId, ct);
        return NoContent();
    }

    /// <summary>Development only: runs the sequence engine now instead of waiting for the next minute.</summary>
    [HttpPost("run-now")]
    [ApiExplorerSettings(IgnoreApi = true)]
    public async Task<IActionResult> RunNow(
        [FromServices] RunDueStepsHandler handler,
        [FromServices] IWebHostEnvironment environment,
        CancellationToken ct) =>
        environment.IsDevelopment() ? Ok(await handler.Handle(ct)) : NotFound();
}
