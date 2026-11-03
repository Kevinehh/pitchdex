using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;
using Pitchdex.Application.Integrations;
using Pitchdex.Domain.Accounts;
using Pitchdex.Domain.Leads;

namespace Pitchdex.Application.Leads;

/// <summary>Keeping what LinkedIn shows about a lead on the lead.</summary>
public static class LinkedInProfiles
{
    /// <summary>Saved profiles are looked up again after this. LinkedIn's picture links last about three weeks.</summary>
    public static readonly TimeSpan RefreshAfter = TimeSpan.FromDays(14);

    /// <summary>What to ask LinkedIn for: the provider's id once known, otherwise the end of the link.</summary>
    public static string? Identifier(Lead lead) =>
        lead.LinkedInProviderId ?? LinkedInProfile.PublicIdentifier(lead.LinkedInUrl);

    public static void Apply(Lead lead, LinkedInPerson person, DateTimeOffset now)
    {
        lead.LinkedInProviderId = person.ProviderId;
        lead.LinkedInCheckedAt = now;
        lead.LinkedIn = new LinkedInSnapshot
        {
            Headline = person.Headline,
            Location = person.Location,
            PictureUrl = person.PictureUrl,
            Degree = person.Degree,
            IsOpenProfile = person.IsOpenProfile,
            IsPremium = person.IsPremium,
            FetchedAt = now,
        };
    }

    /// <summary>The account profiles are looked up through: the workspace's first working LinkedIn account.</summary>
    public static Task<ConnectedAccount?> LookupAccountAsync(IAppDbContext db, CancellationToken ct) =>
        db.ConnectedAccounts
            .Where(a => a.Channel == AccountChannel.LinkedIn && a.Status == AccountStatus.Connected)
            .OrderBy(a => a.CreatedAt)
            .FirstOrDefaultAsync(ct);
}

/// <summary>A lead's saved LinkedIn details, for lists and the Inbox.</summary>
public sealed record LeadLinkedInDto(
    string? PictureUrl,
    string? Headline,
    string? Location,
    LinkedInDegree? Degree,
    bool IsOpenProfile,
    bool IsPremium);
