using FluentValidation;
using Pitchdex.Application.Common;
using Pitchdex.Domain.Workspaces;

namespace Pitchdex.Application.Workspaces;

/// <summary>
/// The onboarding survey's answers. Every one is optional: skipping the survey sends none,
/// and still marks it done so it doesn't come back.
/// </summary>
/// <param name="CompanyName">Becomes the workspace's name.</param>
/// <param name="Stage">One of the investors' stages, such as Seed.</param>
/// <param name="Industries">Up to three of the investors' industries.</param>
/// <param name="Geographies">Where the founder wants investors from, in the investors' geographies.</param>
public sealed record CompleteOnboardingCommand(
    string? CompanyName = null,
    string? Stage = null,
    RaiseSize? RaiseSize = null,
    IReadOnlyList<string>? Industries = null,
    IReadOnlyList<string>? Geographies = null,
    HeardFrom? HeardFrom = null);

public sealed class CompleteOnboardingValidator : AbstractValidator<CompleteOnboardingCommand>
{
    public const int MaxIndustries = 3;

    public CompleteOnboardingValidator()
    {
        RuleFor(c => c.CompanyName).MaximumLength(200);
        RuleFor(c => c.Stage).MaximumLength(50);
        RuleFor(c => c.RaiseSize).IsInEnum();
        RuleFor(c => c.HeardFrom).IsInEnum();
        RuleFor(c => c.Industries!.Count)
            .LessThanOrEqualTo(MaxIndustries)
            .WithMessage($"Pick up to {MaxIndustries} industries.")
            .OverridePropertyName("industries")
            .When(c => c.Industries is not null);
        RuleForEach(c => c.Industries).NotEmpty().MaximumLength(100);
        RuleFor(c => c.Geographies!.Count)
            .LessThanOrEqualTo(20)
            .OverridePropertyName("geographies")
            .When(c => c.Geographies is not null);
        RuleForEach(c => c.Geographies).NotEmpty().MaximumLength(100);
    }
}

public sealed class CompleteOnboardingHandler(IAppDbContext db, WorkspaceContext workspace)
{
    public async Task<WorkspaceDto> Handle(CompleteOnboardingCommand command, CancellationToken ct)
    {
        var current = await CurrentWorkspace.LoadAsync(db, workspace, ct);

        if (!string.IsNullOrWhiteSpace(command.CompanyName))
        {
            current.Name = command.CompanyName.Trim();
        }

        current.RaiseStage = string.IsNullOrWhiteSpace(command.Stage) ? null : command.Stage.Trim();
        current.RaiseSize = command.RaiseSize;
        current.Industries = Clean(command.Industries);
        current.InvestorGeographies = Clean(command.Geographies);
        current.HeardFrom = command.HeardFrom;
        current.OnboardedAt ??= DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(ct);
        return WorkspaceDto.From(current);
    }

    private static List<string> Clean(IReadOnlyList<string>? values) =>
        values?.Select(v => v.Trim()).Distinct(StringComparer.Ordinal).ToList() ?? [];
}
