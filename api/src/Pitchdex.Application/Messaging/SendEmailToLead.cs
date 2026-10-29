using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Accounts;
using Pitchdex.Application.Common;
using Pitchdex.Application.Inbox;
using Pitchdex.Domain.Accounts;

namespace Pitchdex.Application.Messaging;

public sealed record SendEmailCommand(Guid LeadId, Guid AccountId, string Subject, string Body);

public sealed class SendEmailValidator : AbstractValidator<SendEmailCommand>
{
    public SendEmailValidator()
    {
        RuleFor(c => c.LeadId).NotEmpty();
        RuleFor(c => c.AccountId).NotEmpty().WithMessage("Choose an email account.");
        RuleFor(c => c.Subject).NotEmpty().MaximumLength(300);
        RuleFor(c => c.Body).NotEmpty().MaximumLength(20_000);
    }
}

/// <summary>Sends one email to a lead by hand, from a connected mailbox.</summary>
public sealed class SendEmailHandler(IAppDbContext db, LeadMessenger messenger)
{
    public async Task<MessageDto> Handle(SendEmailCommand command, CancellationToken ct)
    {
        var lead = await db.Leads.FirstOrDefaultAsync(l => l.Id == command.LeadId, ct)
            ?? throw new NotFoundException("That lead doesn't exist.");
        var account = await AccountLookup.GetUsableAsync(db, command.AccountId, AccountChannel.Email, ct);

        var message = await messenger.SendEmailAsync(lead, account, command.Subject.Trim(), command.Body, source: null, replyTo: null, ct);
        await db.SaveChangesAsync(ct);

        return MessageDto.From(message, account.DisplayName, lead.FullName);
    }
}
