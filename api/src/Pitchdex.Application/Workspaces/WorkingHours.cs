using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;
using Pitchdex.Domain.Workspaces;

namespace Pitchdex.Application.Workspaces;

/// <summary>The sending window new campaigns start with. Each campaign can change its own.</summary>
public sealed record WorkingHoursDto(string TimeZoneId, int SendFromHour, int SendUntilHour, bool WeekdaysOnly)
{
    public static WorkingHoursDto From(Workspace workspace) =>
        new(workspace.TimeZoneId, workspace.SendFromHour, workspace.SendUntilHour, workspace.WeekdaysOnly);
}

public sealed record UpdateWorkingHoursCommand(string TimeZoneId, int SendFromHour, int SendUntilHour, bool WeekdaysOnly);

public sealed class UpdateWorkingHoursValidator : AbstractValidator<UpdateWorkingHoursCommand>
{
    public UpdateWorkingHoursValidator()
    {
        RuleFor(c => c.TimeZoneId)
            .Must(id => TimeZoneInfo.TryFindSystemTimeZoneById(id, out _))
            .WithMessage("Choose a valid time zone.");
        RuleFor(c => c.SendFromHour).InclusiveBetween(0, 23);
        RuleFor(c => c.SendUntilHour)
            .InclusiveBetween(1, 24)
            .GreaterThan(c => c.SendFromHour)
            .WithMessage("Sending must end after it starts.");
    }
}

public sealed class GetWorkingHoursHandler(IAppDbContext db, WorkspaceContext workspace)
{
    public async Task<WorkingHoursDto> Handle(CancellationToken ct) =>
        WorkingHoursDto.From(await CurrentWorkspace.LoadAsync(db, workspace, ct));
}

public sealed class UpdateWorkingHoursHandler(IAppDbContext db, WorkspaceContext workspace)
{
    public async Task<WorkingHoursDto> Handle(UpdateWorkingHoursCommand command, CancellationToken ct)
    {
        var current = await CurrentWorkspace.LoadAsync(db, workspace, ct);
        current.TimeZoneId = command.TimeZoneId;
        current.SendFromHour = command.SendFromHour;
        current.SendUntilHour = command.SendUntilHour;
        current.WeekdaysOnly = command.WeekdaysOnly;

        await db.SaveChangesAsync(ct);
        return WorkingHoursDto.From(current);
    }
}

internal static class CurrentWorkspace
{
    /// <summary>The signed-in workspace, tracked so changes to it can be saved.</summary>
    public static async Task<Workspace> LoadAsync(IAppDbContext db, WorkspaceContext workspace, CancellationToken ct) =>
        await db.Workspaces.FirstOrDefaultAsync(w => w.Id == workspace.RequiredId, ct)
            ?? throw new NotFoundException("That workspace doesn't exist.");
}
