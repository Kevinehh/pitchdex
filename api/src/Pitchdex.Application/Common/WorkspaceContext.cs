namespace Pitchdex.Application.Common;

/// <summary>
/// The workspace this request or background job works in. Set once per scope: from the
/// signed-in user's session for web requests, and by the workers for each workspace they
/// process. Every workspace-owned query is filtered by it; with none set, they find nothing.
/// </summary>
public sealed class WorkspaceContext
{
    public Guid? Id { get; set; }

    /// <summary>The workspace, for code that can only run inside one.</summary>
    public Guid RequiredId => Id ?? throw new InvalidOperationException("No workspace is set for this request.");
}
