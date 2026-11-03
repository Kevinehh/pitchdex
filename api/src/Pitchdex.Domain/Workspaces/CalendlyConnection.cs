namespace Pitchdex.Domain.Workspaces;

/// <summary>
/// The founder's Calendly account, connected with a personal access token so Pitchdex can
/// see which leads booked a call. Works on every Calendly plan, free included.
/// </summary>
public sealed class CalendlyConnection
{
    /// <summary>Calendly's address for the founder, which their scheduled events are listed by.</summary>
    public required string UserUri { get; set; }

    /// <summary>The Calendly account's name and email, shown in Settings.</summary>
    public required string Name { get; set; }

    public required string Email { get; set; }

    /// <summary>The personal access token, encrypted. Never sent back to the browser.</summary>
    public required string ProtectedToken { get; set; }

    public DateTimeOffset ConnectedAt { get; set; }

    /// <summary>When bookings were last checked. Empty until the first check.</summary>
    public DateTimeOffset? SyncedAt { get; set; }

    /// <summary>Why the last check failed, such as a revoked token. Cleared when one works.</summary>
    public string? LastError { get; set; }
}
