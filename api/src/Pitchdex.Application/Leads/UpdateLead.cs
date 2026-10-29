using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;
using Pitchdex.Domain.Campaigns;
using Pitchdex.Domain.Leads;

namespace Pitchdex.Application.Leads;

/// <summary>Changes only the fields that are set.</summary>
public sealed record UpdateLeadCommand(LeadStatus? Status = null, bool? IsStarred = null);

/// <summary>
/// Moves a lead along the pipeline (a meeting booked, a pass) or stars it. Marking a lead
/// Meeting or Passed stops any campaign still sending to it.
/// </summary>
public sealed class UpdateLeadHandler(IAppDbContext db)
{
    public async Task<LeadDto> Handle(Guid leadId, UpdateLeadCommand command, CancellationToken ct)
    {
        var lead = await db.Leads.FirstOrDefaultAsync(l => l.Id == leadId, ct)
            ?? throw new NotFoundException("That lead doesn't exist.");

        if (command.IsStarred is { } starred)
        {
            lead.IsStarred = starred;
        }

        if (command.Status is { } status && status != lead.Status)
        {
            lead.Status = status;
            if (status is LeadStatus.Meeting or LeadStatus.Passed)
            {
                var running = await db.Enrollments
                    .Where(e => e.LeadId == lead.Id && e.Status == EnrollmentStatus.Active)
                    .ToListAsync(ct);
                foreach (var enrollment in running)
                {
                    enrollment.Finish(
                        status == LeadStatus.Meeting ? EnrollmentStatus.Replied : EnrollmentStatus.Stopped,
                        status == LeadStatus.Meeting ? "Meeting booked." : "The lead passed.");
                }
            }
        }

        await db.SaveChangesAsync(ct);
        return LeadDto.From(lead);
    }
}
