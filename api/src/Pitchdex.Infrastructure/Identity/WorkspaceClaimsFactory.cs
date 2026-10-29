using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Pitchdex.Infrastructure.Persistence;

namespace Pitchdex.Infrastructure.Identity;

/// <summary>
/// What goes into the sign-in cookie: Identity's usual claims, plus the workspace the user
/// works in, so each request knows which workspace's data to show without looking it up.
/// </summary>
public sealed class WorkspaceClaimsFactory(
    UserManager<AppUser> users,
    IOptions<IdentityOptions> options,
    AppDbContext db)
    : UserClaimsPrincipalFactory<AppUser>(users, options)
{
    public const string WorkspaceClaim = "workspace_id";

    protected override async Task<ClaimsIdentity> GenerateClaimsAsync(AppUser user)
    {
        var identity = await base.GenerateClaimsAsync(user);

        var workspaceId = await db.WorkspaceMembers
            .Where(m => m.UserId == user.Id)
            .OrderBy(m => m.CreatedAt)
            .Select(m => (Guid?)m.WorkspaceId)
            .FirstOrDefaultAsync();

        if (workspaceId is { } id)
        {
            identity.AddClaim(new Claim(WorkspaceClaim, id.ToString()));
        }

        return identity;
    }
}
