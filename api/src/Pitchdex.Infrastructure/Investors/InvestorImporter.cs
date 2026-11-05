using Microsoft.EntityFrameworkCore;
using Pitchdex.Domain.Investors;
using Pitchdex.Infrastructure.Persistence;

namespace Pitchdex.Infrastructure.Investors;

public sealed record InvestorImportResult(int Added, int Updated);

/// <summary>
/// Loads a CSV of investors into the shared database. Investors are matched by email, so
/// importing a newer file updates them in place and founders' leads stay linked. Nobody
/// is removed: someone missing from the file stays in Explore.
/// </summary>
public sealed class InvestorImporter(AppDbContext db)
{
    public async Task<InvestorImportResult> ImportAsync(string csvPath, CancellationToken ct)
    {
        var rows = await InvestorCsvReader.ReadAsync(csvPath, ct);
        var existing = await db.Investors.ToListAsync(ct);
        var byEmail = existing
            .GroupBy(i => i.Email, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

        var added = 0;
        var updated = 0;
        foreach (var row in rows)
        {
            if (byEmail.TryGetValue(row.Email, out var investor))
            {
                // A second row for the same person in one file also lands here: the last one wins.
                CopyDetails(row, investor);
                updated++;
            }
            else
            {
                db.Investors.Add(row);
                byEmail[row.Email] = row;
                added++;
            }
        }

        await db.SaveChangesAsync(ct);
        return new InvestorImportResult(added, updated);
    }

    private static void CopyDetails(Investor from, Investor to)
    {
        to.FullName = from.FullName;
        to.FirstName = from.FirstName;
        to.LastName = from.LastName;
        to.Title = from.Title;
        to.LinkedInUrl = from.LinkedInUrl;
        to.Location = from.Location;
        to.City = from.City;
        to.Region = from.Region;
        to.Country = from.Country;
        to.FirmName = from.FirmName;
        to.FirmDomain = from.FirmDomain;
        to.FirmLinkedInUrl = from.FirmLinkedInUrl;
        to.FirmIndustry = from.FirmIndustry;
        to.FundType = from.FundType;
        to.InvestmentRole = from.InvestmentRole;
        to.Stages = from.Stages;
        to.Industries = from.Industries;
        to.Geographies = from.Geographies;
        to.CheckSizeMin = from.CheckSizeMin;
        to.CheckSizeMax = from.CheckSizeMax;
    }
}
