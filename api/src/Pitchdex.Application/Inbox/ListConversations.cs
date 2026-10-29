using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;
using Pitchdex.Domain.Leads;
using Pitchdex.Domain.Messages;

namespace Pitchdex.Application.Inbox;

public sealed record ListConversationsQuery
{
    public int Page { get; init; } = 1;

    public int PageSize { get; init; } = 25;

    public ConversationView View { get; init; } = ConversationView.All;

    public string? Search { get; init; }
}

public sealed class ListConversationsValidator : AbstractValidator<ListConversationsQuery>
{
    public ListConversationsValidator()
    {
        RuleFor(q => q.Page).GreaterThan(0);
        RuleFor(q => q.PageSize).InclusiveBetween(1, 100);
        RuleFor(q => q.Search).MaximumLength(200);
    }
}

/// <summary>
/// The Inbox list: one row per lead you've exchanged messages with, by email or LinkedIn,
/// most recent first.
/// </summary>
public sealed class ListConversationsHandler(IAppDbContext db)
{
    private const int SnippetLength = 160;

    public async Task<Paged<ConversationSummaryDto>> Handle(ListConversationsQuery query, CancellationToken ct)
    {
        var leads = Conversations.InView(db, query.View);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLowerInvariant();
            leads = leads.Where(l =>
                l.FullName.ToLower().Contains(search) ||
                l.Email.ToLower().Contains(search) ||
                (l.Firm != null && l.Firm.ToLower().Contains(search)));
        }

        var total = await leads.CountAsync(ct);
        var rows = await leads
            .Select(l => new
            {
                Lead = l,
                Last = db.Messages
                    .Where(m => m.LeadId == l.Id)
                    .OrderByDescending(m => m.SentAt)
                    .ThenByDescending(m => m.Id)
                    .Select(m => new { m.Kind, m.Direction, Snippet = m.Body.Substring(0, SnippetLength), m.SentAt })
                    .First(),
                Unread = db.Messages.Count(m =>
                    m.LeadId == l.Id && m.Direction == MessageDirection.Inbound && m.ReadAt == null),
            })
            .OrderByDescending(r => r.Last.SentAt)
            .ThenBy(r => r.Lead.Id)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(ct);

        var items = rows
            .Select(r => new ConversationSummaryDto(
                r.Lead.Id,
                r.Lead.FullName,
                r.Lead.Firm,
                r.Lead.Status,
                r.Last.Kind,
                r.Last.Direction,
                r.Last.Snippet,
                r.Last.SentAt,
                r.Unread,
                r.Lead.IsStarred,
                r.Lead.ArchivedAt != null))
            .ToList();

        return new Paged<ConversationSummaryDto>(items, total, query.Page, query.PageSize);
    }
}

/// <summary>Counts for the Inbox tabs, and the unread badge in the sidebar.</summary>
public sealed class CountConversationsHandler(IAppDbContext db)
{
    public async Task<ConversationCounts> Handle(CancellationToken ct) =>
        new(
            await Conversations.InView(db, ConversationView.Unread).CountAsync(ct),
            await Conversations.InView(db, ConversationView.Starred).CountAsync(ct),
            await Conversations.InView(db, ConversationView.Archived).CountAsync(ct));
}

internal static class Conversations
{
    /// <summary>Leads with at least one message, narrowed to an Inbox tab.</summary>
    public static IQueryable<Lead> InView(IAppDbContext db, ConversationView view)
    {
        var leads = db.Leads.AsNoTracking().Where(l => db.Messages.Any(m => m.LeadId == l.Id));
        return view switch
        {
            ConversationView.Unread => leads.Where(l => l.ArchivedAt == null && db.Messages.Any(m =>
                m.LeadId == l.Id && m.Direction == MessageDirection.Inbound && m.ReadAt == null)),
            ConversationView.Starred => leads.Where(l => l.IsStarred),
            ConversationView.Archived => leads.Where(l => l.ArchivedAt != null),
            _ => leads.Where(l => l.ArchivedAt == null),
        };
    }
}
