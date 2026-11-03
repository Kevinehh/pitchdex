using Pitchdex.Application.Accounts;
using Pitchdex.Application.Inbox;
using Pitchdex.Application.Leads;
using Pitchdex.Application.Meetings;

namespace Pitchdex.Api.Workers;

/// <summary>
/// Every couple of minutes: refreshes every account's status (one provider call covers all
/// workspaces), then pulls each workspace's new replies into its Inbox, looks up a few
/// leads' LinkedIn profiles and, every five minutes, reads new Calendly bookings. Every ten
/// minutes it also checks for accepted connection requests, which costs LinkedIn calls.
/// Runs inside the API for the MVP; it moves to the jobs service later. Once the app has a
/// public address, Unipile webhooks can make this near-instant.
/// </summary>
public sealed class MessagingSyncWorker(IServiceScopeFactory scopes, ILogger<MessagingSyncWorker> logger)
    : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(2);

    /// <summary>Invitations are checked on every fifth round: every ten minutes.</summary>
    private const int InvitationRounds = 5;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval);
        var round = 0;
        do
        {
            try
            {
                await using (var scope = scopes.CreateAsyncScope())
                {
                    await scope.ServiceProvider.GetRequiredService<SyncAccountsHandler>().Handle(stoppingToken);
                }

                var checkInvitations = round % InvitationRounds == 0;
                await WorkspaceScopes.ForEachAsync(scopes, logger, async (services, ct) =>
                {
                    var inbox = await services.GetRequiredService<SyncInboxHandler>().Handle(ct);
                    if (inbox.NewReplies > 0)
                    {
                        logger.LogInformation("Inbox sync stored {Count} new replies", inbox.NewReplies);
                    }

                    // Every round, so a newly added lead shows their profile within a couple of minutes.
                    var profiles = await services.GetRequiredService<RefreshLinkedInProfilesHandler>().Handle(ct);
                    if (profiles.Refreshed + profiles.Failed > 0)
                    {
                        logger.LogInformation("Looked up {Refreshed} LinkedIn profiles ({Failed} failed)", profiles.Refreshed, profiles.Failed);
                    }

                    var meetings = await services.GetRequiredService<SyncCalendlyMeetingsHandler>().Handle(force: false, ct);
                    if (meetings.Booked + meetings.Canceled > 0)
                    {
                        logger.LogInformation("Calendly: {Booked} meetings booked, {Canceled} canceled", meetings.Booked, meetings.Canceled);
                    }

                    if (checkInvitations)
                    {
                        var invitations = await services.GetRequiredService<SyncInvitationsHandler>().Handle(ct);
                        if (invitations.Accepted > 0)
                        {
                            logger.LogInformation("{Count} connection requests were accepted", invitations.Accepted);
                        }
                    }
                }, stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                // A failed round is retried on the next tick rather than stopping the worker.
                logger.LogWarning(ex, "Messaging sync failed");
            }

            round++;
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
