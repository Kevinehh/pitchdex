using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;
using CsvHelper.Configuration.Attributes;
using Pitchdex.Domain.Investors;

namespace Pitchdex.Infrastructure.Investors;

/// <summary>
/// Reads investors from the CSV export of the old app's discover_investors table.
/// Used for local sample data now, and the starting point for the admin import later.
/// </summary>
public static class InvestorCsvReader
{
    public static async Task<List<Investor>> ReadAsync(string path, CancellationToken ct)
    {
        using var reader = new StreamReader(path);
        using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            PrepareHeaderForMatch = args => args.Header.Trim().ToLowerInvariant(),
            MissingFieldFound = null,
        });

        var investors = new List<Investor>();
        await foreach (var row in csv.GetRecordsAsync<InvestorCsvRow>(ct))
        {
            if (string.IsNullOrWhiteSpace(row.Email) || string.IsNullOrWhiteSpace(row.FullName))
            {
                continue;
            }

            investors.Add(ToInvestor(row));
        }

        return investors;
    }

    private static Investor ToInvestor(InvestorCsvRow row)
    {
        var (checkMin, checkMax) = ParseCheckSize(row);

        return new Investor
        {
            FullName = row.FullName!.Trim(),
            FirstName = Clean(row.FirstName) ?? row.FullName!.Trim().Split(' ')[0],
            LastName = Clean(row.LastName),
            Email = row.Email!.Trim(),
            Title = Clean(row.Title),
            LinkedInUrl = Clean(row.LinkedInUrl),
            Location = Clean(row.Location),
            City = Clean(row.Locality),
            Region = Clean(row.Region),
            Country = TitleCase(Clean(row.Country)),
            FirmName = Clean(row.Company),
            FirmDomain = Clean(row.CompanyDomain),
            FirmLinkedInUrl = Clean(row.CompanyLinkedInUrl),
            FirmIndustry = Clean(row.CompanyIndustry),
            FundType = Clean(row.InvestmentType),
            InvestmentRole = Clean(row.InvestmentRole),
            Stages = SplitList(row.InvestmentStages),
            Industries = SplitList(row.Industries),
            Geographies = SplitList(row.Geographies),
            CheckSizeMin = checkMin,
            CheckSizeMax = checkMax,
        };
    }

    /// <summary>
    /// The export already has numbers, but stored "$50M+" as 50M to 50M. A label
    /// ending in "+" means no upper limit, so the maximum is left empty.
    /// </summary>
    private static (long? Min, long? Max) ParseCheckSize(InvestorCsvRow row)
    {
        var min = ParseLong(row.InvestmentRangeMin);
        var max = ParseLong(row.InvestmentRangeMax);
        var openEnded = row.CheckSize?.Trim().EndsWith('+') == true;

        return (min, openEnded ? null : max);
    }

    private static long? ParseLong(string? value) =>
        long.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var number) ? number : null;

    private static string? Clean(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    /// <summary>Fixes rows like "united states" so filters and display stay consistent.</summary>
    private static string? TitleCase(string? value) =>
        value is null ? null : CultureInfo.InvariantCulture.TextInfo.ToTitleCase(value.ToLowerInvariant());

    private static List<string> SplitList(string? value) =>
        string.IsNullOrWhiteSpace(value)
            ? []
            : value.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

    /// <summary>One CSV row exactly as exported, before any cleaning.</summary>
    internal sealed class InvestorCsvRow
    {
        [Name("first_name")] public string? FirstName { get; set; }
        [Name("last_name")] public string? LastName { get; set; }
        [Name("full_name")] public string? FullName { get; set; }
        [Name("email")] public string? Email { get; set; }
        [Name("title")] public string? Title { get; set; }
        [Name("company")] public string? Company { get; set; }
        [Name("company_domain")] public string? CompanyDomain { get; set; }
        [Name("company_linkedin_url")] public string? CompanyLinkedInUrl { get; set; }
        [Name("company_industry")] public string? CompanyIndustry { get; set; }
        [Name("locality")] public string? Locality { get; set; }
        [Name("region")] public string? Region { get; set; }
        [Name("country")] public string? Country { get; set; }
        [Name("location")] public string? Location { get; set; }
        [Name("linkedin_url")] public string? LinkedInUrl { get; set; }
        [Name("investment_type")] public string? InvestmentType { get; set; }
        [Name("investment_stages")] public string? InvestmentStages { get; set; }
        [Name("industries")] public string? Industries { get; set; }
        [Name("check_size")] public string? CheckSize { get; set; }
        [Name("investment_range_min")] public string? InvestmentRangeMin { get; set; }
        [Name("investment_range_max")] public string? InvestmentRangeMax { get; set; }
        [Name("investment_role")] public string? InvestmentRole { get; set; }
        [Name("geographies")] public string? Geographies { get; set; }
    }
}
