using FluentValidation;
using Pitchdex.Application.Common;
using Pitchdex.Domain.Leads;

namespace Pitchdex.Application.Leads;

public sealed record CreateLeadCommand(string FullName, string Email, string? Firm = null, string? LinkedInUrl = null);

public sealed class CreateLeadValidator : AbstractValidator<CreateLeadCommand>
{
    public CreateLeadValidator()
    {
        RuleFor(c => c.FullName).NotEmpty().MaximumLength(200);
        RuleFor(c => c.Email).NotEmpty().EmailAddress().MaximumLength(320);
        RuleFor(c => c.Firm).MaximumLength(200);
        RuleFor(c => c.LinkedInUrl)
            .MaximumLength(500)
            .Must(LinkedInProfile.IsProfileUrl)
            .WithMessage("Enter a LinkedIn profile link, like https://www.linkedin.com/in/name")
            .When(c => !string.IsNullOrWhiteSpace(c.LinkedInUrl));
    }
}

public sealed class CreateLeadHandler(IAppDbContext db)
{
    public async Task<LeadDto> Handle(CreateLeadCommand command, CancellationToken ct)
    {
        var lead = new Lead
        {
            FullName = command.FullName.Trim(),
            Email = command.Email.Trim(),
            Firm = string.IsNullOrWhiteSpace(command.Firm) ? null : command.Firm.Trim(),
            LinkedInUrl = string.IsNullOrWhiteSpace(command.LinkedInUrl) ? null : command.LinkedInUrl.Trim(),
        };

        db.Leads.Add(lead);
        await db.SaveChangesAsync(ct);

        return LeadDto.From(lead);
    }
}
