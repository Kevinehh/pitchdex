using Pitchdex.Application.Common;
using Pitchdex.Infrastructure.Identity;

namespace Pitchdex.Api.Auth;

/// <summary>
/// Tells the rest of the request which workspace the signed-in founder works in, from the
/// claim in their session cookie. Data queries are filtered by it from here on.
/// </summary>
public sealed class WorkspaceMiddleware(WorkspaceContext workspace) : IMiddleware
{
    public Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        if (Guid.TryParse(context.User.FindFirst(WorkspaceClaimsFactory.WorkspaceClaim)?.Value, out var id))
        {
            workspace.Id = id;
        }

        return next(context);
    }
}
