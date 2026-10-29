using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;
using Pitchdex.Domain.Messages;

namespace Pitchdex.Application.Inbox;

/// <summary>Changes only the fields that are set. Starring is on the lead itself.</summary>
public sealed record UpdateConversationCommand(bool? IsArchived = null, bool? IsRead = null);

/// <summary>Archives a conversation or brings it back, and marks it read or unread.</summary>
public sealed class UpdateConversationHandler(IAppDbContext db, TimeProvider clock)
{
    public async Task Handle(Guid leadId, UpdateConversationCommand command, CancellationToken ct)
    {
        var lead = await db.Leads.FirstOrDefaultAsync(l => l.Id == leadId, ct)
            ?? throw new NotFoundException("That lead doesn't exist.");
        var now = clock.GetUtcNow();

        if (command.IsArchived is { } archived)
        {
            lead.ArchivedAt = archived ? now : null;
        }

        if (command.IsRead == true)
        {
            await ConversationReads.MarkReadAsync(db, leadId, now, ct);
        }
        else if (command.IsRead == false)
        {
            // Unread again from the latest reply, the way mail apps do it.
            var latest = await db.Messages
                .Where(m => m.LeadId == leadId && m.Direction == MessageDirection.Inbound)
                .OrderByDescending(m => m.SentAt)
                .FirstOrDefaultAsync(ct);
            latest?.ReadAt = null;
        }

        await db.SaveChangesAsync(ct);
    }
}

internal static class ConversationReads
{
    /// <summary>Marks every unread reply from the lead as read. The caller saves.</summary>
    public static async Task MarkReadAsync(IAppDbContext db, Guid leadId, DateTimeOffset now, CancellationToken ct)
    {
        var unread = await db.Messages
            .Where(m => m.LeadId == leadId && m.Direction == MessageDirection.Inbound && m.ReadAt == null)
            .ToListAsync(ct);
        foreach (var message in unread)
        {
            message.ReadAt = now;
        }
    }
}
