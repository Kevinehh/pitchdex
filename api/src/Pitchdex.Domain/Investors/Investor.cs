using Pitchdex.Domain.Common;

namespace Pitchdex.Domain.Investors;

/// <summary>
/// One person in the shared investor database that every founder searches in Explore.
/// Not owned by a workspace. A founder's own copy of an investor is a Lead.
/// </summary>
public sealed class Investor : IHasTimestamps
{
    public Guid Id { get; private init; } = Guid.CreateVersion7();

    public required string FullName { get; set; }

    public required string FirstName { get; set; }

    public string? LastName { get; set; }

    public required string Email { get; set; }

    public string? Title { get; set; }

    public string? LinkedInUrl { get; set; }

    /// <summary>The full place as shown to users, such as "Boston, Massachusetts, United States".</summary>
    public string? Location { get; set; }

    public string? City { get; set; }

    public string? Region { get; set; }

    public string? Country { get; set; }

    public string? FirmName { get; set; }

    public string? FirmDomain { get; set; }

    public string? FirmLinkedInUrl { get; set; }

    public string? FirmIndustry { get; set; }

    /// <summary>Such as "Traditional VC", "Micro VC" or "Family Office".</summary>
    public string? FundType { get; set; }

    /// <summary>"Lead", "Follow" or "Co-Invest".</summary>
    public string? InvestmentRole { get; set; }

    /// <summary>Such as "Pre-Seed", "Seed", "Series A".</summary>
    public List<string> Stages { get; set; } = [];

    public List<string> Industries { get; set; } = [];

    public List<string> Geographies { get; set; } = [];

    /// <summary>Smallest typical cheque, in US dollars.</summary>
    public long? CheckSizeMin { get; set; }

    /// <summary>Largest typical cheque, in US dollars. Empty means no upper limit, as in "$50M+".</summary>
    public long? CheckSizeMax { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
