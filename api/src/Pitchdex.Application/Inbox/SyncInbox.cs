using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pitchdex.Application.Common;
using Pitchdex.Application.Integrations;
using Pitchdex.Domain.Accounts;
using Pitchdex.Domain.Campaigns;
using Pitchdex.Domain.Leads;
using Pitchdex.Domain.Messages;

namespace Pitchdex.Application.Inbox;

/// <param name="AcceptedInvitations">Filled in when the founder checks by hand, which also checks invitations.</param>
public sealed record InboxSyncResult(int AccountsChecked, int NewReplies, int AcceptedInvitations = 0);

/// <summary>
/// Pulls new incoming messages from every connected account and stores the ones from
/// leads. Everything else in a founder's mailbox is ignored and never stored. A reply
/// moves the lead to Replied. Runs every few minutes, and when the founder presses Refresh.
/// </summary>
public sealed class SyncInboxHandler(
    IAppDbContext db,
    IInboxProvider inbox,
    TimeProvider clock,
    ILogger<SyncInboxHandler> logger)
{
    /// <summary>How far back the first sync of a new account looks.</summary>
    private static readonly TimeSpan FirstSyncWindow = TimeSpan.FromDays(14);

    public async Task<InboxSyncResult> Handle(CancellationToken ct)
    {
        var accounts = await db.ConnectedAccounts
            .Where(a => a.Status == AccountStatus.Connected)
            .ToListAsync(ct);

        var newReplies = 0;
        foreach (var account in accounts)
        {
            var startedAt = clock.GetUtcNow();
            IReadOnlyList<ProviderMessage> fetched;
            try
            {
                fetched = await inbox.FetchSinceAsync(account, account.LastSyncedAt ?? startedAt - FirstSyncWindow, ct);
            }
            catch (ProviderException ex)
            {
                // One broken account shouldn't stop the others from syncing.
                logger.LogWarning(ex, "Inbox sync failed for account {AccountId}", account.Id);
                continue;
            }

            newReplies += await StoreRepliesAsync(account, fetched, ct);
            account.LastSyncedAt = startedAt;
            await db.SaveChangesAsync(ct);
        }

        return new InboxSyncResult(accounts.Count, newReplies);
    }

    private async Task<int> StoreRepliesAsync(ConnectedAccount account, IReadOnlyList<ProviderMessage> fetched, CancellationToken ct)
    {
        // Messages the founder sent are recorded when Pitchdex sends them, so only incoming ones are needed.
        var incoming = fetched.Where(m => !m.SentByAccount).ToList();
        if (incoming.Count == 0)
        {
            return 0;
        }

        var externalIds = incoming.Select(m => m.ExternalId).ToList();
        var alreadyStored = (await db.Messages
                .Where(m => m.AccountId == account.Id && m.ExternalId != null && externalIds.Contains(m.ExternalId))
                .Select(m => m.ExternalId!)
                .ToListAsync(ct))
            .ToHashSet();

        var stored = 0;
        foreach (var item in incoming.Where(m => !alreadyStored.Contains(m.ExternalId)))
        {
            var lead = await FindLeadAsync(item, ct);
            if (lead is null)
            {
                continue;
            }

            db.Messages.Add(new Message
            {
                AccountId = account.Id,
                LeadId = lead.Id,
                Kind = item.Kind,
                Direction = MessageDirection.Inbound,
                ExternalId = item.ExternalId,
                ThreadId = item.ThreadId,
                Subject = item.Subject,
                Body = item.Body,
                CounterpartIdentifier = item.CounterpartIdentifier,
                SentAt = item.SentAt,
            });

            if (lead.Status is LeadStatus.New or LeadStatus.Contacted)
            {
                lead.Status = LeadStatus.Replied;
            }

            // A new reply brings an archived conversation back to the Inbox.
            lead.ArchivedAt = null;

            // A reply on any channel stops every sequence the lead is in, in every campaign.
            var running = await db.Enrollments
                .Where(e => e.LeadId == lead.Id && e.Status == EnrollmentStatus.Active)
                .ToListAsync(ct);
            foreach (var enrollment in running)
            {
                enrollment.Finish(
                    EnrollmentStatus.Replied,
                    item.Kind == MessageKind.Email ? "Replied by email." : "Replied on LinkedIn.");
            }

            stored++;
        }

        return stored;
    }

    /// <summary>The lead behind a message: same thread as an earlier message, or same email or LinkedIn profile.</summary>
    private async Task<Lead?> FindLeadAsync(ProviderMessage item, CancellationToken ct)
    {
        if (item.ThreadId is not null)
        {
            var leadId = await db.Messages
                .Where(m => m.ThreadId == item.ThreadId && m.LeadId != null)
                .Select(m => m.LeadId)
                .FirstOrDefaultAsync(ct);

            if (leadId is not null)
            {
                return await db.Leads.FirstOrDefaultAsync(l => l.Id == leadId, ct);
            }
        }

        if (string.IsNullOrWhiteSpace(item.CounterpartIdentifier))
        {
            return null;
        }

        var identifier = item.CounterpartIdentifier.Trim();
        return item.Kind == MessageKind.Email
            ? await db.Leads.FirstOrDefaultAsync(l => l.Email.ToLower() == identifier.ToLower(), ct)
            : await db.Leads.FirstOrDefaultAsync(l => l.LinkedInProviderId == identifier, ct);
    }
}
