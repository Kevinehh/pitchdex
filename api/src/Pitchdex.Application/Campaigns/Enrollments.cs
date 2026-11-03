using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;
using Pitchdex.Domain.Campaigns;
using Pitchdex.Domain.Leads;

namespace Pitchdex.Application.Campaigns;

public sealed record EnrollLeadsCommand(Guid CampaignId, IReadOnlyList<Guid> LeadIds);

public sealed class EnrollLeadsValidator : AbstractValidator<EnrollLeadsCommand>
{
    public EnrollLeadsValidator()
    {
        RuleFor(c => c.LeadIds.Count).InclusiveBetween(1, 500).OverridePropertyName("leadIds")
            .WithMessage("Choose between 1 and 500 leads.");
    }
}

/// <param name="InConversation">Leads skipped because they already replied, have a meeting, or passed.</param>
/// <param name="MissingLinkedIn">Enrolled leads with no LinkedIn link. Their LinkedIn steps will fail.</param>
public sealed record EnrollResult(int Enrolled, int AlreadyEnrolled, int InConversation, int MissingLinkedIn);

/// <summary>
/// Adds leads to a campaign. Their first step is due right away, and goes out at the
/// next opening of the campaign's sending hours once it's running.
/// </summary>
public sealed class EnrollLeadsHandler(IAppDbContext db, TimeProvider clock)
{
    public async Task<EnrollResult> Handle(EnrollLeadsCommand command, CancellationToken ct)
    {
        var campaign = await CampaignQueries.LoadAsync(db, command.CampaignId, ct);
        var hasLinkedInSteps = campaign.Steps.Any(s => s.Type.UsesLinkedIn());
        var firstStep = SequenceTree.First(campaign.Steps);

        var requested = command.LeadIds.Distinct().ToList();
        var leads = await db.Leads.Where(l => requested.Contains(l.Id)).ToListAsync(ct);
        var alreadyEnrolled = (await db.Enrollments
                .Where(e => e.CampaignId == campaign.Id && requested.Contains(e.LeadId))
                .Select(e => e.LeadId)
                .ToListAsync(ct))
            .ToHashSet();

        int enrolled = 0, inConversation = 0, missingLinkedIn = 0;
        foreach (var lead in leads.Where(l => !alreadyEnrolled.Contains(l.Id)))
        {
            if (lead.Status is LeadStatus.Replied or LeadStatus.Meeting or LeadStatus.Passed)
            {
                inConversation++;
                continue;
            }

            db.Enrollments.Add(new Enrollment
            {
                CampaignId = campaign.Id,
                LeadId = lead.Id,
                NextStepId = firstStep?.Id,
                NextRunAt = clock.GetUtcNow(),
            });
            enrolled++;

            if (hasLinkedInSteps && string.IsNullOrWhiteSpace(lead.LinkedInUrl))
            {
                missingLinkedIn++;
            }
        }

        await db.SaveChangesAsync(ct);
        return new EnrollResult(enrolled, alreadyEnrolled.Count, inConversation, missingLinkedIn);
    }
}

/// <param name="NextStepId">The step the lead is on next. Empty once they reached the end of a branch.</param>
public sealed record EnrollmentDto(
    Guid Id,
    Guid LeadId,
    string LeadName,
    string? LeadFirm,
    EnrollmentStatus Status,
    Guid? NextStepId,
    DateTimeOffset? NextRunAt,
    string? LastError,
    DateTimeOffset UpdatedAt);

public sealed record ListEnrollmentsQuery
{
    public int Page { get; init; } = 1;

    public int PageSize { get; init; } = 25;

    public EnrollmentStatus? Status { get; init; }
}

public sealed class ListEnrollmentsValidator : AbstractValidator<ListEnrollmentsQuery>
{
    public ListEnrollmentsValidator()
    {
        RuleFor(q => q.Page).GreaterThan(0);
        RuleFor(q => q.PageSize).InclusiveBetween(1, 100);
    }
}

/// <summary>The leads in one campaign and where each one is.</summary>
public sealed class ListEnrollmentsHandler(IAppDbContext db)
{
    public async Task<Paged<EnrollmentDto>> Handle(Guid campaignId, ListEnrollmentsQuery query, CancellationToken ct)
    {
        var enrollments = db.Enrollments.AsNoTracking().Where(e => e.CampaignId == campaignId);
        if (query.Status is { } status)
        {
            enrollments = enrollments.Where(e => e.Status == status);
        }

        var total = await enrollments.CountAsync(ct);
        var items = await enrollments
            .Join(db.Leads, e => e.LeadId, l => l.Id, (e, l) => new { e, l })
            .OrderByDescending(x => x.e.UpdatedAt)
            .ThenBy(x => x.e.Id)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(x => new EnrollmentDto(
                x.e.Id, x.l.Id, x.l.FullName, x.l.Firm, x.e.Status,
                x.e.NextStepId, x.e.NextRunAt, x.e.LastError, x.e.UpdatedAt))
            .ToListAsync(ct);

        return new Paged<EnrollmentDto>(items, total, query.Page, query.PageSize);
    }
}

/// <summary>Takes one lead out of a campaign. Nothing more is sent to them from it.</summary>
public sealed class StopEnrollmentHandler(IAppDbContext db)
{
    public async Task Handle(Guid campaignId, Guid enrollmentId, CancellationToken ct)
    {
        var enrollment = await db.Enrollments.FirstOrDefaultAsync(e => e.Id == enrollmentId && e.CampaignId == campaignId, ct)
            ?? throw new NotFoundException("That lead isn't in this campaign.");

        if (enrollment.Status == EnrollmentStatus.Active)
        {
            enrollment.Finish(EnrollmentStatus.Stopped, "Stopped by you.");
            await db.SaveChangesAsync(ct);
        }
    }
}
