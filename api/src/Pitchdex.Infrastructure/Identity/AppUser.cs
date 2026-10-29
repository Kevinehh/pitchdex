using Microsoft.AspNetCore.Identity;

namespace Pitchdex.Infrastructure.Identity;

/// <summary>
/// Someone who signs in to Pitchdex. ASP.NET Core Identity keeps the hashed password,
/// lockout state and security stamp; the name is ours. Which workspace they use is in
/// WorkspaceMembers.
/// </summary>
public sealed class AppUser : IdentityUser<Guid>
{
    public AppUser()
    {
        Id = Guid.CreateVersion7();
    }

    public string FirstName { get; set; } = "";

    public string LastName { get; set; } = "";

    public DateTimeOffset CreatedAt { get; set; }
}
