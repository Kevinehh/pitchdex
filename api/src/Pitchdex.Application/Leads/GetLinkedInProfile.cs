using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;
using Pitchdex.Application.Integrations;

namespace Pitchdex.Application.Leads;

/// <summary>A lead's whole LinkedIn profile, for the lead's side panel.</summary>
public sealed record LinkedInProfileDto(
    LeadLinkedInDto Summary,
    string? About,
    int? Followers,
    int? Connections,
    int? SharedConnections,
    IReadOnlyList<LinkedInRole> Experience,
    IReadOnlyList<LinkedInSchool> Education);

/// <summary>
/// Looks a lead's profile up on LinkedIn, with their work history and education. Not stored:
/// it's only wanted while a founder is looking. The saved picture and headline are refreshed
/// on the way, since the lookup has them anyway.
/// </summary>
public sealed class GetLinkedInProfileHandler(IAppDbContext db, ILinkedInChannel linkedIn, TimeProvider clock)
{
    public async Task<LinkedInProfileDto> Handle(Guid leadId, CancellationToken ct)
    {
        var lead = await db.Leads.FirstOrDefaultAsync(l => l.Id == leadId, ct)
            ?? throw new NotFoundException("That lead doesn't exist.");

        var identifier = LinkedInProfiles.Identifier(lead)
            ?? throw new UseCaseException($"Add a LinkedIn profile link to {lead.FullName} first.");

        var account = await LinkedInProfiles.LookupAccountAsync(db, ct)
            ?? throw new UseCaseException("Connect a LinkedIn account to see LinkedIn profiles.");

        var person = await linkedIn.GetProfileAsync(account.ExternalId, identifier, withBackground: true, ct);
        LinkedInProfiles.Apply(lead, person, clock.GetUtcNow());
        await db.SaveChangesAsync(ct);

        var background = person.Background;
        return new LinkedInProfileDto(
            new LeadLinkedInDto(person.PictureUrl, person.Headline, person.Location, person.Degree, person.IsOpenProfile, person.IsPremium),
            background?.About,
            background?.Followers,
            background?.Connections,
            background?.SharedConnections,
            background?.Experience ?? [],
            background?.Education ?? []);
    }
}
