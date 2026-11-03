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
    LeadLinkedInDto? LinkedIn,
    IReadOnlyList<LeadCampaignDto> Campaigns,
    DateTimeOffset UpdatedAt)
{
    /// <summary>A lead just created or changed. Its campaigns are only listed where they're needed.</summary>
    public static LeadDto From(Lead lead) =>
        new(lead.Id, lead.FullName, lead.Email, lead.Firm, lead.LinkedInUrl, lead.Status, lead.IsStarred, lead.InvestorId, LinkedInOf(lead.LinkedIn), [], lead.UpdatedAt);

    /// <summary>Also used in query projections, where it runs on the loaded profile.</summary>
    public static LeadLinkedInDto? LinkedInOf(LinkedInSnapshot? profile) =>
        profile == null
            ? null
            : new LeadLinkedInDto(profile.PictureUrl, profile.Headline, profile.Location, profile.Degree, profile.IsOpenProfile, profile.IsPremium);
}

/// <summary>A campaign a lead was added to, and where the lead is in it.</summary>
public sealed record LeadCampaignDto(Guid CampaignId, string Name, CampaignStatus CampaignStatus, EnrollmentStatus Status);
