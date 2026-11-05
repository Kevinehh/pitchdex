using System.Threading.RateLimiting;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Pitchdex.Infrastructure.Identity;
using Pitchdex.Infrastructure.Persistence;

namespace Pitchdex.Api.Auth;

/// <summary>
/// Sign-in for the web app: ASP.NET Core Identity with a session cookie. The cookie is
/// HttpOnly, so scripts can't read it, and SameSite=Lax, so other sites can't make the
/// browser send it with a POST. Every endpoint needs a signed-in user unless it says otherwise.
/// </summary>
public static class AuthSetup
{
    /// <summary>The rate limit on sign-in, sign-up and password resets, which attackers guess at.</summary>
    public const string RateLimitPolicy = "auth";

    public static IServiceCollection AddPitchdexAuth(this IServiceCollection services, IHostEnvironment environment)
    {
        services
            .AddIdentityCore<AppUser>(options =>
            {
                options.User.RequireUniqueEmail = true;

                // Length beats symbol rules (NIST 800-63B): at least 10 characters, any kind.
                options.Password.RequiredLength = 10;
                options.Password.RequireDigit = false;
                options.Password.RequireLowercase = false;
                options.Password.RequireUppercase = false;
                options.Password.RequireNonAlphanumeric = false;

                // Five wrong passwords lock the account for ten minutes.
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(10);
            })
            .AddEntityFrameworkStores<AppDbContext>()
            .AddSignInManager()
            .AddDefaultTokenProviders()
            .AddClaimsPrincipalFactory<WorkspaceClaimsFactory>();

        services.AddAuthentication(IdentityConstants.ApplicationScheme).AddIdentityCookies();
        services.ConfigureApplicationCookie(cookie =>
        {
            cookie.Cookie.Name = "pitchdex.session";
            cookie.Cookie.HttpOnly = true;
            cookie.Cookie.SameSite = SameSiteMode.Lax;
            cookie.Cookie.SecurePolicy = environment.IsDevelopment()
                ? CookieSecurePolicy.SameAsRequest
                : CookieSecurePolicy.Always;
            cookie.ExpireTimeSpan = TimeSpan.FromDays(14);
            cookie.SlidingExpiration = true;

            // An API answers 401/403; the web app decides where to send the founder.
            cookie.Events.OnRedirectToLogin = context =>
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return Task.CompletedTask;
            };
            cookie.Events.OnRedirectToAccessDenied = context =>
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                return Task.CompletedTask;
            };
        });

        services.AddAuthorizationBuilder()
            .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());

        services.AddRateLimiter(options =>
        {
            options.AddPolicy(RateLimitPolicy, context => RateLimitPartition.GetFixedWindowLimiter(
                context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1) }));
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = (context, ct) => new ValueTask(context.HttpContext.Response.WriteAsJsonAsync(
                new ProblemDetails
                {
                    Status = StatusCodes.Status429TooManyRequests,
                    Title = "Too many tries",
                    Detail = "Too many tries from here. Wait a minute and try again.",
                },
                ct));
        });

        services.AddScoped<WorkspaceMiddleware>();
        services.AddValidatorsFromAssemblyContaining<SignUpValidator>();

        return services;
    }
}
