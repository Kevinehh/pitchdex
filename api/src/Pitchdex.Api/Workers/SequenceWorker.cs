using Pitchdex.Application.Campaigns;

namespace Pitchdex.Api.Workers;

/// <summary>
/// Runs the sequence engine every minute, for each workspace in turn. Runs inside the API
/// for the MVP; it moves to the jobs service later without changing the engine itself.
/// </summary>
public sealed class SequenceWorker(IServiceScopeFactory scopes, ILogger<SequenceWorker> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval);
        do
        {
            try
            {
                await WorkspaceScopes.ForEachAsync(
                    scopes,
                    logger,
                    (services, ct) => services.GetRequiredService<RunDueStepsHandler>().Handle(ct),
                    stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                // A failed run is retried on the next tick rather than stopping the worker.
                logger.LogWarning(ex, "Sequence engine run failed");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
