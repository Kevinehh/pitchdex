namespace Pitchdex.Application.Investors;

/// <summary>
/// One investor as Explore shows it. Email is left out on purpose: founders get it
/// by saving the investor as a lead, which keeps the database harder to scrape.
/// </summary>
/// <param name="LeadId">The lead created from this investor, if it has been saved.</param>
public sealed record InvestorDto(
    Guid Id,
    string FullName,
    string? Title,
    string? FirmName,
    string? FirmDomain,
    string? LinkedInUrl,
    string? Location,
    string? FundType,
    string? InvestmentRole,
    IReadOnlyList<string> Stages,
    IReadOnlyList<string> Industries,
    IReadOnlyList<string> Geographies,
    long? CheckSizeMin,
    long? CheckSizeMax,
    Guid? LeadId);
