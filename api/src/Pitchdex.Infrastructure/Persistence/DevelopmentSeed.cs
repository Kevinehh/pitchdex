using Microsoft.EntityFrameworkCore;
using Pitchdex.Domain.Investors;
using Pitchdex.Infrastructure.Investors;

namespace Pitchdex.Infrastructure.Persistence;

/// <summary>Where local sample data comes from. Only used in Development.</summary>
public sealed record DevelopmentSeedOptions(string? InvestorsCsvPath);

/// <summary>
/// Sample data for local development. Runs on every start and only fills empty tables,
/// so it never overwrites anything you've changed. Only the shared investor data is seeded:
/// leads belong to a workspace, so founders save their own from Explore.
/// </summary>
internal static class DevelopmentSeed
{
    public static Task SeedAsync(DbContext context, DevelopmentSeedOptions options, CancellationToken ct) =>
        SeedInvestorsAsync(context, options.InvestorsCsvPath, ct);

    /// <summary>
    /// The investor sample file holds real people's public profiles, so it lives in the
    /// git-ignored data/ folder. Without the file, local development has no investors.
    /// </summary>
    private static async Task SeedInvestorsAsync(DbContext context, string? csvPath, CancellationToken ct)
    {
        if (csvPath is null || !File.Exists(csvPath))
        {
            return;
        }

        var investors = context.Set<Investor>();
        if (await investors.AnyAsync(ct))
        {
            return;
        }

        investors.AddRange(await InvestorCsvReader.ReadAsync(csvPath, ct));
        await context.SaveChangesAsync(ct);
    }
}
