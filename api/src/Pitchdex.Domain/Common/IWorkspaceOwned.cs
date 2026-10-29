namespace Pitchdex.Domain.Common;

/// <summary>
/// Data that belongs to one workspace. Every query for it is limited to the signed-in
/// workspace, and new rows are stamped with it when saved, so workspaces never see each
/// other's data.
/// </summary>
public interface IWorkspaceOwned
{
    Guid WorkspaceId { get; set; }
}
