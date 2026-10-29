namespace Pitchdex.Application.Common;

/// <summary>
/// One page of results, plus the total so the frontend can draw page controls.
/// </summary>
public sealed record Paged<T>(IReadOnlyList<T> Items, int Total, int Page, int PageSize);
