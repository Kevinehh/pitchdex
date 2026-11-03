using Pitchdex.Domain.Campaigns;

namespace Pitchdex.Application.Campaigns;

/// <summary>A ready-made sequence for reaching investors. A new campaign can start from one, then be edited freely.</summary>
public sealed record CampaignTemplate(string Id, string Name, string Description, IReadOnlyList<StepInput> Steps);

/// <summary>The template gallery. Every template here must pass SequenceTree.Problem.</summary>
public static class CampaignTemplates
{
    private const string Pitch =
        "Thanks for connecting, {{firstName}}! I'm raising our seed round and think {{firm}} could be a great fit. Would you be open to a short call?";

    private const string Bump =
        "Hi {{firstName}}, bumping this in case it got buried. Happy to send our deck first if that's easier.";

    private const string IntroEmail =
        "Hi {{firstName}},\n\nI'm raising our seed round and thought {{firm}} could be a great fit. Would you be open to a short call?\n\nThanks";

    private const string FollowUpEmail =
        "Hi {{firstName}},\n\nJust following up on my note below. Happy to send our deck if that's easier than a call.\n\nThanks";

    public static readonly IReadOnlyList<CampaignTemplate> All =
    [
        new(
            "linkedin-warm-up",
            "LinkedIn warm-up",
            "View their profile, connect, then message once they accept.",
            [
                Step("view", null, null, StepType.LinkedInProfileView, 0),
                Step("invite", "view", null, StepType.LinkedInInvitation, 1, body: "Hi {{firstName}}, I'm a founder raising our seed round and would love to connect."),
                Step("accepted", "invite", null, StepType.IfInvitationAccepted, 0, waitDays: 7),
                Step("pitch", "accepted", StepBranch.Yes, StepType.LinkedInMessage, 1, body: Pitch),
                Step("bump", "pitch", null, StepType.LinkedInMessage, 4, body: Bump),
            ]),
        new(
            "linkedin-then-email",
            "LinkedIn, then email",
            "Connect on LinkedIn, and switch to email if they don't accept within a week.",
            [
                Step("invite", null, null, StepType.LinkedInInvitation, 0, body: "Hi {{firstName}}, I'm a founder raising our seed round and would love to connect."),
                Step("accepted", "invite", null, StepType.IfInvitationAccepted, 0, waitDays: 7),
                Step("pitch", "accepted", StepBranch.Yes, StepType.LinkedInMessage, 1, body: Pitch),
                Step("bump", "pitch", null, StepType.LinkedInMessage, 4, body: Bump),
                Step("email", "accepted", StepBranch.No, StepType.Email, 0, "Quick intro", IntroEmail),
                Step("follow-up", "email", null, StepType.Email, 4, "Following up", FollowUpEmail),
            ]),
        new(
            "email-only",
            "Email only",
            "Three short emails, about a week apart.",
            [
                Step("intro", null, null, StepType.Email, 0, "Quick intro", IntroEmail),
                Step("follow-up", "intro", null, StepType.Email, 4, "Following up", FollowUpEmail),
                Step("last", "follow-up", null, StepType.Email, 7, "Closing the loop",
                    "Hi {{firstName}},\n\nI'll stop here so I don't crowd your inbox. If the timing's better later, I'd love to share where we are.\n\nThanks"),
            ]),
        new(
            "event-follow-up",
            "Event follow-up",
            "For investors you met in person: connect, then follow up on LinkedIn or by email.",
            [
                Step("invite", null, null, StepType.LinkedInInvitation, 0, body: "Great meeting you, {{firstName}}! Would love to stay in touch."),
                Step("accepted", "invite", null, StepType.IfInvitationAccepted, 0, waitDays: 5),
                Step("thanks", "accepted", StepBranch.Yes, StepType.LinkedInMessage, 0,
                    body: "Great meeting you, {{firstName}}. As promised, happy to send our deck. Would a short call next week work?"),
                Step("email", "accepted", StepBranch.No, StepType.Email, 0, "Great meeting you",
                    "Hi {{firstName}},\n\nGreat meeting you. As promised, here's a bit more on what we're building. Would a short call next week work?\n\nThanks"),
            ]),
        new(
            "re-engage",
            "Re-engage",
            "Share an update with investors who passed or went quiet.",
            [
                Step("view", null, null, StepType.LinkedInProfileView, 0),
                Step("update", "view", null, StepType.Email, 1, "A quick update from us",
                    "Hi {{firstName}},\n\nWe spoke a while back. Since then we've made real progress, and I wanted to share it in case the timing is better now.\n\nThanks"),
                Step("follow-up", "update", null, StepType.Email, 10, "Following up", FollowUpEmail),
            ]),
    ];

    public static CampaignTemplate? Find(string id) => All.FirstOrDefault(t => t.Id == id);

    private static StepInput Step(
        string key,
        string? parentKey,
        StepBranch? branch,
        StepType type,
        int delayDays,
        string? subject = null,
        string body = "",
        int waitDays = 0) =>
        new(key, parentKey, branch, type, delayDays, waitDays, subject, body);
}
