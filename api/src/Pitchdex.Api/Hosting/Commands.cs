using Amazon.S3;
using Microsoft.EntityFrameworkCore;
using Pitchdex.Infrastructure.Investors;
using Pitchdex.Infrastructure.Persistence;

namespace Pitchdex.Api.Hosting;

/// <summary>
/// One-off jobs run from the same image as the API, such as
/// <c>dotnet Pitchdex.Api.dll migrate</c>. A deploy runs the migration before it starts any
/// new containers. Each job does its work and exits without starting the web server.
/// </summary>
public static class Commands
{
    /// <summary>Runs the job the arguments name. False when they don't name one, so the API starts as usual.</summary>
    public static async Task<bool> TryRunAsync(string[] args, WebApplication app)
    {
        switch (args)
        {
            case ["migrate"]:
                await MigrateAsync(app);
                return true;
            case ["import-investors", var source]:
                await ImportInvestorsAsync(app, source);
                return true;
            default:
                return false;
        }
    }

    private static async Task MigrateAsync(WebApplication app)
    {
        await using var scope = app.Services.CreateAsyncScope();
        await scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.MigrateAsync();
        app.Logger.LogInformation("Database is up to date");
    }

    /// <param name="source">A file path, or s3://bucket/key.</param>
    private static async Task ImportInvestorsAsync(WebApplication app, string source)
    {
        var downloaded = source.StartsWith("s3://", StringComparison.OrdinalIgnoreCase);
        var path = downloaded ? await DownloadAsync(new Uri(source)) : source;

        try
        {
            await using var scope = app.Services.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var result = await new InvestorImporter(db).ImportAsync(path, CancellationToken.None);
            app.Logger.LogInformation("Imported investors: {Added} added, {Updated} updated", result.Added, result.Updated);
        }
        finally
        {
            if (downloaded)
            {
                File.Delete(path);
            }
        }
    }

    private static async Task<string> DownloadAsync(Uri source)
    {
        using var s3 = new AmazonS3Client();
        using var response = await s3.GetObjectAsync(source.Host, source.AbsolutePath.TrimStart('/'));
        var path = Path.GetTempFileName();
        await using var file = File.Create(path);
        await response.ResponseStream.CopyToAsync(file);
        return path;
    }
}
