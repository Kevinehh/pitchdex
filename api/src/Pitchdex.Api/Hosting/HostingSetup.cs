using Amazon.SimpleEmailV2;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Pitchdex.Api.Auth;

namespace Pitchdex.Api.Hosting;

/// <summary>What the app needs when it runs on AWS rather than on a developer's machine.</summary>
public static class HostingSetup
{
    /// <summary>
    /// Keeps the keys that protect sign-in cookies and saved tokens in AWS Parameter Store,
    /// encrypted, so they outlive a deploy and every container shares them. Locally the
    /// default (a folder in the user's profile) stays, so existing sessions keep working.
    /// </summary>
    public static IServiceCollection AddKeyStorage(this IServiceCollection services, IConfiguration configuration, IHostEnvironment environment)
    {
        if (environment.IsDevelopment())
        {
            return services;
        }

        var path = configuration["DataProtection:ParameterPath"];
        if (string.IsNullOrWhiteSpace(path))
        {
            throw new InvalidOperationException("DataProtection:ParameterPath must be set outside Development.");
        }

        services.AddDataProtection()
            .SetApplicationName("Pitchdex")
            .PersistKeysToAWSSystemsManager(path);
        return services;
    }

    /// <summary>
    /// Sends password reset emails through Amazon SES. It's required outside Development,
    /// where the reset link can't go to the log instead.
    /// </summary>
    public static IServiceCollection AddPasswordResetEmail(this IServiceCollection services, IConfiguration configuration, IHostEnvironment environment)
    {
        var from = configuration["Email:FromAddress"];
        if (!string.IsNullOrWhiteSpace(from))
        {
            services.AddSingleton<IAmazonSimpleEmailServiceV2>(_ => new AmazonSimpleEmailServiceV2Client());
            services.AddSingleton<IPasswordResetSender>(sp => new SesPasswordResetSender(
                sp.GetRequiredService<IAmazonSimpleEmailServiceV2>(),
                from,
                sp.GetRequiredService<ILogger<SesPasswordResetSender>>()));
            return services;
        }

        if (!environment.IsDevelopment())
        {
            throw new InvalidOperationException("Email:FromAddress must be set outside Development.");
        }

        services.AddSingleton<IPasswordResetSender, LoggedPasswordResetSender>();
        return services;
    }

    /// <summary>
    /// Behind CloudFront and a load balancer, every request appears to come from the load
    /// balancer, so the sign-in rate limit would be shared by everyone. Proxy:Hops is how many
    /// of our own proxies add to X-Forwarded-For: counting that many from the right finds the
    /// visitor's real address, and anything a visitor adds themselves sits further left, so it
    /// can't be used to fake one. Only set it when the proxies are the only way in.
    /// </summary>
    public static IServiceCollection AddProxySupport(this IServiceCollection services, int hops)
    {
        services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor;
            options.ForwardLimit = hops;
            options.KnownIPNetworks.Clear();
            options.KnownProxies.Clear();
        });
        return services;
    }
}
