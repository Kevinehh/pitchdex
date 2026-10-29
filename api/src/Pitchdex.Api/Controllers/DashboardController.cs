using Microsoft.AspNetCore.Mvc;
using Pitchdex.Application.Dashboard;

namespace Pitchdex.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Produces("application/json")]
public sealed class DashboardController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<DashboardDto>(StatusCodes.Status200OK)]
    public Task<DashboardDto> Get([FromServices] GetDashboardHandler handler, CancellationToken ct) =>
        handler.Handle(ct);
}
