using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;
using Pitchdex.Domain.Accounts;
using Pitchdex.Domain.Messages;

namespace Pitchdex.Application.Inbox;

public sealed record ListMessagesQuery
{
    public int Page { get; init; } = 1;

    public int PageSize { get; init; } = 25;

    /// <summary>Only email, or only LinkedIn. Empty for both.</summary>
    public AccountChannel? Channel { get; init; }

    public MessageDirection? Direction { get; init; }

    public Guid? LeadId { get; init; }
}

public sealed class ListMessagesValidator : AbstractValidator<ListMessagesQuery>
{
    public ListMessagesValidator()
    {
        RuleFor(q => q.Page).GreaterThan(0);
        RuleFor(q => q.PageSize).InclusiveBetween(1, 100);
    }
}

/// <summary>Messages with leads, newest first, across every connected account.</summary>
public sealed class ListMessagesHandler(IAppDbContext db)
{
    public async Task<Paged<MessageDto>> Handle(ListMessagesQuery query, CancellationToken ct)
    {
        var messages = db.Messages.AsNoTracking();

        if (query.Channel is { } channel)
        {
            messages = channel == AccountChannel.Email
                ? messages.Where(m => m.Kind == MessageKind.Email)
                : messages.Where(m => m.Kind != MessageKind.Email);
        }

        if (query.Direction is { } direction)
        {
            messages = messages.Where(m => m.Direction == direction);
        }

        if (query.LeadId is { } leadId)
        {
            messages = messages.Where(m => m.LeadId == leadId);
        }

        var total = await messages.CountAsync(ct);
        var items = await messages
            .OrderByDescending(m => m.SentAt)
            .ThenByDescending(m => m.Id)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(m => new MessageDto(
                m.Id,
                m.AccountId,
                db.ConnectedAccounts.Where(a => a.Id == m.AccountId).Select(a => a.DisplayName).First(),
                m.LeadId,
                db.Leads.Where(l => l.Id == m.LeadId).Select(l => l.FullName).FirstOrDefault(),
                m.Kind,
                m.Direction,
                m.Subject,
                m.Body,
                m.SentAt,
                m.AcceptedAt))
            .ToListAsync(ct);

        return new Paged<MessageDto>(items, total, query.Page, query.PageSize);
    }
}
