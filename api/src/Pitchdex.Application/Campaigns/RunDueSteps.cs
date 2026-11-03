using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pitchdex.Application.Common;
using Pitchdex.Application.Integrations;
using Pitchdex.Application.Messaging;
using Pitchdex.Domain.Accounts;
using Pitchdex.Domain.Campaigns;
using Pitchdex.Domain.Leads;
using Pitchdex.Domain.Messages;

namespace Pitchdex.Application.Campaigns;

/// <param name="Skipped">LinkedIn message steps passed over because the connection request was never accepted.</param>
public sealed record SequenceRunResult(int Sent, int Waiting, int Finished, int Skipped);

/// <summary>
/// The sequence engine. Runs every minute: finds active enrollments whose next step is
/// due and, for each one, checks the sending hours, the account's daily limits and
/// whether the lead has replied, then sends the step and schedules the next.
///
/// Pacing: each account sends at most one step per run, so a batch goes out spread over
/// minutes rather than all at once, with a few random minutes added between steps.
///
/// Runs in a single API instance for the MVP. With several instances, claim enrollments
/// with FOR UPDATE SKIP LOCKED so two never take the same one.
/// </summary>
public sealed class RunDueStepsHandler(
    IAppDbContext db,
    LeadMessenger messenger,
    WorkspaceContext workspace,
    TimeProvider clock,
    ILogger<RunDueStepsHandler> logger)
{
    private const int BatchSize = 50;

    private string? calendlyUrl;

    private enum Outcome
    {
        Sent,
        Waiting,
        Finished,
        Skipped,
    }

    public async Task<SequenceRunResult> Handle(CancellationToken ct)
    {
        var now = clock.GetUtcNow();
        var due = await db.Enrollments
            .Where(e => e.Status == EnrollmentStatus.Active && e.NextRunAt != null && e.NextRunAt <= now)
            .Where(e => db.Campaigns.Any(c => c.Id == e.CampaignId && c.Status == CampaignStatus.Active))
            .OrderBy(e => e.NextRunAt)
            .Take(BatchSize)
            .ToListAsync(ct);

        if (due.Count == 0)
        {
            return new SequenceRunResult(0, 0, 0, 0);
        }

        var campaignIds = due.Select(e => e.CampaignId).Distinct().ToList();
        var campaigns = await db.Campaigns
            .Include(c => c.Steps)
            .Where(c => campaignIds.Contains(c.Id))
            .ToDictionaryAsync(c => c.Id, ct);

        // Read once per run; a step using {{calendly}} fails with a clear reason if it's missing.
        calendlyUrl = await db.Workspaces
            .Where(w => w.Id == workspace.RequiredId)
            .Select(w => w.CalendlyUrl)
            .FirstOrDefaultAsync(ct);

        var accountsUsedThisRun = new HashSet<Guid>();
        int sent = 0, waiting = 0, finished = 0, skipped = 0;

        foreach (var enrollment in due)
        {
            var outcome = await RunOneAsync(enrollment, campaigns[enrollment.CampaignId], accountsUsedThisRun, now, ct);
            switch (outcome)
            {
                case Outcome.Sent: sent++; break;
                case Outcome.Waiting: waiting++; break;
                case Outcome.Skipped: skipped++; break;
                default: finished++; break;
            }

            // Saved one by one, so a failure part-way through never undoes sends already made.
            await db.SaveChangesAsync(ct);
        }

        if (sent > 0)
        {
            logger.LogInformation("Sequence engine sent {Sent} steps ({Waiting} waiting, {Finished} finished)", sent, waiting, finished);
        }

        return new SequenceRunResult(sent, waiting, finished, skipped);
    }

    private async Task<Outcome> RunOneAsync(
        Enrollment enrollment,
        Campaign campaign,
        HashSet<Guid> accountsUsedThisRun,
        DateTimeOffset now,
        CancellationToken ct)
    {
        var steps = campaign.Steps.OrderBy(s => s.Position).ToList();
        if (enrollment.NextStepPosition >= steps.Count)
        {
            enrollment.Finish(EnrollmentStatus.Completed);
            return Outcome.Finished;
        }

        var lead = await db.Leads.FirstAsync(l => l.Id == enrollment.LeadId, ct);
        switch (lead.Status)
        {
            case LeadStatus.Replied or LeadStatus.Meeting:
                enrollment.Finish(EnrollmentStatus.Replied, "The lead is already talking with you.");
                return Outcome.Finished;
            case LeadStatus.Passed:
                enrollment.Finish(EnrollmentStatus.Stopped, "The lead passed.");
                return Outcome.Finished;
        }

        if (!SendingWindow.IsOpen(campaign, now))
        {
            return Wait(enrollment, SendingWindow.NextOpening(campaign, now).AddMinutes(Random.Shared.Next(0, 20)), reason: null);
        }

        var step = steps[enrollment.NextStepPosition];
        var account = await SenderAsync(campaign, step, ct);
        if (account is null)
        {
            return Wait(enrollment, now.AddHours(1), step.Type == StepType.Email
                ? "Waiting for a connected mailbox. Choose one in the campaign's settings."
                : "Waiting for a connected LinkedIn account. Choose one in the campaign's settings.");
        }

        if (step.Type == StepType.LinkedInMessage && await AwaitingAcceptanceAsync(enrollment, steps, lead, account, now, ct) is { } held)
        {
            return held;
        }

        if (accountsUsedThisRun.Contains(account.Id))
        {
            return Wait(enrollment, now.AddMinutes(Random.Shared.Next(1, 5)), reason: null);
        }

        var kind = SendingLimits.KindOf(step.Type);
        if (!await SendingQuota.HasRoomAsync(db, account, kind, now, ct))
        {
            return Wait(enrollment, now.AddHours(1), $"Waiting: {SendingQuota.LimitReachedMessage(account, kind)}");
        }

        // A send that went out but wasn't recorded as done (say, the API stopped) isn't repeated.
        var alreadySent = await db.Messages.AnyAsync(m => m.EnrollmentId == enrollment.Id && m.CampaignStepId == step.Id, ct);
        if (!alreadySent)
        {
            try
            {
                await SendAsync(lead, account, step, new CampaignSource(enrollment.Id, step.Id), ct);
                accountsUsedThisRun.Add(account.Id);
            }
            catch (UseCaseException ex)
            {
                // Something only the founder can fix, like a lead with no LinkedIn link.
                enrollment.Finish(EnrollmentStatus.Failed, ex.Message);
                return Outcome.Finished;
            }
            catch (ProviderException ex)
            {
                return Retry(enrollment, now, ex.Message);
            }
        }

        return Advance(enrollment, steps, now);
    }

    private async Task SendAsync(Lead lead, ConnectedAccount account, CampaignStep step, CampaignSource source, CancellationToken ct)
    {
        var body = MessageTemplate.Render(step.Body, lead, calendlyUrl);
        if (step.Type == StepType.Email)
        {
            var subject = MessageTemplate.Render(step.Subject ?? "", lead, calendlyUrl);
            await messenger.SendEmailAsync(lead, account, subject, body, source, replyTo: null, ct);
        }
        else
        {
            await messenger.SendLinkedInAsync(lead, account, SendingLimits.KindOf(step.Type), body, source, ct);
        }
    }

    /// <summary>
    /// A LinkedIn message only reaches a connection, so it waits while this account's
    /// connection request to the lead is pending, and is skipped once the request has gone
    /// unanswered too long. Empty when the step can go ahead: the request was accepted, or
    /// none was sent from this account (the lead may already be a connection; sending tells).
    /// </summary>
    private async Task<Outcome?> AwaitingAcceptanceAsync(
        Enrollment enrollment,
        List<CampaignStep> steps,
        Lead lead,
        ConnectedAccount account,
        DateTimeOffset now,
        CancellationToken ct)
    {
        var invitation = await db.Messages
            .Where(m => m.LeadId == lead.Id &&
                m.AccountId == account.Id &&
                m.Kind == MessageKind.LinkedInInvitation &&
                m.Direction == MessageDirection.Outbound)
            .OrderByDescending(m => m.SentAt)
            .Select(m => new { m.SentAt, m.AcceptedAt })
            .FirstOrDefaultAsync(ct);

        if (invitation is null || invitation.AcceptedAt is not null)
        {
            return null;
        }

        var firstName = lead.FullName.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? lead.FullName;
        if (now - invitation.SentAt < SendingLimits.InvitationAcceptanceWindow)
        {
            // Acceptance is checked every few minutes, so a short recheck sends soon after.
            return Wait(enrollment, now.AddMinutes(30), $"Waiting for {firstName} to accept your connection request.");
        }

        var skippedStep = enrollment.NextStepPosition + 1;
        Advance(enrollment, steps, now);
        enrollment.LastError =
            $"Skipped step {skippedStep}: {firstName} didn't accept the connection request within " +
            $"{SendingLimits.InvitationAcceptanceWindow.TotalDays:0} days.";
        return Outcome.Skipped;
    }

    /// <summary>The campaign's sender for this kind of step, if it's connected.</summary>
    private async Task<ConnectedAccount?> SenderAsync(Campaign campaign, CampaignStep step, CancellationToken ct)
    {
        var accountId = step.Type == StepType.Email ? campaign.EmailAccountId : campaign.LinkedInAccountId;
        return accountId is null
            ? null
            : await db.ConnectedAccounts.FirstOrDefaultAsync(a => a.Id == accountId && a.Status == AccountStatus.Connected, ct);
    }

    private static Outcome Advance(Enrollment enrollment, List<CampaignStep> steps, DateTimeOffset now)
    {
        enrollment.NextStepPosition++;
        enrollment.Attempts = 0;
        enrollment.LastError = null;

        if (enrollment.NextStepPosition >= steps.Count)
        {
            enrollment.Finish(EnrollmentStatus.Completed);
            return Outcome.Sent;
        }

        // A few random minutes on top of the delay, so follow-ups don't land at the same time every day.
        var next = steps[enrollment.NextStepPosition];
        enrollment.NextRunAt = now.AddDays(next.DelayDays).AddMinutes(Random.Shared.Next(2, 45));
        return Outcome.Sent;
    }

    private static Outcome Wait(Enrollment enrollment, DateTimeOffset until, string? reason)
    {
        enrollment.NextRunAt = until;
        enrollment.LastError = reason;
        return Outcome.Waiting;
    }

    /// <summary>A provider failure might be temporary, so it's retried with growing gaps before giving up.</summary>
    private static Outcome Retry(Enrollment enrollment, DateTimeOffset now, string error)
    {
        enrollment.Attempts++;
        if (enrollment.Attempts >= Enrollment.MaxAttempts)
        {
            enrollment.Finish(EnrollmentStatus.Failed, error);
            return Outcome.Finished;
        }

        return Wait(enrollment, now.AddMinutes(15 * enrollment.Attempts), $"Retrying: {error}");
    }
}
