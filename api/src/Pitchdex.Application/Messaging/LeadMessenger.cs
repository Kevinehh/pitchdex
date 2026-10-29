using Pitchdex.Application.Common;
using Pitchdex.Application.Integrations;
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

        // Looked up once per lead, then reused for every later step.
        lead.LinkedInProviderId ??= await linkedIn.ResolveProfileIdAsync(account.ExternalId, publicIdentifier, ct);
        message.CounterpartIdentifier = lead.LinkedInProviderId;

        if (kind == MessageKind.LinkedInInvitation)
        {
            await linkedIn.SendInvitationAsync(account.ExternalId, lead.LinkedInProviderId, text.Length > 0 ? text : null, ct);
            return Finish(message, lead, new SentItem(null, null));
        }

        var sent = await linkedIn.SendMessageAsync(account.ExternalId, lead.LinkedInProviderId, text, ct);
        return Finish(message, lead, sent);
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
