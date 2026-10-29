using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.WebUtilities;
using Pitchdex.Application.Workspaces;
using Pitchdex.Infrastructure.Identity;
using Pitchdex.Infrastructure.Messaging;
using Pitchdex.Infrastructure.Persistence;

namespace Pitchdex.Api.Auth;

/// <summary>
/// Signing up, in and out, and managing the signed-in founder's login. Sessions are cookies
/// set by these endpoints; the web app never sees or stores a token.
/// </summary>
[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public sealed class AuthController(UserManager<AppUser> users, SignInManager<AppUser> signIn) : ControllerBase
{
    /// <summary>One message for a wrong email or password, so it doesn't reveal which accounts exist.</summary>
    private const string WrongCredentials = "That email and password don't match an account.";

    /// <summary>Creates the account and its workspace, then signs in.</summary>
    [HttpPost("sign-up")]
    [AllowAnonymous]
    [EnableRateLimiting(AuthSetup.RateLimitPolicy)]
    [ProducesResponseType<SessionDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<SessionDto>> SignUp(
        SignUpCommand command,
        [FromServices] AppDbContext db,
        [FromServices] SetUpWorkspaceHandler setUpWorkspace,
        CancellationToken ct)
    {
        var user = new AppUser
        {
            UserName = command.Email.Trim(),
            Email = command.Email.Trim(),
            FirstName = command.FirstName.Trim(),
            LastName = command.LastName.Trim(),
        };

        // The account and its workspace are made together, or not at all.
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        var created = await users.CreateAsync(user, command.Password);
        if (!created.Succeeded)
        {
            return IdentityProblem(created, passwordField: "password");
        }

        var workspace = await setUpWorkspace.Handle(user.Id, user.FirstName, ct);
        await transaction.CommitAsync(ct);

        await signIn.SignInAsync(user, isPersistent: true);
        return new SessionDto(ToDto(user), workspace);
    }

    [HttpPost("sign-in")]
    [AllowAnonymous]
    [EnableRateLimiting(AuthSetup.RateLimitPolicy)]
    [ProducesResponseType<SessionDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<SessionDto>> SignIn(
        SignInCommand command,
        [FromServices] FindUserWorkspaceHandler findWorkspace,
        CancellationToken ct)
    {
        var user = await users.FindByEmailAsync(command.Email.Trim());
        if (user is null)
        {
            return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Couldn't sign in", detail: WrongCredentials);
        }

        var result = await signIn.PasswordSignInAsync(user, command.Password, command.RememberMe, lockoutOnFailure: true);
        if (result.IsLockedOut)
        {
            return Problem(
                statusCode: StatusCodes.Status429TooManyRequests,
                title: "Account locked",
                detail: "Too many wrong passwords. Wait 10 minutes and try again, or reset your password.");
        }

        if (!result.Succeeded)
        {
            return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Couldn't sign in", detail: WrongCredentials);
        }

        return await SessionAsync(user, findWorkspace, ct);
    }

    [HttpPost("sign-out")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> SignOutUser()
    {
        await signIn.SignOutAsync();
        return NoContent();
    }

    /// <summary>Who is signed in. 401 when nobody is, which the web app takes as "show sign-in".</summary>
    [HttpGet("session")]
    [ProducesResponseType<SessionDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<SessionDto>> Session([FromServices] FindUserWorkspaceHandler findWorkspace, CancellationToken ct)
    {
        var user = await users.GetUserAsync(User);
        return user is null ? Unauthorized() : await SessionAsync(user, findWorkspace, ct);
    }

    [HttpPut("profile")]
    [ProducesResponseType<SessionDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<SessionDto>> UpdateProfile(
        UpdateProfileCommand command,
        [FromServices] FindUserWorkspaceHandler findWorkspace,
        CancellationToken ct)
    {
        var user = await users.GetUserAsync(User);
        if (user is null)
        {
            return Unauthorized();
        }

        user.FirstName = command.FirstName.Trim();
        user.LastName = command.LastName.Trim();
        await users.UpdateAsync(user);
        return await SessionAsync(user, findWorkspace, ct);
    }

    /// <summary>Changing the password signs out the account's other sessions; this one stays signed in.</summary>
    [HttpPost("change-password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangePassword(ChangePasswordCommand command)
    {
        var user = await users.GetUserAsync(User);
        if (user is null)
        {
            return Unauthorized();
        }

        var result = await users.ChangePasswordAsync(user, command.CurrentPassword, command.NewPassword);
        if (!result.Succeeded)
        {
            return IdentityProblem(result, passwordField: "newPassword");
        }

        await signIn.RefreshSignInAsync(user);
        return NoContent();
    }

    /// <summary>
    /// Sends a reset link if the email has an account. Answers the same either way, so it
    /// can't be used to find out who has an account.
    /// </summary>
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [EnableRateLimiting(AuthSetup.RateLimitPolicy)]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    public async Task<IActionResult> ForgotPassword(
        ForgotPasswordCommand command,
        [FromServices] IPasswordResetSender sender,
        [FromServices] MessagingSettings settings,
        CancellationToken ct)
    {
        var user = await users.FindByEmailAsync(command.Email.Trim());
        if (user?.Email is not null)
        {
            var token = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(await users.GeneratePasswordResetTokenAsync(user)));
            var link = new Uri(
                $"{settings.FrontendUrl.TrimEnd('/')}/reset-password" +
                $"?email={Uri.EscapeDataString(user.Email)}&token={token}");
            await sender.SendAsync(user.Email, link, ct);
        }

        return Accepted();
    }

    /// <summary>Sets a new password from a reset link, then the founder signs in with it.</summary>
    [HttpPost("reset-password")]
    [AllowAnonymous]
    [EnableRateLimiting(AuthSetup.RateLimitPolicy)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword(ResetPasswordCommand command)
    {
        var user = await users.FindByEmailAsync(command.Email.Trim());
        string token;
        try
        {
            token = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(command.Token));
        }
        catch (FormatException)
        {
            token = "";
        }

        var result = user is null
            ? IdentityResult.Failed(users.ErrorDescriber.InvalidToken())
            : await users.ResetPasswordAsync(user, token, command.NewPassword);
        if (!result.Succeeded)
        {
            return IdentityProblem(result, passwordField: "newPassword");
        }

        // A successful reset also clears a lockout from too many wrong passwords.
        await users.SetLockoutEndDateAsync(user!, null);
        return NoContent();
    }

    private async Task<ActionResult<SessionDto>> SessionAsync(AppUser user, FindUserWorkspaceHandler findWorkspace, CancellationToken ct)
    {
        var workspace = await findWorkspace.Handle(user.Id, ct);
        return workspace is null
            ? Problem(statusCode: StatusCodes.Status403Forbidden, title: "No workspace", detail: "This account isn't part of a workspace.")
            : new SessionDto(ToDto(user), workspace);
    }

    private static UserDto ToDto(AppUser user) => new(user.Id, user.Email ?? "", user.FirstName, user.LastName);

    /// <summary>Identity's errors as field errors the forms can show next to the right input.</summary>
    private ActionResult IdentityProblem(IdentityResult result, string passwordField)
    {
        foreach (var error in result.Errors)
        {
            var (field, message) = error.Code switch
            {
                nameof(IdentityErrorDescriber.DuplicateEmail) or nameof(IdentityErrorDescriber.DuplicateUserName) =>
                    ("email", "An account with this email already exists. Sign in instead."),
                nameof(IdentityErrorDescriber.InvalidEmail) or nameof(IdentityErrorDescriber.InvalidUserName) =>
                    ("email", "Enter a valid email address."),
                nameof(IdentityErrorDescriber.PasswordMismatch) =>
                    ("currentPassword", "That's not your current password."),
                nameof(IdentityErrorDescriber.InvalidToken) =>
                    ("token", "This reset link has expired or was already used. Ask for a new one."),
                _ when error.Code.StartsWith("Password", StringComparison.Ordinal) => (passwordField, error.Description),
                _ => ("", error.Description),
            };

            if (!ModelState.ContainsKey(field))
            {
                ModelState.AddModelError(field, message);
            }
        }

        return ValidationProblem(ModelState);
    }
}
