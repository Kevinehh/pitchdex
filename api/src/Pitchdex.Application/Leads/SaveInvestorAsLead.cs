using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;
using Pitchdex.Domain.Leads;

namespace Pitchdex.Application.Leads;

public sealed record SaveInvestorAsLeadCommand(Guid InvestorId);

public sealed class SaveInvestorAsLeadValidator : AbstractValidator<SaveInvestorAsLeadCommand>
{
    public SaveInvestorAsLeadValidator()
    {
        RuleFor(c => c.InvestorId).NotEmpty();
    }
}

/// <summary>Created is false when the investor was already a lead.</summary>
public sealed record SaveInvestorAsLeadResult(LeadDto Lead, bool Created);

/// <summary>
/// Copies an investor from Explore into the founder's leads. Saving twice is safe:
/// it returns the lead that already exists instead of making a duplicate.
/// </summary>
public sealed class SaveInvestorAsLeadHandler(IAppDbContext db)
{
    /// <returns>Null when no investor has that id.</returns>
    public async Task<SaveInvestorAsLeadResult?> Handle(SaveInvestorAsLeadCommand command, CancellationToken ct)
    {
        var investor = await db.Investors
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == command.InvestorId, ct);

        if (investor is null)
        {
            return null;
        }

        // Already saved, or added by hand earlier with the same email: reuse that lead.
        var email = investor.Email.ToLowerInvariant();
        var existing = await db.Leads.FirstOrDefaultAsync(
            l => l.InvestorId == investor.Id || l.Email.ToLower() == email,
            ct);

        if (existing is not null)
        {
            if (existing.InvestorId is null)
            {
                existing.InvestorId = investor.Id;
                existing.LinkedInUrl ??= investor.LinkedInUrl;
                await db.SaveChangesAsync(ct);
            }

            return new SaveInvestorAsLeadResult(LeadDto.From(existing), Created: false);
        }

        var lead = new Lead
        {
            FullName = investor.FullName,
            Email = investor.Email,
            Firm = investor.FirmName,
            LinkedInUrl = investor.LinkedInUrl,
            InvestorId = investor.Id,
        };

        db.Leads.Add(lead);
        await db.SaveChangesAsync(ct);

        return new SaveInvestorAsLeadResult(LeadDto.From(lead), Created: true);
    }
}
