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
/// <para>
/// Signing in to a mailbox or LinkedIn profile the workspace already has makes the provider
/// create a second account for it, which would sync every message twice. Pitchdex keeps one:
/// the existing account if it still works, otherwise the new sign-in replaces it. The other
/// is unlinked at the provider.
/// </para>
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
        if (account is not null && account.WorkspaceId != workspaceId)
        {
            // Should never happen; refusing keeps one workspace from taking over another's account.
            logger.LogWarning("Account {ExternalId} belongs to another workspace; not moving it", externalId);
            return;
        }

        string? unlink = null;
        if (account is null)
        {
            var same = await FindSameAccountAsync(workspaceId, details, ct);
            if (same is { Status: AccountStatus.Connected })
            {
                logger.LogInformation("{Address} is already connected as {Existing}; unlinking the new {ExternalId}", details.Address, same.ExternalId, externalId);
                await UnlinkAsync(externalId, ct);
                return;
            }

            if (same is not null)
            {
                // The old link lost access; the new sign-in takes its place, keeping its limits and history.
                logger.LogInformation("{Address} signed in again; {ExternalId} replaces {Existing}", details.Address, externalId, same.ExternalId);
                unlink = same.ExternalId;
                same.ExternalId = externalId;
                account = same;
            }
            else
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
        }

        Apply(account, details);
        await db.SaveChangesAsync(ct);

        if (unlink is not null)
        {
            await UnlinkAsync(unlink, ct);
        }
    }

    /// <summary>The workspace's account for the same mailbox or LinkedIn profile, if it has one.</summary>
    private async Task<ConnectedAccount?> FindSameAccountAsync(Guid workspaceId, ProviderAccount details, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(details.Address))
        {
            return null;
        }

        var address = details.Address.ToLowerInvariant();
        return await db.ConnectedAccounts
            .IgnoreQueryFilters()
            .Where(a => a.WorkspaceId == workspaceId && a.Channel == details.Channel && a.Status != AccountStatus.Disconnected)
            .Where(a => a.Address != null && a.Address.ToLower() == address)
            .OrderBy(a => a.CreatedAt)
            .FirstOrDefaultAsync(ct);
    }

    /// <summary>Best effort: a link left behind only costs a duplicate sync, so a failure is logged, not thrown.</summary>
    private async Task UnlinkAsync(string externalId, CancellationToken ct)
    {
        try
        {
            await provider.RemoveAccountAsync(externalId, ct);
        }
        catch (ProviderException ex)
        {
            logger.LogWarning(ex, "Couldn't unlink duplicate account {ExternalId} at the provider", externalId);
        }
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
