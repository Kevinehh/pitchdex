using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Pitchdex.Api.Auth;
using Pitchdex.Api.Errors;
using Pitchdex.Api.Filters;
using Pitchdex.Api.Hosting;
using Pitchdex.Api.OpenApi;
using Pitchdex.Api.Workers;
using Pitchdex.Application;
using Pitchdex.Infrastructure;
using Pitchdex.Infrastructure.Messaging;
using Pitchdex.Infrastructure.Persistence;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("Connection string 'Default' is missing.");

// Sample data is only added locally. Its file paths are relative to this project's folder.
DevelopmentSeedOptions? sampleData = null;
if (builder.Environment.IsDevelopment())
{
    var investorsCsv = builder.Configuration["SampleData:InvestorsCsv"];
    sampleData = new DevelopmentSeedOptions(
        investorsCsv is null ? null : Path.GetFullPath(investorsCsv, builder.Environment.ContentRootPath));
}

// Email and LinkedIn go through Unipile when its key is set (keep it in user secrets),
// otherwise through practice mode, which is only allowed locally and on the test environment
// (Staging), so testing there can't reach real investors.
var messaging = builder.Configuration.GetSection(MessagingSettings.Section).Get<MessagingSettings>()
    ?? new MessagingSettings();
if (!messaging.UsesUnipile && !builder.Environment.IsDevelopment() && !builder.Environment.IsStaging())
{
    throw new InvalidOperationException("Messaging:UnipileBaseUrl and Messaging:UnipileApiKey must be set in Production.");
}

// Unipile reports new accounts to a webhook, which needs this API's public address and a secret.
if (messaging.UsesUnipile && (string.IsNullOrWhiteSpace(messaging.PublicApiUrl) || string.IsNullOrWhiteSpace(messaging.WebhookSecret)))
{
    throw new InvalidOperationException(
        "With Unipile, set Messaging:PublicApiUrl (this API's public address; locally an ngrok tunnel) " +
        "and Messaging:WebhookSecret, so connected accounts reach the right workspace.");
}

builder.Services.AddApplication();
builder.Services.AddInfrastructure(connectionString, sampleData, messaging);
builder.Services.AddPitchdexAuth(builder.Environment);
builder.Services.AddPasswordResetEmail(builder.Configuration, builder.Environment);
builder.Services.AddKeyStorage(builder.Configuration, builder.Environment);

var proxyHops = builder.Configuration.GetValue("Proxy:Hops", defaultValue: 0);
if (proxyHops > 0)
{
    builder.Services.AddProxySupport(proxyHops);
}

// Background sending and syncing. Only one instance should run them, so extra API instances
// (a second server, or a local test copy) set Workers:Enabled to false.
if (builder.Configuration.GetValue("Workers:Enabled", defaultValue: true))
{
    builder.Services.AddHostedService<MessagingSyncWorker>();
    builder.Services.AddHostedService<SequenceWorker>();
}

builder.Services.ConfigureHttpJsonOptions(options => ConfigureJson(options.SerializerOptions));
builder.Services
    .AddControllers(options => options.Filters.Add<ValidationFilter>())
    .AddJsonOptions(options => ConfigureJson(options.JsonSerializerOptions));

builder.Services.AddExceptionHandler<AppExceptionHandler>();
builder.Services.AddProblemDetails();
builder.Services.AddOpenApi(options => options.AddOperationTransformer<CamelCaseQueryParameters>());
builder.Services.AddHealthChecks().AddDbContextCheck<AppDbContext>();

var app = builder.Build();

if (await Commands.TryRunAsync(args, app))
{
    return;
}

app.Logger.LogInformation(
    messaging.UsesUnipile
        ? "Messaging: Unipile at {Url}"
        : "Messaging: practice mode (no Unipile key set). Accounts and replies are simulated.",
    messaging.UnipileBaseUrl);

// The visitor's real address comes first: the rate limiter below goes by it.
if (proxyHops > 0)
{
    app.UseForwardedHeaders();
}

// Any unhandled error becomes a standard ProblemDetails JSON response.
app.UseExceptionHandler();
app.UseStatusCodePages();

// Who is signed in, then which workspace they work in, then whether they may call the endpoint.
app.UseAuthentication();
app.UseMiddleware<WorkspaceMiddleware>();
app.UseAuthorization();
app.UseRateLimiter();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi().AllowAnonymous();
    app.MapScalarApiReference().AllowAnonymous();
    app.MapGet("/", () => Results.Redirect("/scalar")).ExcludeFromDescription().AllowAnonymous();

    // Local only: bring the database schema up to date and add sample data.
    await using var scope = app.Services.CreateAsyncScope();
    await scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.MigrateAsync();
}

app.MapControllers();
app.MapHealthChecks("/api/health").AllowAnonymous();

await app.RunAsync();

// One set of JSON rules for responses and for the OpenAPI document the frontend's
// types are generated from: enums as names ("New"), numbers only as numbers.
static void ConfigureJson(JsonSerializerOptions json)
{
    json.Converters.Add(new JsonStringEnumConverter());
    json.NumberHandling = JsonNumberHandling.Strict;
}
