using Pitchdex.Domain.Messages;

namespace Pitchdex.Application.Inbox;

/// <param name="AcceptedAt">For a sent connection request: when the lead accepted it.</param>
public sealed record MessageDto(
    Guid Id,
    Guid AccountId,
    string AccountName,
    Guid? LeadId,
    string? LeadName,
    MessageKind Kind,
    MessageDirection Direction,
    string? Subject,
    string Body,
    DateTimeOffset SentAt,
    DateTimeOffset? AcceptedAt)
{
    /// <summary>A message just sent from an account to a lead.</summary>
    public static MessageDto From(Message message, string accountName, string leadName) =>
        new(message.Id, message.AccountId, accountName, message.LeadId, leadName,
            message.Kind, message.Direction, message.Subject, message.Body, message.SentAt, message.AcceptedAt);
}
