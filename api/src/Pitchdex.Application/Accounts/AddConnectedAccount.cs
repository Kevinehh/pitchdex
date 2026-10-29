using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pitchdex.Application.Common;
using Pitchdex.Application.Integrations;
using Pitchdex.Domain.Accounts;

namespace Pitchdex.Application.Accounts;

/// <summary>
/// Adds an account the founder has just connected to their workspace. Called by Unipile's
/// webhook, which says which workspace started the sign-in, and by practice mode. An account
/// already in Pitchdex is refreshed, and never moved to another workspace.
/// </summary>
public sealed class AddConnectedAccountHandler(
    IAppDbContext db,
    IAccountProvider provider,
    ILogger<AddConnectedAccountHandler> logger)
{
    public async Task Handle(Guid workspaceId, string externalId, CancellationToken ct)
    {
        if (!await db.Workspaces.AnyAsync(w => w.Id == workspaceId, ct))
        {
            throw new NotFoundException("That workspace doesn't exist.");
        }

        var details = await provider.GetAccountAsync(externalId, ct)
            ?? throw new NotFoundException("The provider doesn't have that account.");

        var account = await db.ConnectedAccounts.IgnoreQueryFilters().FirstOrDefaultAsync(a => a.ExternalId == externalId, ct);
        if (account is null)
        {
            account = new ConnectedAccount
            {
                WorkspaceId = workspaceId,
                ExternalId = externalId,
                ProviderType = details.ProviderType,
                DisplayName = details.DisplayName,
            };
            db.ConnectedAccounts.Add(account);
        }
        else if (account.WorkspaceId != workspaceId)
        {
            // Should never happen; refusing keeps one workspace from taking over another's account.
            logger.LogWarning("Account {ExternalId} belongs to another workspace; not moving it", externalId);
            return;
        }

        Apply(account, details);
        await db.SaveChangesAsync(ct);
    }

    /// <summary>Copies what the provider says about an account onto Pitchdex's copy.</summary>
    internal static void Apply(ConnectedAccount account, ProviderAccount details)
    {
        account.Channel = details.Channel;
        account.ProviderType = details.ProviderType;
        account.DisplayName = details.DisplayName;
        account.Address = details.Address;
        account.Status = details.Status;
    }
}
