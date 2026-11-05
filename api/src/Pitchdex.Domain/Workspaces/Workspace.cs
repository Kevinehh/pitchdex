using Pitchdex.Domain.Common;

namespace Pitchdex.Domain.Workspaces;

/// <summary>
/// A founder's space in Pitchdex: their leads, campaigns, connected accounts and messages
/// all belong to one. Signing up creates it; teammates can join it later.
/// </summary>
public sealed class Workspace : IHasTimestamps
{
    /// <summary>
    /// Holds everything created before sign-in existed. The first person to sign up takes it
    /// over, so that data isn't lost; everyone after gets a new, empty workspace.
    /// </summary>
    public static readonly Guid FirstWorkspaceId = new("00000000-0000-0000-0000-000000000001");

    public Guid Id { get; init; } = Guid.CreateVersion7();

    public required string Name { get; set; }

    /// <summary>Where new campaigns' sending hours are counted. US East by default, where most investors are.</summary>
    public string TimeZoneId { get; set; } = "America/New_York";

    public int SendFromHour { get; set; } = 9;

    public int SendUntilHour { get; set; } = 17;

    public bool WeekdaysOnly { get; set; } = true;

    /// <summary>The founder's booking page. Fills {{calendly}} in campaign steps and can be added to replies.</summary>
    public string? CalendlyUrl { get; set; }

    /// <summary>The connected Calendly account that bookings are read from. Empty when not connected.</summary>
    public CalendlyConnection? Calendly { get; set; }

    /// <summary>The round being raised, from the onboarding survey: Pre-Seed, Seed… as investors list them.</summary>
    public string? RaiseStage { get; set; }

    public RaiseSize? RaiseSize { get; set; }

    /// <summary>What the company builds, in the investors' industry names. Up to three.</summary>
    public List<string> Industries { get; set; } = [];

    /// <summary>Where the founder wants investors from, in the investors' geography names.</summary>
    public List<string> InvestorGeographies { get; set; } = [];

    public HeardFrom? HeardFrom { get; set; }

    /// <summary>When the founder finished or skipped the survey. Empty until then, which sends them to it.</summary>
    public DateTimeOffset? OnboardedAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}

/// <summary>How much the founder is raising in this round.</summary>
public enum RaiseSize
{
    Under500K,
    From500KTo2M,
    From2MTo5M,
    From5MTo15M,
    Over15M,
}

/// <summary>How the founder found Pitchdex, for our own marketing.</summary>
public enum HeardFrom
{
    LinkedIn,
    Search,
    Friend,
    Community,
    Media,
    Other,
}

/// <summary>Someone who can use a workspace. <see cref="UserId"/> is their sign-in account.</summary>
public sealed class WorkspaceMember : IHasTimestamps
{
    public Guid WorkspaceId { get; set; }

    public Guid UserId { get; set; }

    public WorkspaceRole Role { get; set; } = WorkspaceRole.Owner;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}

public enum WorkspaceRole
{
    Owner,
    Member,
}
