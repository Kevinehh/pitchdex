namespace Pitchdex.Api.Auth;

/// <summary>Sends the "reset your password" email.</summary>
public interface IPasswordResetSender
{
    Task SendAsync(string email, Uri resetLink, CancellationToken ct);
}

/// <summary>
/// Writes the reset link to the API's log instead of emailing it. Fine locally; a real
/// email service (such as Amazon SES or Resend) replaces this before launch.
/// </summary>
public sealed class LoggedPasswordResetSender(ILogger<LoggedPasswordResetSender> logger, IHostEnvironment environment)
    : IPasswordResetSender
{
    public Task SendAsync(string email, Uri resetLink, CancellationToken ct)
    {
        if (environment.IsDevelopment())
        {
            logger.LogInformation("Password reset link for {Email}: {Link}", email, resetLink);
        }
        else
        {
            // The link is a secret; outside development it is never logged.
            logger.LogWarning("Password reset requested for {Email}, but no email service is set up to send it", email);
        }

        return Task.CompletedTask;
    }
}
