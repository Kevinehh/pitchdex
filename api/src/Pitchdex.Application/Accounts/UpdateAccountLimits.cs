using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;
using Pitchdex.Domain.Campaigns;
using Pitchdex.Domain.Messages;

namespace Pitchdex.Application.Accounts;

public sealed record LimitInput(MessageKind Kind, int Limit);

/// <param name="Limits">Only the kinds being changed. Others keep their limit.</param>
public sealed record UpdateAccountLimitsCommand(IReadOnlyList<LimitInput> Limits);

public sealed class UpdateAccountLimitsValidator : AbstractValidator<UpdateAccountLimitsCommand>
{
    public UpdateAccountLimitsValidator()
    {
        RuleFor(c => c.Limits).NotEmpty();
        RuleForEach(c => c.Limits).ChildRules(limit =>
            limit.RuleFor(l => l.Limit)
                .Must((input, value) => value >= 0 && value <= SendingLimits.MaxPerDay(input.Kind))
                .WithMessage(input => $"Choose between 0 and {SendingLimits.MaxPerDay(input.Kind)} a day."));
    }
}

/// <summary>Sets how much one account sends a day. Campaigns and manual sends both count.</summary>
public sealed class UpdateAccountLimitsHandler(IAppDbContext db, TimeProvider clock)
{
    public async Task<AccountDto> Handle(Guid accountId, UpdateAccountLimitsCommand command, CancellationToken ct)
    {
        var account = await db.ConnectedAccounts.FirstOrDefaultAsync(a => a.Id == accountId, ct)
            ?? throw new NotFoundException("That account isn't connected.");

        var kinds = SendingLimits.KindsFor(account.Channel);
        foreach (var input in command.Limits)
        {
            if (!kinds.Contains(input.Kind))
            {
                throw new UseCaseException(input.Kind == MessageKind.Email
                    ? "LinkedIn accounts don't send emails."
                    : "Mailboxes don't send LinkedIn invitations or messages.");
            }

            account.SetDailyLimit(input.Kind, input.Limit);
        }

        await db.SaveChangesAsync(ct);
        return (await AccountQueries.ToDtosAsync(db, [account], clock.GetUtcNow(), ct))[0];
    }
}
