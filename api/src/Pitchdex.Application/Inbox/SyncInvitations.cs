using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pitchdex.Application.Common;
using Pitchdex.Application.Integrations;
using Pitchdex.Domain.Accounts;
using Pitchdex.Domain.Campaigns;
using Pitchdex.Domain.Messages;

namespace Pitchdex.Application.Inbox;

public sealed record InvitationSyncResult(int AccountsChecked, int Accepted);

/// <summary>
/// Finds out which connection requests leads have accepted. LinkedIn doesn't announce it
/// (without webhooks), so each LinkedIn account with requests still pending has its newest
/// connections read, and any pending lead found among them is marked accepted.
/// </summary>
public sealed class SyncInvitationsHandler(
    IAppDbContext db,
    ILinkedInChannel linkedIn,
    TimeProvider clock,
    ILogger<SyncInvitationsHandler> logger)
{
    /// <summary>
    /// Connections read per account. Recent acceptances are near the top, and reading more
    /// costs LinkedIn calls, so this stays modest.
    /// </summary>
    private const int ConnectionsChecked = 300;

    public async Task<InvitationSyncResult> Handle(CancellationToken ct)
    {
        var now = clock.GetUtcNow();
        // Requests older than the window no longer hold up a sequence, so they aren't checked.
        var since = now - SendingLimits.InvitationAcceptanceWindow - TimeSpan.FromDays(7);

        var pending = await db.Messages
            .Where(m => m.Kind == MessageKind.LinkedInInvitation &&
                m.Direction == MessageDirection.Outbound &&
                m.AcceptedAt == null &&
                m.LeadId != null &&
                m.SentAt > since)
            .Join(db.Leads, m => m.LeadId, l => l.Id, (m, l) => new { Message = m, l.LinkedInProviderId, l.LinkedInUrl })
            .ToListAsync(ct);

        if (pending.Count == 0)
        {
            return new InvitationSyncResult(0, 0);
        }

        var accountIds = pending.Select(p => p.Message.AccountId).Distinct().ToList();
        var accounts = await db.ConnectedAccounts
            .Where(a => accountIds.Contains(a.Id) && a.Status == AccountStatus.Connected)
            .ToListAsync(ct);

        var accepted = 0;
        foreach (var account in accounts)
        {
            IReadOnlyList<LinkedInConnection> connections;
            try
            {
                connections = await linkedIn.ListRecentConnectionsAsync(account.ExternalId, ConnectionsChecked, ct);
            }
            catch (ProviderException ex)
            {
                // One broken account shouldn't stop the others from being checked.
                logger.LogWarning(ex, "Invitation check failed for account {AccountId}", account.Id);
                continue;
            }

            var providerIds = connections.Select(c => c.ProviderId).ToHashSet(StringComparer.Ordinal);
            var publicIds = connections
                .Select(c => c.PublicIdentifier)
                .OfType<string>()
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            foreach (var invitation in pending.Where(p => p.Message.AccountId == account.Id))
            {
                var connected =
                    (invitation.LinkedInProviderId is { } providerId && providerIds.Contains(providerId)) ||
                    (LinkedInProfile.PublicIdentifier(invitation.LinkedInUrl) is { } publicId && publicIds.Contains(publicId));

                if (connected)
                {
                    // When it was noticed, not when it happened: LinkedIn doesn't say reliably.
                    invitation.Message.AcceptedAt = now;
                    accepted++;
                }
            }
        }

        await db.SaveChangesAsync(ct);
        return new InvitationSyncResult(accounts.Count, accepted);
    }
}
