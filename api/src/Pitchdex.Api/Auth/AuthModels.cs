using FluentValidation;
using Pitchdex.Application.Workspaces;

namespace Pitchdex.Api.Auth;

/// <param name="SeenTips">The page banners and tour they've closed.</param>
public sealed record UserDto(Guid Id, string Email, string FirstName, string LastName, IReadOnlyList<string> SeenTips);

/// <summary>Who is signed in, and the workspace they're working in.</summary>
public sealed record SessionDto(UserDto User, WorkspaceDto Workspace);

public sealed record SignUpCommand(string FirstName, string LastName, string Email, string Password);

/// <param name="RememberMe">Keep the session for two weeks rather than until the browser closes.</param>
public sealed record SignInCommand(string Email, string Password, bool RememberMe = true);

public sealed record UpdateProfileCommand(string FirstName, string LastName);

public sealed record ChangePasswordCommand(string CurrentPassword, string NewPassword);

public sealed record ForgotPasswordCommand(string Email);

/// <param name="Token">From the reset link in the email.</param>
public sealed record ResetPasswordCommand(string Email, string Token, string NewPassword);

/// <summary>The same password rule Identity enforces, checked first so the form can say so.</summary>
internal static class PasswordRules
{
    public const int MinLength = 10;

    public static IRuleBuilderOptions<T, string> ValidPassword<T>(this IRuleBuilder<T, string> rule) =>
        rule.NotEmpty().WithMessage("Choose a password.")
            .MinimumLength(MinLength).WithMessage($"Use at least {MinLength} characters.")
            .MaximumLength(128);
}

public sealed class SignUpValidator : AbstractValidator<SignUpCommand>
{
    public SignUpValidator()
    {
        RuleFor(c => c.FirstName).NotEmpty().WithMessage("Enter your first name.").MaximumLength(100);
        RuleFor(c => c.LastName).NotEmpty().WithMessage("Enter your last name.").MaximumLength(100);
        RuleFor(c => c.Email).NotEmpty().EmailAddress().WithMessage("Enter a valid email address.").MaximumLength(256);
        RuleFor(c => c.Password).ValidPassword();
    }
}

public sealed class SignInValidator : AbstractValidator<SignInCommand>
{
    public SignInValidator()
    {
        RuleFor(c => c.Email).NotEmpty().WithMessage("Enter your email address.");
        RuleFor(c => c.Password).NotEmpty().WithMessage("Enter your password.");
    }
}

public sealed class UpdateProfileValidator : AbstractValidator<UpdateProfileCommand>
{
    public UpdateProfileValidator()
    {
        RuleFor(c => c.FirstName).NotEmpty().WithMessage("Enter your first name.").MaximumLength(100);
        RuleFor(c => c.LastName).NotEmpty().WithMessage("Enter your last name.").MaximumLength(100);
    }
}

public sealed class ChangePasswordValidator : AbstractValidator<ChangePasswordCommand>
{
    public ChangePasswordValidator()
    {
        RuleFor(c => c.CurrentPassword).NotEmpty().WithMessage("Enter your current password.");
        RuleFor(c => c.NewPassword).ValidPassword();
    }
}

public sealed class ForgotPasswordValidator : AbstractValidator<ForgotPasswordCommand>
{
    public ForgotPasswordValidator() =>
        RuleFor(c => c.Email).NotEmpty().EmailAddress().WithMessage("Enter a valid email address.");
}

public sealed class ResetPasswordValidator : AbstractValidator<ResetPasswordCommand>
{
    public ResetPasswordValidator()
    {
        RuleFor(c => c.Email).NotEmpty().EmailAddress();
        RuleFor(c => c.Token).NotEmpty();
        RuleFor(c => c.NewPassword).ValidPassword();
    }
}
