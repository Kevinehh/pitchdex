using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Pitchdex.Application.Common;
using Pitchdex.Application.Integrations;
using Pitchdex.Infrastructure.Messaging;
using Pitchdex.Infrastructure.Messaging.Practice;
using Pitchdex.Infrastructure.Messaging.Unipile;
using Pitchdex.Infrastructure.Persistence;

namespace Pitchdex.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        string connectionString,
        DevelopmentSeedOptions? sampleData,
        MessagingSettings messaging)
    {
        services.AddDbContext<AppDbContext>(options =>
        {
            options.UseNpgsql(connectionString).UseSnakeCaseNamingConvention();

            if (sampleData is not null)
            {
                options.UseAsyncSeeding((context, _, ct) => DevelopmentSeed.SeedAsync(context, sampleData, ct));
            }
        });

        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        AddMessaging(services, messaging);

        return services;
    }

    /// <summary>Unipile when a key is set, otherwise the in-memory practice provider.</summary>
    private static void AddMessaging(IServiceCollection services, MessagingSettings messaging)
    {
        services.AddSingleton(messaging);

        if (messaging.UsesUnipile)
        {
            services.AddHttpClient<UnipileClient>(http =>
            {
                http.BaseAddress = new Uri($"{messaging.UnipileBaseUrl!.TrimEnd('/')}/api/v1/");
                http.DefaultRequestHeaders.Add("X-API-KEY", messaging.UnipileApiKey);
                http.DefaultRequestHeaders.Add("Accept", "application/json");
                http.Timeout = TimeSpan.FromSeconds(30);
            });
            services.AddScoped<UnipileMessagingProvider>();
            Expose<UnipileMessagingProvider>(services, ServiceLifetime.Scoped);
        }
        else
        {
            // One shared instance, so pretend accounts and replies survive between requests.
            services.AddSingleton<PracticeMessagingProvider>();
            Expose<PracticeMessagingProvider>(services, ServiceLifetime.Singleton);
        }
    }

    /// <summary>Registers one provider class as every messaging interface.</summary>
    private static void Expose<TProvider>(IServiceCollection services, ServiceLifetime lifetime)
        where TProvider : class, IAccountProvider, IEmailChannel, ILinkedInChannel, IInboxProvider
    {
        services.Add(new ServiceDescriptor(typeof(IAccountProvider), sp => sp.GetRequiredService<TProvider>(), lifetime));
        services.Add(new ServiceDescriptor(typeof(IEmailChannel), sp => sp.GetRequiredService<TProvider>(), lifetime));
        services.Add(new ServiceDescriptor(typeof(ILinkedInChannel), sp => sp.GetRequiredService<TProvider>(), lifetime));
        services.Add(new ServiceDescriptor(typeof(IInboxProvider), sp => sp.GetRequiredService<TProvider>(), lifetime));
    }
}
