using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Pitchdex.Application.Common;
using Pitchdex.Application.Messaging;

namespace Pitchdex.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = typeof(DependencyInjection).Assembly;

        services.AddValidatorsFromAssembly(assembly);

        // Use cases read the time from here instead of DateTimeOffset.UtcNow, so tests can set it.
        services.AddSingleton(TimeProvider.System);

        services.AddScoped<LeadMessenger>();
        services.AddScoped<WorkspaceContext>();

        // Every use-case handler is registered by naming convention, so a new
        // feature only needs its file, not a line here.
        var handlers = assembly.GetTypes().Where(t =>
            t is { IsClass: true, IsAbstract: false } &&
            t.Name.EndsWith("Handler", StringComparison.Ordinal));

        foreach (var handler in handlers)
        {
            services.AddScoped(handler);
        }

        return services;
    }
}
