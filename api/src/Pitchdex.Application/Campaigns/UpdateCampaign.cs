using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;
using Pitchdex.Domain.Accounts;
using Pitchdex.Domain.Campaigns;

namespace Pitchdex.Application.Campaigns;

public sealed record StepInput(StepType Type, int DelayDays, string? Subject, string Body);

/// <summary>The whole campaign as the editor saves it. Steps are listed in order.</summary>
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
    public const int MaxSteps = 10;

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
            .InclusiveBetween(1, MaxSteps)
            .OverridePropertyName("steps")
            .WithMessage($"A campaign needs between 1 and {MaxSteps} steps.");

        RuleForEach(c => c.Steps).ChildRules(step =>
        {
            step.RuleFor(s => s.DelayDays).InclusiveBetween(0, 60);
            step.RuleFor(s => s.Subject)
                .NotEmpty().WithMessage("Email steps need a subject.")
                .MaximumLength(300)
                .When(s => s.Type == StepType.Email);
            step.RuleFor(s => s.Body)
                .NotEmpty().WithMessage("Write the message for this step.")
                .When(s => s.Type != StepType.LinkedInInvitation);
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
/// Saves the editor. Steps are updated in place by position, so leads part-way through
/// keep their place; extra steps are added and removed ones deleted.
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

        var existing = campaign.Steps.OrderBy(s => s.Position).ToList();
        for (var position = 0; position < command.Steps.Count; position++)
        {
            var input = command.Steps[position];
            var step = position < existing.Count ? existing[position] : AddStep(campaign, position);

            step.Type = input.Type;
            step.DelayDays = position == 0 ? 0 : input.DelayDays;
            step.Subject = input.Type == StepType.Email ? input.Subject?.Trim() : null;
            step.Body = input.Body.Trim();
        }

        foreach (var removed in existing.Skip(command.Steps.Count))
        {
            campaign.Steps.Remove(removed);
            db.CampaignSteps.Remove(removed);
        }

        // Touch the campaign itself, so "most recently changed" also counts step edits.
        campaign.UpdatedAt = clock.GetUtcNow();
        await db.SaveChangesAsync(ct);

        return await CampaignQueries.ToDtoAsync(db, campaign, ct);
    }

    private CampaignStep AddStep(Campaign campaign, int position)
    {
        var step = new CampaignStep { CampaignId = campaign.Id, Position = position };
        campaign.Steps.Add(step);
        db.CampaignSteps.Add(step);
        return step;
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
