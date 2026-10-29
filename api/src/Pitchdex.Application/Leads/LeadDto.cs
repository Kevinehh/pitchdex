using Pitchdex.Domain.Campaigns;
using Pitchdex.Domain.Leads;

namespace Pitchdex.Application.Leads;

public sealed record LeadDto(
    Guid Id,
    string FullName,
    string Email,
    string? Firm,
    string? LinkedInUrl,
    LeadStatus Status,
    bool IsStarred,
    Guid? InvestorId,
    IReadOnlyList<LeadCampaignDto> Campaigns,
    DateTimeOffset UpdatedAt)
{
    /// <summary>A lead just created or changed. Its campaigns are only listed where they're needed.</summary>
    public static LeadDto From(Lead lead) =>
        new(lead.Id, lead.FullName, lead.Email, lead.Firm, lead.LinkedInUrl, lead.Status, lead.IsStarred, lead.InvestorId, [], lead.UpdatedAt);
}

/// <summary>A campaign a lead was added to, and where the lead is in it.</summary>
public sealed record LeadCampaignDto(Guid CampaignId, string Name, CampaignStatus CampaignStatus, EnrollmentStatus Status);
