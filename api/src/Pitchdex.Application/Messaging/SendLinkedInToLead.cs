using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Accounts;
using Pitchdex.Application.Common;
using Pitchdex.Application.Inbox;
using Pitchdex.Domain.Accounts;
using Pitchdex.Domain.Messages;

namespace Pitchdex.Application.Messaging;

public enum LinkedInAction
{
    /// <summary>A connection request, with an optional short note.</summary>
    Invitation,

    /// <summary>A message. LinkedIn only allows this once the lead has accepted.</summary>
    Message,
}

public sealed record SendLinkedInCommand(Guid LeadId, Guid AccountId, LinkedInAction Action, string? Text);

public sealed class SendLinkedInValidator : AbstractValidator<SendLinkedInCommand>
{
    /// <summary>LinkedIn caps connection-request notes at 300 characters, and lower on free accounts.</summary>
    public const int MaxNoteLength = 300;

    public SendLinkedInValidator()
    {
        RuleFor(c => c.LeadId).NotEmpty();
        RuleFor(c => c.AccountId).NotEmpty().WithMessage("Choose a LinkedIn account.");
        RuleFor(c => c.Text)
            .MaximumLength(MaxNoteLength)
            .When(c => c.Action == LinkedInAction.Invitation);
        RuleFor(c => c.Text)
            .NotEmpty()
            .MaximumLength(8_000)
            .When(c => c.Action == LinkedInAction.Message);
    }
}

/// <summary>
/// Sends a connection request or a message to a lead by hand, from a connected LinkedIn
/// account. The lead needs a LinkedIn profile link.
/// </summary>
public sealed class SendLinkedInHandler(IAppDbContext db, LeadMessenger messenger)
{
    public async Task<MessageDto> Handle(SendLinkedInCommand command, CancellationToken ct)
    {
        var lead = await db.Leads.FirstOrDefaultAsync(l => l.Id == command.LeadId, ct)
            ?? throw new NotFoundException("That lead doesn't exist.");
        var account = await AccountLookup.GetUsableAsync(db, command.AccountId, AccountChannel.LinkedIn, ct);

        var kind = command.Action == LinkedInAction.Invitation ? MessageKind.LinkedInInvitation : MessageKind.LinkedInMessage;
        var message = await messenger.SendLinkedInAsync(lead, account, kind, command.Text?.Trim() ?? "", source: null, ct);
        await db.SaveChangesAsync(ct);

        return MessageDto.From(message, account.DisplayName, lead.FullName);
    }
}
