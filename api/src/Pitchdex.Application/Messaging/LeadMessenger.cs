using Pitchdex.Application.Common;
using Pitchdex.Application.Integrations;
using Pitchdex.Application.Leads;
using Pitchdex.Domain.Accounts;
using Pitchdex.Domain.Campaigns;
using Pitchdex.Domain.Leads;
using Pitchdex.Domain.Messages;

namespace Pitchdex.Application.Messaging;

/// <summary>Which campaign step a send belongs to. Empty for a manual send.</summary>
public sealed record CampaignSource(Guid EnrollmentId, Guid StepId);

/// <summary>
/// The one path every email and LinkedIn step takes, whether a founder sends it by hand
/// or a campaign does: checks the account's limits, sends through the provider, records
/// the message and moves the lead from New to Contacted. The caller saves the changes.
/// </summary>
public sealed class LeadMessenger(
    IAppDbContext db,
    IEmailChannel email,
    ILinkedInChannel linkedIn,
    TimeProvider clock)
{
    public async Task<Message> SendEmailAsync(
        Lead lead,
        ConnectedAccount account,
        string subject,
        string body,
        CampaignSource? source,
        Message? replyTo,
        CancellationToken ct)
    {
        var message = await StartAsync(lead, account, MessageKind.Email, body, source, ct);
        message.Subject = subject;
        message.CounterpartIdentifier = lead.Email;

        var sent = await email.SendAsync(
            new OutgoingEmail(account.ExternalId, lead.Email, lead.FullName, subject, body, message.Id.ToString(), replyTo?.ExternalId),
            ct);

        // Stays in the thread it answers, even when the provider doesn't report one.
        return Finish(message, lead, sent with { ThreadId = sent.ThreadId ?? replyTo?.ThreadId });
    }

    public async Task<Message> SendLinkedInAsync(
        Lead lead,
        ConnectedAccount account,
        MessageKind kind,
        string text,
        CampaignSource? source,
        CancellationToken ct)
    {
        var publicIdentifier = LinkedInProfile.PublicIdentifier(lead.LinkedInUrl)
            ?? throw new UseCaseException($"Add a LinkedIn profile link to {lead.FullName} first.");

        var message = await StartAsync(lead, account, kind, text, source, ct);

        // Looked up once per lead, then reused for every later step. The lookup also brings
        // their picture and headline, so they're saved too.
        var profileId = lead.LinkedInProviderId;
        if (profileId is null)
        {
            var person = await linkedIn.GetProfileAsync(account.ExternalId, publicIdentifier, withBackground: false, ct);
            LinkedInProfiles.Apply(lead, person, clock.GetUtcNow());
            profileId = person.ProviderId;
        }

        message.CounterpartIdentifier = profileId;

        if (kind == MessageKind.LinkedInInvitation)
        {
            await linkedIn.SendInvitationAsync(account.ExternalId, profileId, text.Length > 0 ? text : null, ct);
            return Finish(message, lead, new SentItem(null, null));
        }

        var sent = await linkedIn.SendMessageAsync(account.ExternalId, profileId, text, ct);
        return Finish(message, lead, sent);
    }

    /// <summary>
    /// Views the lead's LinkedIn profile from the account, so LinkedIn tells them who looked, and
    /// keeps the view for the account's daily limit. Refreshes their picture and headline on the
    /// way. The caller saves the changes.
    /// </summary>
    public async Task ViewLinkedInProfileAsync(Lead lead, ConnectedAccount account, CampaignSource source, CancellationToken ct)
    {
        var identifier = lead.LinkedInProviderId
            ?? LinkedInProfile.PublicIdentifier(lead.LinkedInUrl)
            ?? throw new UseCaseException($"Add a LinkedIn profile link to {lead.FullName} first.");

        var now = clock.GetUtcNow();
        var person = await linkedIn.ViewProfileAsync(account.ExternalId, identifier, ct);
        LinkedInProfiles.Apply(lead, person, now);

        db.ProfileViews.Add(new ProfileView
        {
            LeadId = lead.Id,
            AccountId = account.Id,
            EnrollmentId = source.EnrollmentId,
            CampaignStepId = source.StepId,
            ViewedAt = now,
        });
    }

    private async Task<Message> StartAsync(
        Lead lead,
        ConnectedAccount account,
        MessageKind kind,
        string body,
        CampaignSource? source,
        CancellationToken ct)
    {
        var now = clock.GetUtcNow();
        if (!await SendingQuota.HasRoomAsync(db, account, kind, now, ct))
        {
            throw new UseCaseException(SendingQuota.LimitReachedMessage(account, kind));
        }

        return new Message
        {
            AccountId = account.Id,
            LeadId = lead.Id,
            EnrollmentId = source?.EnrollmentId,
            CampaignStepId = source?.StepId,
            Kind = kind,
            Direction = MessageDirection.Outbound,
            Body = body,
            SentAt = now,
        };
    }

    private Message Finish(Message message, Lead lead, SentItem sent)
    {
        message.ExternalId = sent.ExternalId;
        message.ThreadId = sent.ThreadId;

        if (lead.Status == LeadStatus.New)
        {
            lead.Status = LeadStatus.Contacted;
        }

        db.Messages.Add(message);
        return message;
    }
}
