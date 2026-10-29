using Microsoft.AspNetCore.Mvc;
using Pitchdex.Application.Accounts;

namespace Pitchdex.Api.Controllers;

/// <summary>The founder's connected mailboxes and LinkedIn accounts.</summary>
[ApiController]
[Route("api/accounts")]
[Produces("application/json")]
public sealed class AccountsController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<AccountDto>>(StatusCodes.Status200OK)]
    public Task<IReadOnlyList<AccountDto>> List([FromServices] ListAccountsHandler handler, CancellationToken ct) =>
        handler.Handle(ct);

    /// <summary>A link to the provider's sign-in page for a new email or LinkedIn account.</summary>
    [HttpPost("connect")]
    [ProducesResponseType<ConnectLinkDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status502BadGateway)]
    public Task<ConnectLinkDto> Connect(
        StartConnectCommand command,
        [FromServices] StartConnectHandler handler,
        CancellationToken ct) =>
        handler.Handle(command, ct);

    [HttpPost("{id:guid}/reconnect")]
    [ProducesResponseType<ConnectLinkDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public Task<ConnectLinkDto> Reconnect(Guid id, [FromServices] StartReconnectHandler handler, CancellationToken ct) =>
        handler.Handle(id, ct);

    /// <summary>Sets how much the account sends a day, per kind. Kinds left out keep their limit.</summary>
    [HttpPut("{id:guid}/limits")]
    [ProducesResponseType<AccountDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public Task<AccountDto> UpdateLimits(
        Guid id,
        UpdateAccountLimitsCommand command,
        [FromServices] UpdateAccountLimitsHandler handler,
        CancellationToken ct) =>
        handler.Handle(id, command, ct);

    /// <summary>Refreshes the list from the provider. Called after signing in, and by Refresh.</summary>
    [HttpPost("sync")]
    [ProducesResponseType<IReadOnlyList<AccountDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status502BadGateway)]
    public Task<IReadOnlyList<AccountDto>> Sync([FromServices] SyncAccountsHandler handler, CancellationToken ct) =>
        handler.Handle(ct);
}
