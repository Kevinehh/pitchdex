using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;
using Pitchdex.Domain.Accounts;
using Pitchdex.Domain.Campaigns;

namespace Pitchdex.Application.Campaigns;

/// <summary>The whole campaign as the editor saves it. Steps are listed parents first.</summary>
public sealed record UpdateCampaignCommand(
    Guid CampaignId,
    string Name,
    Guid? EmailAccountId,
    Guid? LinkedInAccountId,
    string TimeZoneId,
    int SendFromHour,
    int SendUntilHour,
    bool WeekdaysOnly,
    IReadOnlyList<StepInput> Steps);

public sealed class UpdateCampaignValidator : AbstractValidator<UpdateCampaignCommand>
{
    public UpdateCampaignValidator()
    {
        RuleFor(c => c.Name).NotEmpty().MaximumLength(200);
        RuleFor(c => c.TimeZoneId)
            .Must(id => TimeZoneInfo.TryFindSystemTimeZoneById(id, out _))
            .WithMessage("Choose a valid time zone.");
        RuleFor(c => c.SendFromHour).InclusiveBetween(0, 23);
        RuleFor(c => c.SendUntilHour)
            .InclusiveBetween(1, 24)
            .GreaterThan(c => c.SendFromHour)
            .WithMessage("Sending must end after it starts.");
        RuleFor(c => c.Steps.Count)
            .InclusiveBetween(1, SequenceTree.MaxSteps)
            .OverridePropertyName("steps")
            .WithMessage($"A campaign needs between 1 and {SequenceTree.MaxSteps} steps.");
        RuleFor(c => c.Steps)
            .Must(steps => SequenceTree.Problem(steps) is null)
            .WithMessage(c => SequenceTree.Problem(c.Steps)!)
            .When(c => c.Steps.Count > 0);

        RuleForEach(c => c.Steps).ChildRules(step =>
        {
            step.RuleFor(s => s.DelayDays).InclusiveBetween(0, 60);
            step.RuleFor(s => s.WaitDays)
                .InclusiveBetween(1, SequenceTree.MaxWaitDays)
                .WithMessage($"Wait between 1 and {SequenceTree.MaxWaitDays} days.")
                .When(s => s.Type == StepType.IfInvitationAccepted);
            step.RuleFor(s => s.Subject)
                .NotEmpty().WithMessage("Email steps need a subject.")
                .MaximumLength(300)
                .When(s => s.Type == StepType.Email);
            step.RuleFor(s => s.Body)
                .NotEmpty().WithMessage("Write the message for this step.")
                .When(s => s.Type is StepType.Email or StepType.LinkedInMessage);
            step.RuleFor(s => s.Body)
                .MaximumLength(300).WithMessage("Connection notes can be at most 300 characters.")
                .When(s => s.Type == StepType.LinkedInInvitation);
            step.RuleFor(s => s.Body).MaximumLength(20_000);
            step.RuleFor(s => s)
                .Must(s => MessageTemplate.UnknownFields(s.Subject).Count == 0 && MessageTemplate.UnknownFields(s.Body).Count == 0)
                .OverridePropertyName("Body")
                .WithMessage($"Use only these fields: {string.Join(", ", MessageTemplate.Fields.Select(f => "{{" + f + "}}"))}.");
        });
    }
}

/// <summary>
/// Saves the editor. Saved steps keep their ids, so leads part-way through keep their place.
/// New steps are added and missing ones removed; a lead waiting on a removed step moves to
/// the next step below it that's still there, or finishes if there's none.
/// </summary>
public sealed class UpdateCampaignHandler(IAppDbContext db, WorkspaceContext workspace, TimeProvider clock)
{
    public async Task<CampaignDto> Handle(UpdateCampaignCommand command, CancellationToken ct)
    {
        var campaign = await CampaignQueries.LoadAsync(db, command.CampaignId, ct);

        await CheckAccountAsync(command.EmailAccountId, AccountChannel.Email, ct);
        await CheckAccountAsync(command.LinkedInAccountId, AccountChannel.LinkedIn, ct);
        await CheckCalendlyAsync(command, ct);

        campaign.Name = command.Name.Trim();
        campaign.EmailAccountId = command.EmailAccountId;
        campaign.LinkedInAccountId = command.LinkedInAccountId;
        campaign.TimeZoneId = command.TimeZoneId;
        campaign.SendFromHour = command.SendFromHour;
        campaign.SendUntilHour = command.SendUntilHour;
        campaign.WeekdaysOnly = command.WeekdaysOnly;

        // The tree as it was, to find where leads on removed steps go next.
        var before = campaign.Steps.Select(s => (s.Id, s.ParentStepId, s.Branch, s.Position)).ToList();
        var saved = campaign.Steps.ToDictionary(s => s.Id);
        var ids = new Dictionary<string, Guid>();
        var kept = new HashSet<Guid>();

        for (var position = 0; position < command.Steps.Count; position++)
        {
            var input = command.Steps[position];
            var step = Guid.TryParse(input.Key, out var id) && saved.TryGetValue(id, out var existing) && kept.Add(id)
                ? existing
                : AddStep(campaign);

            ids[input.Key] = step.Id;
            SequenceTree.Apply(step, input, position, input.ParentKey is null ? null : ids[input.ParentKey]);
        }

        var removed = saved.Values.Where(s => !kept.Contains(s.Id)).ToList();
        await MoveEnrollmentsOffAsync(campaign.Id, removed, before, ct);
        foreach (var step in removed)
        {
            campaign.Steps.Remove(step);
            db.CampaignSteps.Remove(step);
        }

        // Touch the campaign itself, so "most recently changed" also counts step edits.
        campaign.UpdatedAt = clock.GetUtcNow();
        await db.SaveChangesAsync(ct);

        return await CampaignQueries.ToDtoAsync(db, campaign, ct);
    }

    private CampaignStep AddStep(Campaign campaign)
    {
        var step = new CampaignStep { CampaignId = campaign.Id };
        campaign.Steps.Add(step);
        db.CampaignSteps.Add(step);
        return step;
    }

    /// <summary>
    /// Leads whose next step is being removed go to the nearest step below it that stays,
    /// looking down Yes branches before No. Removing a single step in the editor keeps the
    /// step after it, so that's where they land; with nothing left below, they finish.
    /// </summary>
    private async Task MoveEnrollmentsOffAsync(
        Guid campaignId,
        List<CampaignStep> removed,
        List<(Guid Id, Guid? ParentStepId, StepBranch? Branch, int Position)> before,
        CancellationToken ct)
    {
        if (removed.Count == 0)
        {
            return;
        }

        var removedIds = removed.Select(s => s.Id).ToHashSet();
        var waiting = await db.Enrollments
            .Where(e => e.CampaignId == campaignId && e.NextStepId != null && removedIds.Contains(e.NextStepId.Value))
            .ToListAsync(ct);

        var children = before.ToLookup(s => s.ParentStepId);
        foreach (var enrollment in waiting)
        {
            var next = NearestKept(enrollment.NextStepId!.Value, removedIds, children);
            enrollment.NextStepId = next;
            if (next is null && enrollment.Status == EnrollmentStatus.Active)
            {
                enrollment.Finish(EnrollmentStatus.Completed, "The rest of its branch was removed from the campaign.");
            }
        }
    }

    private static Guid? NearestKept(
        Guid stepId,
        HashSet<Guid> removedIds,
        ILookup<Guid?, (Guid Id, Guid? ParentStepId, StepBranch? Branch, int Position)> children)
    {
        var queue = new Queue<Guid>([stepId]);
        while (queue.Count > 0)
        {
            foreach (var child in children[queue.Dequeue()].OrderBy(c => c.Branch == StepBranch.No).ThenBy(c => c.Position))
            {
                if (!removedIds.Contains(child.Id))
                {
                    return child.Id;
                }

                queue.Enqueue(child.Id);
            }
        }

        return null;
    }

    /// <summary>Caught when the campaign is saved rather than when the step sends, so no lead is dropped over it.</summary>
    private async Task CheckCalendlyAsync(UpdateCampaignCommand command, CancellationToken ct)
    {
        var usesCalendly = command.Steps.Any(s => MessageTemplate.UsesCalendly(s.Subject) || MessageTemplate.UsesCalendly(s.Body));
        if (usesCalendly && !await db.Workspaces.AnyAsync(w => w.Id == workspace.RequiredId && w.CalendlyUrl != null, ct))
        {
            throw new UseCaseException(MessageTemplate.CalendlyMissing);
        }
    }

    private async Task CheckAccountAsync(Guid? accountId, AccountChannel channel, CancellationToken ct)
    {
        if (accountId is null)
        {
            return;
        }

        var found = await db.ConnectedAccounts.AnyAsync(a => a.Id == accountId && a.Channel == channel, ct);
        if (!found)
        {
            throw new UseCaseException(channel == AccountChannel.Email
                ? "Choose one of your connected mailboxes."
                : "Choose one of your connected LinkedIn accounts.");
        }
    }
}
