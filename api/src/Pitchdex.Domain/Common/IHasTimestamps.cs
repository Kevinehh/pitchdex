namespace Pitchdex.Domain.Common;

/// <summary>
/// Entities with these fields get them filled in automatically when they are saved.
/// </summary>
public interface IHasTimestamps
{
    DateTimeOffset CreatedAt { get; set; }

    DateTimeOffset UpdatedAt { get; set; }
}
