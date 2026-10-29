using Pitchdex.Domain.Accounts;
using Pitchdex.Domain.Messages;

namespace Pitchdex.Domain.Campaigns;

/// <summary>
/// The safety limits connected accounts are held to, counting campaign and manual sends.
/// Each account has its own daily limits, set in Settings between 0 and the maximums here.
/// A ramp-up for brand-new accounts comes later.
/// </summary>
public static class SendingLimits
{
    /// <summary>A new account's daily limit for each kind: safe for an account with a normal history.</summary>
    public static int DefaultPerDay(MessageKind kind) => kind switch
    {
        MessageKind.Email => 30,
        MessageKind.LinkedInInvitation => 15,
        MessageKind.LinkedInMessage => 40,
        _ => 0,
    };

    /// <summary>
    /// The highest daily limit a founder can choose. Past these, LinkedIn restricts accounts
    /// and mailbox providers start sending to spam, whatever the account's age.
    /// </summary>
    public static int MaxPerDay(MessageKind kind) => kind switch
    {
        MessageKind.Email => 150,
        MessageKind.LinkedInInvitation => 40,
        MessageKind.LinkedInMessage => 100,
        _ => 0,
    };

    /// <summary>What each kind of account sends: invitations and messages, or emails.</summary>
    public static IReadOnlyList<MessageKind> KindsFor(AccountChannel channel) =>
        channel == AccountChannel.Email
            ? [MessageKind.Email]
            : [MessageKind.LinkedInInvitation, MessageKind.LinkedInMessage];

    /// <summary>LinkedIn caps weekly invitations itself, so Pitchdex stays well under that.</summary>
    public const int LinkedInInvitationsPerWeek = 80;

    /// <summary>
    /// How long a LinkedIn message step waits for its connection request to be accepted.
    /// After that the step is skipped and the sequence moves on.
    /// </summary>
    public static readonly TimeSpan InvitationAcceptanceWindow = TimeSpan.FromDays(14);

    public static MessageKind KindOf(StepType step) => step switch
    {
        StepType.Email => MessageKind.Email,
        StepType.LinkedInInvitation => MessageKind.LinkedInInvitation,
        _ => MessageKind.LinkedInMessage,
    };
}

/// <summary>When a campaign may send, in its own time zone.</summary>
public static class SendingWindow
{
    public static bool IsOpen(Campaign campaign, DateTimeOffset now)
    {
        var local = TimeZoneInfo.ConvertTime(now, Zone(campaign));
        return IsSendingDay(campaign, local.DayOfWeek) &&
            local.Hour >= campaign.SendFromHour &&
            local.Hour < campaign.SendUntilHour;
    }

    /// <summary>The next moment the window opens, at or after <paramref name="now"/>.</summary>
    public static DateTimeOffset NextOpening(Campaign campaign, DateTimeOffset now)
    {
        if (IsOpen(campaign, now))
        {
            return now;
        }

        var zone = Zone(campaign);
        var local = TimeZoneInfo.ConvertTime(now, zone);

        for (var days = 0; days <= 7; days++)
        {
            var date = local.Date.AddDays(days);
            var opening = new DateTime(date.Year, date.Month, date.Day, campaign.SendFromHour, 0, 0, DateTimeKind.Unspecified);
            var openingUtc = new DateTimeOffset(opening, zone.GetUtcOffset(opening));

            if (openingUtc > now && IsSendingDay(campaign, opening.DayOfWeek))
            {
                return openingUtc;
            }
        }

        return now.AddHours(1);
    }

    public static TimeZoneInfo Zone(Campaign campaign) =>
        TimeZoneInfo.TryFindSystemTimeZoneById(campaign.TimeZoneId, out var zone) ? zone : TimeZoneInfo.Utc;

    private static bool IsSendingDay(Campaign campaign, DayOfWeek day) =>
        !campaign.WeekdaysOnly || (day != DayOfWeek.Saturday && day != DayOfWeek.Sunday);
}
