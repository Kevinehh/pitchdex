using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;
using Pitchdex.Domain.Accounts;
using Pitchdex.Domain.Campaigns;

namespace Pitchdex.Application.Campaigns;

public enum CampaignAction
{
    Launch,
    Pause,
    Resume,
}

/// <summary>
/// Launching or resuming checks the campaign can really send: every step filled in, and
/// a connected account for each kind of step. Pausing always works.
/// </summary>
public sealed class ChangeCampaignStatusHandler(IAppDbContext db)
{
    public async Task<CampaignDto> Handle(Guid campaignId, CampaignAction action, CancellationToken ct)
    {
        var campaign = await CampaignQueries.LoadAsync(db, campaignId, ct);

        switch (action)
        {
            case CampaignAction.Pause:
                if (campaign.Status != CampaignStatus.Active)
                {
                    throw new UseCaseException("Only a running campaign can be paused.");
                }

                campaign.Status = CampaignStatus.Paused;
                break;

            case CampaignAction.Launch or CampaignAction.Resume:
                if (campaign.Status == CampaignStatus.Active)
                {
                    throw new UseCaseException("This campaign is already running.");
                }

                await CheckReadyAsync(campaign, ct);
                campaign.Status = CampaignStatus.Active;
                break;
        }

        await db.SaveChangesAsync(ct);
        return await CampaignQueries.ToDtoAsync(db, campaign, ct);
    }

    private async Task CheckReadyAsync(Campaign campaign, CancellationToken ct)
    {
        var steps = campaign.Steps.OrderBy(s => s.Position).ToList();
        if (steps.Count == 0)
        {
            throw new UseCaseException("Add at least one step before launching.");
        }

        var incomplete = steps.FirstOrDefault(s =>
            (s.Type == StepType.Email && (string.IsNullOrWhiteSpace(s.Subject) || string.IsNullOrWhiteSpace(s.Body))) ||
            (s.Type == StepType.LinkedInMessage && string.IsNullOrWhiteSpace(s.Body)));
        if (incomplete is not null)
        {
            throw new UseCaseException($"Step {incomplete.Position + 1} isn't finished. Fill in its message first.");
        }

        if (steps.Any(s => s.Type == StepType.Email))
        {
            await CheckSenderAsync(campaign.EmailAccountId, "Choose a connected mailbox to send the email steps from.", ct);
        }

        if (steps.Any(s => s.Type != StepType.Email))
        {
            await CheckSenderAsync(campaign.LinkedInAccountId, "Choose a connected LinkedIn account to send the LinkedIn steps from.", ct);
        }
    }

    private async Task CheckSenderAsync(Guid? accountId, string problem, CancellationToken ct)
    {
        var connected = accountId is not null && await db.ConnectedAccounts
            .AnyAsync(a => a.Id == accountId && a.Status == AccountStatus.Connected, ct);

        if (!connected)
        {
            throw new UseCaseException(problem);
        }
    }
}
