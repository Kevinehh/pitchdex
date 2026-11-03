namespace Pitchdex.Application.Campaigns;

/// <summary>The template gallery shown when starting a campaign.</summary>
public sealed class ListCampaignTemplatesHandler
{
    public IReadOnlyList<CampaignTemplate> Handle() => CampaignTemplates.All;
}
