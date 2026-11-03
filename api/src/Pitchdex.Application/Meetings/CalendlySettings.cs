using FluentValidation;
using Pitchdex.Application.Common;
using Pitchdex.Application.Integrations;
using Pitchdex.Application.Workspaces;
using Pitchdex.Domain.Workspaces;

namespace Pitchdex.Application.Meetings;

/// <param name="Link">The booking page that fills {{calendly}}. Empty until the founder adds one.</param>
/// <param name="Account">The connected Calendly account bookings are read from. Empty when not connected.</param>
public sealed record CalendlySettingsDto(string? Link, CalendlyAccountDto? Account)
{
    public static CalendlySettingsDto From(Workspace workspace) =>
        new(
            workspace.CalendlyUrl,
            workspace.Calendly is { } calendly
                ? new CalendlyAccountDto(calendly.Name, calendly.Email, calendly.ConnectedAt, calendly.SyncedAt, calendly.LastError)
                : null);
}

/// <param name="LastError">Why the last check for bookings failed. Empty when it worked.</param>
public sealed record CalendlyAccountDto(
    string Name,
    string Email,
    DateTimeOffset ConnectedAt,
    DateTimeOffset? SyncedAt,
    string? LastError);

public sealed record UpdateCalendlyLinkCommand(string? Link);

public sealed class UpdateCalendlyLinkValidator : AbstractValidator<UpdateCalendlyLinkCommand>
{
    public UpdateCalendlyLinkValidator()
    {
        RuleFor(c => c.Link)
            .MaximumLength(500)
            .Must(BeACalendlyLink!)
            .WithMessage("Paste your Calendly link, such as https://calendly.com/your-name/30min.")
            .When(c => !string.IsNullOrWhiteSpace(c.Link));
    }

    private static bool BeACalendlyLink(string link) =>
        Uri.TryCreate(link.Trim(), UriKind.Absolute, out var uri) &&
        uri.Scheme == Uri.UriSchemeHttps &&
        (uri.Host.Equals("calendly.com", StringComparison.OrdinalIgnoreCase) ||
            uri.Host.EndsWith(".calendly.com", StringComparison.OrdinalIgnoreCase));
}

public sealed record ConnectCalendlyCommand(string AccessToken);

public sealed class ConnectCalendlyValidator : AbstractValidator<ConnectCalendlyCommand>
{
    public ConnectCalendlyValidator()
    {
        RuleFor(c => c.AccessToken)
            .NotEmpty().WithMessage("Paste a Calendly personal access token.")
            .MaximumLength(4000);
    }
}

public sealed class GetCalendlySettingsHandler(IAppDbContext db, WorkspaceContext workspace)
{
    public async Task<CalendlySettingsDto> Handle(CancellationToken ct) =>
        CalendlySettingsDto.From(await CurrentWorkspace.LoadAsync(db, workspace, ct));
}

/// <summary>Sets or clears the booking link. Clearing it stops campaigns using {{calendly}} from sending.</summary>
public sealed class UpdateCalendlyLinkHandler(IAppDbContext db, WorkspaceContext workspace)
{
    public async Task<CalendlySettingsDto> Handle(UpdateCalendlyLinkCommand command, CancellationToken ct)
    {
        var current = await CurrentWorkspace.LoadAsync(db, workspace, ct);
        current.CalendlyUrl = string.IsNullOrWhiteSpace(command.Link) ? null : command.Link.Trim();

        await db.SaveChangesAsync(ct);
        return CalendlySettingsDto.From(current);
    }
}

/// <summary>
/// Connects the founder's Calendly with a personal access token, checks it works, then looks
/// for bookings right away so leads who already booked show up at once. Their booking page
/// becomes the link too, unless they set one already.
/// </summary>
public sealed class ConnectCalendlyHandler(
    IAppDbContext db,
    WorkspaceContext workspace,
    ICalendlyClient calendly,
    ISecretProtector secrets,
    SyncCalendlyMeetingsHandler sync,
    TimeProvider clock)
{
    public async Task<CalendlySettingsDto> Handle(ConnectCalendlyCommand command, CancellationToken ct)
    {
        var token = command.AccessToken.Trim();
        var user = await calendly.GetCurrentUserAsync(token, ct);

        var current = await CurrentWorkspace.LoadAsync(db, workspace, ct);
        current.Calendly = new CalendlyConnection
        {
            UserUri = user.Uri,
            Name = user.Name,
            Email = user.Email,
            ProtectedToken = secrets.Protect(token),
            ConnectedAt = clock.GetUtcNow(),
        };
        current.CalendlyUrl ??= user.SchedulingUrl;
        await db.SaveChangesAsync(ct);

        await sync.Handle(force: true, ct);
        return CalendlySettingsDto.From(current);
    }
}

/// <summary>Stops reading bookings. Meetings already found, and the link, stay.</summary>
public sealed class DisconnectCalendlyHandler(IAppDbContext db, WorkspaceContext workspace)
{
    public async Task<CalendlySettingsDto> Handle(CancellationToken ct)
    {
        var current = await CurrentWorkspace.LoadAsync(db, workspace, ct);
        current.Calendly = null;

        await db.SaveChangesAsync(ct);
        return CalendlySettingsDto.From(current);
    }
}

/// <summary>What a check the founder asked for found, and the settings after it.</summary>
/// <param name="EventsFound">Calendly events from a day ago onward, whoever booked them.</param>
/// <param name="UnmatchedEmails">People who booked with an email that isn't any lead's. Their calls show on the Calendar, unlinked.</param>
public sealed record CalendlyCheckDto(
    CalendlySettingsDto Settings,
    int EventsFound,
    int Booked,
    int Canceled,
    IReadOnlyList<string> UnmatchedEmails);

/// <summary>
/// Checks Calendly now rather than at the next automatic check, and looks again at every
/// upcoming event, so a lead added after they booked is matched too.
/// </summary>
public sealed class CheckCalendlyHandler(IAppDbContext db, WorkspaceContext workspace, SyncCalendlyMeetingsHandler sync)
{
    public async Task<CalendlyCheckDto> Handle(CancellationToken ct)
    {
        var current = await CurrentWorkspace.LoadAsync(db, workspace, ct);
        if (current.Calendly is null)
        {
            throw new UseCaseException("Connect Calendly first.");
        }

        var result = await sync.Handle(force: true, ct);
        return new CalendlyCheckDto(
            CalendlySettingsDto.From(current),
            result.EventsFound,
            result.Booked,
            result.Canceled,
            result.UnmatchedEmails);
    }
}
