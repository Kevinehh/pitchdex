using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pitchdex.Application.Accounts;
using Pitchdex.Infrastructure.Messaging;

namespace Pitchdex.Api.Controllers;

/// <summary>
/// Calls from Unipile. They come from Unipile's servers, not a signed-in founder, so they
/// carry a shared secret instead of a session.
/// </summary>
[ApiController]
[Route("api/webhooks/unipile")]
[AllowAnonymous]
[ApiExplorerSettings(IgnoreApi = true)]
public sealed class WebhooksController(MessagingSettings settings, ILogger<WebhooksController> logger) : ControllerBase
{
    /// <summary>
    /// A founder finished connecting an account. <c>name</c> is the workspace id Pitchdex put
    /// in the sign-in link, which is how the account finds its workspace.
    /// </summary>
    [HttpPost("accounts")]
    public async Task<IActionResult> AccountConnected(
        [FromQuery] string? secret,
        UnipileAccountNotice notice,
        [FromServices] AddConnectedAccountHandler addAccount,
        CancellationToken ct)
    {
        if (!SecretMatches(secret))
        {
            return Unauthorized();
        }

        if (notice.Status is not ("CREATION_SUCCESS" or "RECONNECTED") || !Guid.TryParse(notice.Name, out var workspaceId))
        {
            // Reconnects keep their workspace; the regular sync refreshes their status.
            return Ok();
        }

        logger.LogInformation("Unipile connected account {AccountId} for workspace {WorkspaceId}", notice.AccountId, workspaceId);
        await addAccount.Handle(workspaceId, notice.AccountId, ct);
        return Ok();
    }

    /// <summary>Compared in constant time, so the secret can't be guessed a character at a time.</summary>
    private bool SecretMatches(string? secret) =>
        !string.IsNullOrEmpty(settings.WebhookSecret) &&
        secret is not null &&
        CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(secret), Encoding.UTF8.GetBytes(settings.WebhookSecret));
}

/// <summary>What Unipile sends when hosted sign-in finishes.</summary>
public sealed record UnipileAccountNotice(
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("account_id")] string AccountId,
    [property: JsonPropertyName("name")] string? Name);
