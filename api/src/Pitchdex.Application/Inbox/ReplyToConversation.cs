using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;
using Pitchdex.Application.Messaging;
using Pitchdex.Domain.Accounts;
using Pitchdex.Domain.Messages;

namespace Pitchdex.Application.Inbox;

/// <param name="Subject">For email only. Empty means "Re:" the last email's subject.</param>
public sealed record ReplyCommand(AccountChannel Channel, string Body, string? Subject = null);

public sealed class ReplyValidator : AbstractValidator<ReplyCommand>
{
    public ReplyValidator()
    {
        RuleFor(c => c.Body).NotEmpty().WithMessage("Write a message.").MaximumLength(20_000);
        RuleFor(c => c.Body).MaximumLength(8_000).When(c => c.Channel == AccountChannel.LinkedIn);
        RuleFor(c => c.Subject).MaximumLength(300);
    }
}

/// <summary>
/// Answers a lead from the Inbox. The reply goes from the account the conversation is
/// already on, and an email lands in the same thread as the one it answers.
/// </summary>
public sealed class ReplyToConversationHandler(IAppDbContext db, LeadMessenger messenger, TimeProvider clock)
{
    public async Task<MessageDto> Handle(Guid leadId, ReplyCommand command, CancellationToken ct)
    {
        var lead = await db.Leads.FirstOrDefaultAsync(l => l.Id == leadId, ct)
            ?? throw new NotFoundException("That lead doesn't exist.");

        var isEmail = command.Channel == AccountChannel.Email;
        var history = db.Messages.Where(m => m.LeadId == leadId && (isEmail
            ? m.Kind == MessageKind.Email
            : m.Kind != MessageKind.Email));

        // The lead's latest message on this channel, or failing that the founder's own.
        var answering = await history
            .OrderBy(m => m.Direction == MessageDirection.Inbound ? 0 : 1)
            .ThenByDescending(m => m.SentAt)
            .FirstOrDefaultAsync(ct);
        var account = await SenderAsync(command.Channel, answering?.AccountId, ct);

        Message sent;
        if (isEmail)
        {
            var subject = string.IsNullOrWhiteSpace(command.Subject)
                ? ReplySubject.For(answering?.Subject) ?? throw new UseCaseException("Add a subject for this email.")
                : command.Subject.Trim();
            sent = await messenger.SendEmailAsync(lead, account, subject, command.Body, source: null, answering, ct);
        }
        else
        {
            sent = await messenger.SendLinkedInAsync(lead, account, MessageKind.LinkedInMessage, command.Body, source: null, ct);
        }

        // Answering a conversation means it's been read.
        await ConversationReads.MarkReadAsync(db, leadId, clock.GetUtcNow(), ct);
        await db.SaveChangesAsync(ct);

        return MessageDto.From(sent, account.DisplayName, lead.FullName);
    }

    /// <summary>The account the conversation is on when it's still connected, otherwise any connected one.</summary>
    private async Task<ConnectedAccount> SenderAsync(AccountChannel channel, Guid? preferredId, CancellationToken ct)
    {
        var accounts = await db.ConnectedAccounts
            .Where(a => a.Channel == channel && a.Status == AccountStatus.Connected)
            .OrderBy(a => a.CreatedAt)
            .ToListAsync(ct);

        return accounts.FirstOrDefault(a => a.Id == preferredId)
            ?? accounts.FirstOrDefault()
            ?? throw new UseCaseException(channel == AccountChannel.Email
                ? "Connect a mailbox in Settings to reply by email."
                : "Connect a LinkedIn account in Settings to reply on LinkedIn.");
    }
}
