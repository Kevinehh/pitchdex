using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;
using Pitchdex.Application.Leads;
using Pitchdex.Domain.Accounts;
using Pitchdex.Domain.Messages;

namespace Pitchdex.Application.Inbox;

/// <summary>Everything the Inbox shows for one lead: the messages, who they are, and their campaigns.</summary>
public sealed class GetConversationHandler(IAppDbContext db)
{
    /// <summary>Older messages than this aren't shown. Plenty for an investor conversation.</summary>
    private const int MaxMessages = 200;

    public async Task<ConversationDto> Handle(Guid leadId, CancellationToken ct)
    {
        var lead = await db.Leads.AsNoTracking().FirstOrDefaultAsync(l => l.Id == leadId, ct)
            ?? throw new NotFoundException("That lead doesn't exist.");

        var investor = lead.InvestorId is { } investorId
            ? await db.Investors.AsNoTracking()
                .Where(i => i.Id == investorId)
                .Select(i => new { i.Title, i.City, i.Region, i.Country, i.FirmDomain })
                .FirstOrDefaultAsync(ct)
            : null;

        var messages = await db.Messages.AsNoTracking()
            .Where(m => m.LeadId == leadId)
            .OrderByDescending(m => m.SentAt)
            .ThenByDescending(m => m.Id)
            .Take(MaxMessages)
            .Select(m => new MessageDto(
                m.Id,
                m.AccountId,
                db.ConnectedAccounts.Where(a => a.Id == m.AccountId).Select(a => a.DisplayName).First(),
                m.LeadId,
                lead.FullName,
                m.Kind,
                m.Direction,
                m.Subject,
                m.Body,
                m.SentAt,
                m.AcceptedAt))
            .ToListAsync(ct);
        messages.Reverse();

        var campaigns = await db.Enrollments.AsNoTracking()
            .Where(e => e.LeadId == leadId)
            .OrderBy(e => e.CreatedAt)
            .Join(db.Campaigns, e => e.CampaignId, c => c.Id, (e, c) => new LeadCampaignDto(c.Id, c.Name, c.Status, e.Status))
            .ToListAsync(ct);

        var connected = await db.ConnectedAccounts.AsNoTracking()
            .Where(a => a.Status == AccountStatus.Connected)
            .Select(a => a.Channel)
            .Distinct()
            .ToListAsync(ct);

        var location = investor is null
            ? null
            : string.Join(", ", new[] { investor.City, investor.Region, investor.Country }.Where(p => !string.IsNullOrWhiteSpace(p)));

        return new ConversationDto(
            new ConversationLeadDto(
                lead.Id,
                lead.FullName,
                lead.Email,
                lead.Firm,
                lead.LinkedInUrl,
                lead.Status,
                lead.IsStarred,
                investor?.Title,
                string.IsNullOrEmpty(location) ? null : location,
                investor?.FirmDomain),
            lead.ArchivedAt != null,
            await db.Messages.CountAsync(m =>
                m.LeadId == leadId && m.Direction == MessageDirection.Inbound && m.ReadAt == null, ct),
            messages,
            campaigns,
            new ReplyOptionsDto(
                CanEmail: connected.Contains(AccountChannel.Email),
                CanLinkedIn: connected.Contains(AccountChannel.LinkedIn) && lead.LinkedInUrl is not null,
                DefaultChannel: DefaultChannel(messages),
                EmailSubject: ReplySubject.For(messages.LastOrDefault(m => m.Kind == MessageKind.Email)?.Subject)));
    }

    /// <summary>The channel the lead last wrote on; failing that, the one last used; failing that, email.</summary>
    private static AccountChannel DefaultChannel(IReadOnlyList<MessageDto> messages)
    {
        var last = messages.LastOrDefault(m => m.Direction == MessageDirection.Inbound) ?? messages.LastOrDefault();
        return last is null || last.Kind == MessageKind.Email ? AccountChannel.Email : AccountChannel.LinkedIn;
    }
}

internal static class ReplySubject
{
    /// <summary>"Re: Quick intro" for a reply to "Quick intro", without stacking "Re: Re:".</summary>
    public static string? For(string? subject) =>
        string.IsNullOrWhiteSpace(subject) ? null
        : subject.StartsWith("Re:", StringComparison.OrdinalIgnoreCase) ? subject
        : $"Re: {subject}";
}
