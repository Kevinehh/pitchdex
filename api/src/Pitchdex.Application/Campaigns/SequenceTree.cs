using Pitchdex.Domain.Campaigns;

namespace Pitchdex.Application.Campaigns;

/// <summary>
/// One step as the editor saves it, and as templates describe one. Key is a saved step's id,
/// or any other text for a new step; ParentKey names the step it follows. Steps are listed
/// parents first.
/// </summary>
/// <param name="Branch">For a step after a condition: which answer leads here.</param>
/// <param name="WaitDays">"Accepted invitation?" only: days to wait for the acceptance.</param>
public sealed record StepInput(
    string Key,
    string? ParentKey,
    StepBranch? Branch,
    StepType Type,
    int DelayDays,
    int WaitDays,
    string? Subject,
    string Body);

/// <summary>How steps fit together into a sequence: shared by saving, templates and the sequence engine.</summary>
public static class SequenceTree
{
    public const int MaxSteps = 20;

    public const int MaxWaitDays = 30;

    /// <summary>
    /// The first thing wrong with how the steps fit together, in words the founder can act on,
    /// or null when they fit. Field problems (an empty message, say) are checked per step elsewhere.
    /// </summary>
    public static string? Problem(IReadOnlyList<StepInput> steps)
    {
        var earlier = new Dictionary<string, StepInput>();
        var taken = new HashSet<(string Parent, StepBranch? Branch)>();

        for (var index = 0; index < steps.Count; index++)
        {
            var step = steps[index];
            if (string.IsNullOrWhiteSpace(step.Key) || earlier.ContainsKey(step.Key))
            {
                return "Each step needs a key of its own.";
            }

            if (index == 0)
            {
                if (step.ParentKey is not null || step.Branch is not null)
                {
                    return "The first step can't follow another step.";
                }
            }
            else
            {
                if (step.ParentKey is null || !earlier.TryGetValue(step.ParentKey, out var parent))
                {
                    return "Every step after the first has to follow a step listed before it.";
                }

                var afterCondition = parent.Type.IsCondition();
                if (afterCondition && step.Branch is null)
                {
                    return "Steps after a condition go on its Yes or its No branch.";
                }

                if (!afterCondition && step.Branch is not null)
                {
                    return "Only steps after a condition go on a branch.";
                }

                if (!taken.Add((step.ParentKey, step.Branch)))
                {
                    return "Two steps can't follow the same step on the same branch.";
                }
            }

            if (step.Type == StepType.IfInvitationAccepted &&
                !Ancestors(step, earlier).Any(a => a.Type == StepType.LinkedInInvitation))
            {
                return "Put a connection request somewhere before \"Accepted invitation?\".";
            }

            earlier[step.Key] = step;
        }

        return null;
    }

    /// <summary>The steps before this one, nearest first.</summary>
    private static IEnumerable<StepInput> Ancestors(StepInput step, Dictionary<string, StepInput> earlier)
    {
        var parentKey = step.ParentKey;
        while (parentKey is not null && earlier.TryGetValue(parentKey, out var parent))
        {
            yield return parent;
            parentKey = parent.ParentKey;
        }
    }

    /// <summary>The step a lead starts on: the one with no parent.</summary>
    public static CampaignStep? First(IEnumerable<CampaignStep> steps) =>
        steps.Where(s => s.ParentStepId is null).OrderBy(s => s.Position).FirstOrDefault();

    /// <summary>
    /// The step after this one: on the given branch after a condition, the only child otherwise.
    /// Empty at the end of a branch.
    /// </summary>
    public static CampaignStep? Next(IEnumerable<CampaignStep> steps, CampaignStep step, StepBranch? branch) =>
        steps.FirstOrDefault(s => s.ParentStepId == step.Id && s.Branch == branch);

    /// <summary>
    /// Fills a step from its input. Fields a kind of step doesn't use are cleared, so switching
    /// a step from email to LinkedIn doesn't leave a hidden subject behind.
    /// </summary>
    public static void Apply(CampaignStep step, StepInput input, int position, Guid? parentId)
    {
        step.ParentStepId = parentId;
        step.Branch = parentId is null ? null : input.Branch;
        step.Position = position;
        step.Type = input.Type;
        step.DelayDays = position == 0 ? 0 : input.DelayDays;
        step.WaitDays = input.Type == StepType.IfInvitationAccepted ? input.WaitDays : 0;
        step.Subject = input.Type == StepType.Email ? input.Subject?.Trim() : null;
        step.Body = input.Type is StepType.Email or StepType.LinkedInInvitation or StepType.LinkedInMessage
            ? input.Body.Trim()
            : "";
    }

    /// <summary>New steps for a new campaign, from a template or the default first email.</summary>
    public static List<CampaignStep> Build(IReadOnlyList<StepInput> inputs)
    {
        var ids = new Dictionary<string, Guid>();
        var steps = new List<CampaignStep>();
        for (var position = 0; position < inputs.Count; position++)
        {
            var input = inputs[position];
            var step = new CampaignStep();
            Apply(step, input, position, input.ParentKey is null ? null : ids[input.ParentKey]);
            ids[input.Key] = step.Id;
            steps.Add(step);
        }

        return steps;
    }
}
