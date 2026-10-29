using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Pitchdex.Application.Common;
using Pitchdex.Application.Integrations;

namespace Pitchdex.Api.Errors;

/// <summary>
/// Turns the app's own exceptions into ProblemDetails responses with a message the
/// founder can read. Anything else falls through to the default 500 handler.
/// </summary>
public sealed class AppExceptionHandler(IProblemDetailsService problemDetails) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var (status, title) = exception switch
        {
            NotFoundException => (StatusCodes.Status404NotFound, "Not found"),
            UseCaseException => (StatusCodes.Status409Conflict, "Can't do that right now"),
            ProviderException => (StatusCodes.Status502BadGateway, "The messaging provider had a problem"),
            _ => (0, ""),
        };

        if (status == 0)
        {
            return false;
        }

        httpContext.Response.StatusCode = status;
        return await problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            Exception = exception,
            ProblemDetails = new ProblemDetails { Status = status, Title = title, Detail = exception.Message },
        });
    }
}
