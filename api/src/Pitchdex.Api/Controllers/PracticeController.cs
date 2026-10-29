using Microsoft.AspNetCore.Mvc;
using Pitchdex.Application.Accounts;
using Pitchdex.Application.Common;
using Pitchdex.Domain.Accounts;
using Pitchdex.Infrastructure.Messaging;
using Pitchdex.Infrastructure.Messaging.Practice;

namespace Pitchdex.Api.Controllers;

/// <summary>
/// The pretend sign-in page practice mode sends founders to. Exists only while no
/// Unipile key is set; with Unipile, founders sign in on Unipile's real page instead.
/// The founder is signed in to Pitchdex here, so the new account joins their workspace.
/// </summary>
[ApiController]
[Route("api/practice")]
[ApiExplorerSettings(IgnoreApi = true)]
public sealed class PracticeController(IServiceProvider services, MessagingSettings settings) : ControllerBase
{
    [HttpGet("connect")]
    public async Task<IActionResult> Connect(
        [FromQuery] AccountChannel channel,
        [FromServices] AddConnectedAccountHandler addAccount,
        [FromServices] WorkspaceContext workspace,
        CancellationToken ct)
    {
        if (services.GetService<PracticeMessagingProvider>() is not { } practice)
        {
            return NotFound();
        }

        var account = await practice.CompleteConnectAsync(channel, ct);
        await addAccount.Handle(workspace.RequiredId, account.ExternalId, ct);
        return Redirect(settings.ConnectedRedirectUrl(channel));
    }
}
