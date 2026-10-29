using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;
using Pitchdex.Domain.Accounts;
using Pitchdex.Domain.Campaigns;
using Pitchdex.Domain.Messages;

namespace Pitchdex.Application.Messaging;

/// <summary>Whether an account has room under its own sending limits right now.</summary>
public static class SendingQuota
{
    public static async Task<bool> HasRoomAsync(
        IAppDbContext db,
        ConnectedAccount account,
        MessageKind kind,
        DateTimeOffset now,
        CancellationToken ct)
    {
        var sent = db.Messages.Where(m =>
            m.AccountId == account.Id && m.Kind == kind && m.Direction == MessageDirection.Outbound);

        var lastDay = await sent.CountAsync(m => m.SentAt >= now.AddDays(-1), ct);
        if (lastDay >= account.DailyLimit(kind))
        {
            return false;
        }

        if (kind != MessageKind.LinkedInInvitation)
        {
            return true;
        }

        var lastWeek = await sent.CountAsync(m => m.SentAt >= now.AddDays(-7), ct);
        return lastWeek < SendingLimits.LinkedInInvitationsPerWeek;
    }

    public static string LimitReachedMessage(ConnectedAccount account, MessageKind kind)
    {
        var limit = account.DailyLimit(kind);
        return kind switch
        {
            MessageKind.Email => $"{account.DisplayName} has sent its {limit} emails for the last 24 hours.",
            MessageKind.LinkedInInvitation =>
                $"{account.DisplayName} is at its limit of {limit} connection requests a day " +
                $"or {SendingLimits.LinkedInInvitationsPerWeek} a week.",
            _ => $"{account.DisplayName} has sent its {limit} messages for the last 24 hours.",
        };
    }
}
