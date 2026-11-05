using System.Net;
using Amazon.SimpleEmailV2;
using Amazon.SimpleEmailV2.Model;

namespace Pitchdex.Api.Auth;

/// <summary>Sends the "reset your password" email.</summary>
public interface IPasswordResetSender
{
    Task SendAsync(string email, Uri resetLink, CancellationToken ct);
}

/// <summary>Writes the reset link to the API's log instead of emailing it. Only used locally: the link is a secret.</summary>
public sealed class LoggedPasswordResetSender(ILogger<LoggedPasswordResetSender> logger) : IPasswordResetSender
{
    public Task SendAsync(string email, Uri resetLink, CancellationToken ct)
    {
        logger.LogInformation("Password reset link for {Email}: {Link}", email, resetLink);
        return Task.CompletedTask;
    }
}

/// <summary>Emails the reset link through Amazon SES.</summary>
public sealed class SesPasswordResetSender(IAmazonSimpleEmailServiceV2 ses, string from, ILogger<SesPasswordResetSender> logger)
    : IPasswordResetSender
{
    public async Task SendAsync(string email, Uri resetLink, CancellationToken ct)
    {
        var link = resetLink.AbsoluteUri;
        var htmlLink = WebUtility.HtmlEncode(link);

        try
        {
            await ses.SendEmailAsync(
                new SendEmailRequest
                {
                    FromEmailAddress = from,
                    Destination = new Destination { ToAddresses = [email] },
                    Content = new EmailContent
                    {
                        Simple = new Message
                        {
                            Subject = new Content { Data = "Reset your Pitchdex password" },
                            Body = new Body
                            {
                                Text = new Content
                                {
                                    Data = $"Use this link to choose a new password:\n\n{link}\n\nIf you didn't ask for this, you can ignore this email.",
                                },
                                Html = new Content
                                {
                                    Data = $"<p>Use this link to choose a new password:</p><p><a href=\"{htmlLink}\">Reset your password</a></p><p>If you didn't ask for this, you can ignore this email.</p>",
                                },
                            },
                        },
                    },
                },
                ct);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            // An error here would tell whoever asked that this email has an account, so the
            // request still answers the same. The log never includes the link: it's a secret.
            logger.LogError(exception, "Couldn't send the password reset email");
        }
    }
}
