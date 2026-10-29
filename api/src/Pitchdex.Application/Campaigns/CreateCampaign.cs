using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;
using Pitchdex.Application.Workspaces;
using Pitchdex.Domain.Accounts;
using Pitchdex.Domain.Campaigns;

namespace Pitchdex.Application.Campaigns;

public sealed record CreateCampaignCommand(string Name, string? TimeZoneId = null);

public sealed class CreateCampaignValidator : AbstractValidator<CreateCampaignCommand>
{
    public CreateCampaignValidator()
    {
        RuleFor(c => c.Name).NotEmpty().MaximumLength(200);
        RuleFor(c => c.TimeZoneId)
            .Must(id => TimeZoneInfo.TryFindSystemTimeZoneById(id!, out _))
            .WithMessage("Choose a valid time zone.")
            .When(c => c.TimeZoneId is not null);
    }
}

/// <summary>
/// Creates a draft campaign with one starter email step to edit, and the founder's first
/// connected accounts already chosen as senders.
/// </summary>
public sealed class CreateCampaignHandler(IAppDbContext db, WorkspaceContext workspace)
{
    public async Task<CampaignDto> Handle(CreateCampaignCommand command, CancellationToken ct)
    {
        var accounts = await db.ConnectedAccounts
            .Where(a => a.Status == AccountStatus.Connected)
            .OrderBy(a => a.CreatedAt)
            .ToListAsync(ct);

        var campaign = new Campaign
        {
            Name = command.Name.Trim(),
            EmailAccountId = accounts.FirstOrDefault(a => a.Channel == AccountChannel.Email)?.Id,
            LinkedInAccountId = accounts.FirstOrDefault(a => a.Channel == AccountChannel.LinkedIn)?.Id,
            Steps =
            [
                new CampaignStep
                {
                    Position = 0,
                    Type = StepType.Email,
                    Subject = "Quick intro",
                    Body = "Hi {{firstName}},\n\nI'm raising our seed round and thought {{firm}} could be a great fit. Open to a short call?\n\nThanks",
                },
            ],
        };

        // New campaigns start from the workspace's working hours, set in Settings.
        var defaults = await CurrentWorkspace.LoadAsync(db, workspace, ct);
        campaign.TimeZoneId = command.TimeZoneId ?? defaults.TimeZoneId;
        campaign.SendFromHour = defaults.SendFromHour;
        campaign.SendUntilHour = defaults.SendUntilHour;
        campaign.WeekdaysOnly = defaults.WeekdaysOnly;

        db.Campaigns.Add(campaign);
        await db.SaveChangesAsync(ct);

        return await CampaignQueries.ToDtoAsync(db, campaign, ct);
    }
}
