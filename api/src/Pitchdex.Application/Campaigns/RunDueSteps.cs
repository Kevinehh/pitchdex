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
/// <param name="Branched">Conditions answered, sending the lead down their Yes or No branch.</param>
public sealed record SequenceRunResult(int Sent, int Waiting, int Finished, int Skipped, int Branched);

/// <summary>
/// The sequence engine. Runs every minute: finds active enrollments whose next step is
/// due and, for each one, checks the sending hours, the account's daily limits and
/// whether the lead has replied, then does the step and schedules the next. A condition
/// step sends nothing: it answers its question and moves the lead down its Yes or No branch.
///
/// Pacing: each account does at most one step per run, so a batch goes out spread over
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
        Branched,
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
            return new SequenceRunResult(0, 0, 0, 0, 0);
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
        int sent = 0, waiting = 0, finished = 0, skipped = 0, branched = 0;

        foreach (var enrollment in due)
        {
            var outcome = await RunOneAsync(enrollment, campaigns[enrollment.CampaignId], accountsUsedThisRun, now, ct);
            switch (outcome)
            {
                case Outcome.Sent: sent++; break;
                case Outcome.Waiting: waiting++; break;
                case Outcome.Skipped: skipped++; break;
                case Outcome.Branched: branched++; break;
                default: finished++; break;
            }

            // Saved one by one, so a failure part-way through never undoes sends already made.
            await db.SaveChangesAsync(ct);
        }

        if (sent > 0)
        {
            logger.LogInformation("Sequence engine sent {Sent} steps ({Waiting} waiting, {Finished} finished)", sent, waiting, finished);
        }

        return new SequenceRunResult(sent, waiting, finished, skipped, branched);
    }

    private async Task<Outcome> RunOneAsync(
        Enrollment enrollment,
        Campaign campaign,
        HashSet<Guid> accountsUsedThisRun,
        DateTimeOffset now,
        CancellationToken ct)
    {
        var step = campaign.Steps.FirstOrDefault(s => s.Id == enrollment.NextStepId);
        if (step is null)
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

        // Conditions send nothing, so they don't wait for sending hours or count against limits.
        if (step.Type.IsCondition())
        {
            return await DecideAsync(enrollment, campaign, step, lead, now, ct);
        }

        if (!SendingWindow.IsOpen(campaign, now))
        {
            return Wait(enrollment, SendingWindow.NextOpening(campaign, now).AddMinutes(Random.Shared.Next(0, 20)), reason: null);
        }

        var account = await SenderAsync(campaign, step, ct);
        if (account is null)
        {
            return Wait(enrollment, now.AddHours(1), step.Type == StepType.Email
                ? "Waiting for a connected mailbox. Choose one in the campaign's settings."
                : "Waiting for a connected LinkedIn account. Choose one in the campaign's settings.");
        }

        if (step.Type == StepType.LinkedInMessage && await AwaitingAcceptanceAsync(enrollment, campaign, step, lead, account, now, ct) is { } held)
        {
            return held;
        }

        if (accountsUsedThisRun.Contains(account.Id))
        {
            return Wait(enrollment, now.AddMinutes(Random.Shared.Next(1, 5)), reason: null);
        }

        var source = new CampaignSource(enrollment.Id, step.Id);
        try
        {
            if (step.Type == StepType.LinkedInProfileView)
            {
                if (await ViewLimitReachedAsync(account, now, ct))
                {
                    return Wait(enrollment, now.AddHours(1),
                        $"Waiting: {account.DisplayName} has viewed {SendingLimits.ProfileViewsPerDay} profiles in the last 24 hours.");
                }

                // A view that happened but wasn't recorded as done (say, the API stopped) isn't repeated.
                if (!await db.ProfileViews.AnyAsync(v => v.EnrollmentId == enrollment.Id && v.CampaignStepId == step.Id, ct))
                {
                    await messenger.ViewLinkedInProfileAsync(lead, account, source, ct);
                    accountsUsedThisRun.Add(account.Id);
                }
            }
            else
            {
                var kind = SendingLimits.KindOf(step.Type);
                if (!await SendingQuota.HasRoomAsync(db, account, kind, now, ct))
                {
                    return Wait(enrollment, now.AddHours(1), $"Waiting: {SendingQuota.LimitReachedMessage(account, kind)}");
                }

                // A send that went out but wasn't recorded as done (say, the API stopped) isn't repeated.
                if (!await db.Messages.AnyAsync(m => m.EnrollmentId == enrollment.Id && m.CampaignStepId == step.Id, ct))
                {
                    await SendAsync(lead, account, step, source, ct);
                    accountsUsedThisRun.Add(account.Id);
                }
            }
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

        return Advance(enrollment, campaign, step, branch: null, now);
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

    /// <summary>Answers a condition and moves the lead down its Yes or No branch, or waits for the answer.</summary>
    private async Task<Outcome> DecideAsync(
        Enrollment enrollment,
        Campaign campaign,
        CampaignStep step,
        Lead lead,
        DateTimeOffset now,
        CancellationToken ct)
    {
        if (step.Type == StepType.IfHasEmail)
        {
            Advance(enrollment, campaign, step, string.IsNullOrWhiteSpace(lead.Email) ? StepBranch.No : StepBranch.Yes, now);
            return Outcome.Branched;
        }

        var invitation = await InvitationAsync(enrollment, campaign, lead, ct);

        // No request on record means LinkedIn turned it down because they're already a
        // connection, the very thing the condition asks for.
        if (invitation is null || invitation.AcceptedAt is not null)
        {
            Advance(enrollment, campaign, step, StepBranch.Yes, now);
            return Outcome.Branched;
        }

        if (now - invitation.SentAt >= TimeSpan.FromDays(step.WaitDays))
        {
            Advance(enrollment, campaign, step, StepBranch.No, now);
            return Outcome.Branched;
        }

        // Acceptance is checked every few minutes, so a short recheck moves on soon after.
        return Wait(enrollment, now.AddMinutes(30),
            $"Waiting up to {step.WaitDays} days for {FirstName(lead)} to accept your connection request.");
    }

    /// <summary>
    /// The latest connection request to the lead: the one this enrollment sent, or failing that
    /// one from the campaign's LinkedIn account.
    /// </summary>
    private Task<Message?> InvitationAsync(Enrollment enrollment, Campaign campaign, Lead lead, CancellationToken ct) =>
        db.Messages
            .Where(m => m.LeadId == lead.Id &&
                m.Kind == MessageKind.LinkedInInvitation &&
                m.Direction == MessageDirection.Outbound &&
                (m.EnrollmentId == enrollment.Id || m.AccountId == campaign.LinkedInAccountId))
            .OrderByDescending(m => m.EnrollmentId == enrollment.Id)
            .ThenByDescending(m => m.SentAt)
            .FirstOrDefaultAsync(ct);

    /// <summary>
    /// A LinkedIn message only reaches a connection, so it waits while this account's
    /// connection request to the lead is pending, and is skipped once the request has gone
    /// unanswered too long. Empty when the step can go ahead: the request was accepted, or
    /// none was sent from this account (the lead may already be a connection; sending tells).
    /// </summary>
    private async Task<Outcome?> AwaitingAcceptanceAsync(
        Enrollment enrollment,
        Campaign campaign,
        CampaignStep step,
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

        if (now - invitation.SentAt < SendingLimits.InvitationAcceptanceWindow)
        {
            return Wait(enrollment, now.AddMinutes(30), $"Waiting for {FirstName(lead)} to accept your connection request.");
        }

        Advance(enrollment, campaign, step, branch: null, now);
        enrollment.LastError =
            $"Skipped step {step.Position + 1}: {FirstName(lead)} didn't accept the connection request within " +
            $"{SendingLimits.InvitationAcceptanceWindow.TotalDays:0} days.";
        return Outcome.Skipped;
    }

    private async Task<bool> ViewLimitReachedAsync(ConnectedAccount account, DateTimeOffset now, CancellationToken ct)
    {
        var since = now.AddHours(-24);
        var views = await db.ProfileViews.CountAsync(v => v.AccountId == account.Id && v.ViewedAt > since, ct);
        return views >= SendingLimits.ProfileViewsPerDay;
    }

    /// <summary>The campaign's sender for this kind of step, if it's connected.</summary>
    private async Task<ConnectedAccount?> SenderAsync(Campaign campaign, CampaignStep step, CancellationToken ct)
    {
        var accountId = step.Type == StepType.Email ? campaign.EmailAccountId : campaign.LinkedInAccountId;
        return accountId is null
            ? null
            : await db.ConnectedAccounts.FirstOrDefaultAsync(a => a.Id == accountId && a.Status == AccountStatus.Connected, ct);
    }

    /// <summary>
    /// Moves the lead to the step after <paramref name="from"/>, on the given branch after a
    /// condition, and schedules it. With nothing after it, the lead has finished the sequence.
    /// </summary>
    private static Outcome Advance(Enrollment enrollment, Campaign campaign, CampaignStep from, StepBranch? branch, DateTimeOffset now)
    {
        enrollment.Attempts = 0;
        enrollment.LastError = null;

        var next = SequenceTree.Next(campaign.Steps, from, branch);
        enrollment.NextStepId = next?.Id;
        if (next is null)
        {
            enrollment.Finish(EnrollmentStatus.Completed);
            return Outcome.Sent;
        }

        // A few random minutes on top of the delay, so follow-ups don't land at the same time every day.
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

    private static string FirstName(Lead lead) =>
        lead.FullName.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? lead.FullName;
}
