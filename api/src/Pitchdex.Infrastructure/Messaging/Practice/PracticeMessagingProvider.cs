using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Pitchdex.Application.Integrations;
using Pitchdex.Domain.Accounts;
using Pitchdex.Domain.Leads;
using Pitchdex.Domain.Messages;
using Pitchdex.Infrastructure.Persistence;

namespace Pitchdex.Infrastructure.Messaging.Practice;

/// <summary>
/// A stand-in for Unipile, used locally when no Unipile key is set. "Connecting" an
/// account adds a pretend one, sends go nowhere, and each email or LinkedIn message
/// gets a pretend reply about 30 seconds later, so the whole flow can be tried
/// without real accounts. Accounts are reloaded from the database, so they stay connected
/// across restarts; pending replies and invitations live in memory and reset.
/// </summary>
public sealed class PracticeMessagingProvider(MessagingSettings settings, TimeProvider clock, IServiceScopeFactory scopes)
    : IAccountProvider, IEmailChannel, ILinkedInChannel, IInboxProvider
{
    private static readonly TimeSpan ReplyDelay = TimeSpan.FromSeconds(30);

    /// <summary>How long a pretend lead takes to accept a connection request.</summary>
    private static readonly TimeSpan AcceptDelay = TimeSpan.FromSeconds(45);

    /// <summary>Pretend profile ids are this plus the end of the lead's LinkedIn link.</summary>
    private const string ProfilePrefix = "practice-profile-";

    private readonly ConcurrentDictionary<string, ProviderAccount> _accounts = new();

    /// <summary>The one-time load of saved practice accounts. Started by the first call that needs it.</summary>
    private Task? _loaded;
    private readonly ConcurrentQueue<PendingReply> _pendingReplies = new();

    /// <summary>Connection requests by account and profile, with when each counts as accepted.</summary>
    private readonly ConcurrentDictionary<(string Account, string Profile), DateTimeOffset> _invitations = new();

    private sealed record PendingReply(string AccountExternalId, ProviderMessage Reply, DateTimeOffset DueAt);

    /// <summary>Practice mode's sign-in page belongs to the signed-in founder, so it knows the workspace itself.</summary>
    public Task<Uri> CreateConnectLinkAsync(AccountChannel channel, Guid workspaceId, CancellationToken ct) =>
        Task.FromResult(new Uri($"{settings.FrontendUrl.TrimEnd('/')}/api/practice/connect?channel={channel}"));

    public Task<Uri> CreateReconnectLinkAsync(string accountExternalId, CancellationToken ct) =>
        Task.FromResult(new Uri(settings.ConnectedRedirectUrl(channel: null)));

    /// <summary>
    /// What the pretend sign-in page does: adds an account of that kind. Its id is random, so
    /// it never matches an account another workspace already has.
    /// </summary>
    public async Task<ProviderAccount> CompleteConnectAsync(AccountChannel channel, CancellationToken ct)
    {
        await EnsureLoadedAsync(ct);
        var number = _accounts.Values.Count(a => a.Channel == channel) + 1;
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var account = channel == AccountChannel.Email
            ? new ProviderAccount($"practice-email-{suffix}", channel, "GOOGLE_OAUTH", $"Practice mailbox {number}", $"founder{number}@practice.example", AccountStatus.Connected)
            : new ProviderAccount($"practice-linkedin-{suffix}", channel, "LINKEDIN", $"Practice LinkedIn {number}", $"practice-founder-{number}", AccountStatus.Connected);

        _accounts[account.ExternalId] = account;
        return account;
    }

    public async Task<IReadOnlyList<ProviderAccount>> ListAccountsAsync(CancellationToken ct)
    {
        await EnsureLoadedAsync(ct);
        return _accounts.Values.ToList();
    }

    public async Task<ProviderAccount?> GetAccountAsync(string externalId, CancellationToken ct)
    {
        await EnsureLoadedAsync(ct);
        return _accounts.GetValueOrDefault(externalId);
    }

    public async Task RemoveAccountAsync(string externalId, CancellationToken ct)
    {
        await EnsureLoadedAsync(ct);
        _accounts.TryRemove(externalId, out _);
    }

    /// <summary>
    /// Picks the practice accounts saved in the database back up, once, so restarting the API
    /// (or running a second one) doesn't mark them disconnected.
    /// </summary>
    private Task EnsureLoadedAsync(CancellationToken ct) => (_loaded ??= LoadAsync()).WaitAsync(ct);

    /// <summary>Not tied to one caller's cancellation, and tried again on the next call if it fails.</summary>
    private async Task LoadAsync()
    {
        try
        {
            await using var scope = scopes.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var saved = await db.ConnectedAccounts
                .IgnoreQueryFilters()
                .AsNoTracking()
                .Where(a => a.ExternalId.StartsWith("practice-"))
                .ToListAsync(CancellationToken.None);

            foreach (var account in saved)
            {
                _accounts.TryAdd(account.ExternalId, new ProviderAccount(
                    account.ExternalId, account.Channel, account.ProviderType, account.DisplayName, account.Address, AccountStatus.Connected));
            }
        }
        catch
        {
            _loaded = null;
            throw;
        }
    }

    public Task<SentItem> SendAsync(OutgoingEmail email, CancellationToken ct)
    {
        var threadId = $"practice-thread-{Guid.NewGuid():N}";
        QueueReply(email.AccountExternalId, new ProviderMessage(
            $"practice-reply-{Guid.NewGuid():N}",
            threadId,
            MessageKind.Email,
            SentByAccount: false,
            email.Subject.StartsWith("Re:", StringComparison.OrdinalIgnoreCase) ? email.Subject : $"Re: {email.Subject}",
            $"Thanks for reaching out. This is a practice reply from {email.ToName ?? email.ToAddress}. Happy to find time next week.",
            email.ToAddress,
            clock.GetUtcNow() + ReplyDelay));

        return Task.FromResult(new SentItem($"practice-sent-{Guid.NewGuid():N}", threadId));
    }

    /// <summary>A pretend profile with no picture, so the initials fallback can be tried too.</summary>
    /// <summary>Practice leads aren't real people, so nobody is told; it returns the same made-up profile.</summary>
    public Task<LinkedInPerson> ViewProfileAsync(string accountExternalId, string identifier, CancellationToken ct) =>
        GetProfileAsync(accountExternalId, identifier, withBackground: false, ct);

    public Task<LinkedInPerson> GetProfileAsync(string accountExternalId, string identifier, bool withBackground, CancellationToken ct)
    {
        var providerId = identifier.StartsWith(ProfilePrefix, StringComparison.Ordinal) ? identifier : ProfilePrefix + identifier;
        var background = new LinkedInBackground(
            "A practice profile. Connect a real LinkedIn account to see real ones.",
            Followers: 1200,
            Connections: 500,
            SharedConnections: 3,
            [new LinkedInRole("Partner", "Practice Ventures", null, new DateOnly(2021, 1, 1), null, null)],
            [new LinkedInSchool("Practice University", "MBA", null, new DateOnly(2012, 9, 1), new DateOnly(2014, 6, 1))]);

        return Task.FromResult(new LinkedInPerson(
            providerId,
            "Partner at Practice Ventures",
            "Toronto, Ontario, Canada",
            PictureUrl: null,
            LinkedInDegree.Second,
            IsOpenProfile: false,
            IsPremium: true,
            withBackground ? background : null));
    }

    /// <summary>Every connection request is accepted a little later, so waiting for acceptance can be tried.</summary>
    public Task SendInvitationAsync(string accountExternalId, string profileId, string? note, CancellationToken ct)
    {
        _invitations.TryAdd((accountExternalId, profileId), clock.GetUtcNow() + AcceptDelay);
        return Task.CompletedTask;
    }

    /// <summary>The pretend leads who have accepted by now. Their ids carry their profile link's ending.</summary>
    public Task<IReadOnlyList<LinkedInConnection>> ListRecentConnectionsAsync(string accountExternalId, int max, CancellationToken ct)
    {
        var now = clock.GetUtcNow();
        var accepted = _invitations
            .Where(pair => pair.Key.Account == accountExternalId && pair.Value <= now)
            .OrderByDescending(pair => pair.Value)
            .Take(max)
            .Select(pair => new LinkedInConnection(pair.Key.Profile, pair.Key.Profile.Replace(ProfilePrefix, "", StringComparison.Ordinal)))
            .ToList();
        return Task.FromResult<IReadOnlyList<LinkedInConnection>>(accepted);
    }

    public Task<SentItem> SendMessageAsync(string accountExternalId, string profileId, string text, CancellationToken ct)
    {
        var chatId = $"practice-chat-{profileId}";
        QueueReply(accountExternalId, new ProviderMessage(
            $"practice-reply-{Guid.NewGuid():N}",
            chatId,
            MessageKind.LinkedInMessage,
            SentByAccount: false,
            Subject: null,
            "Thanks for the note. This is a practice LinkedIn reply. Send over your deck?",
            profileId,
            clock.GetUtcNow() + ReplyDelay));

        return Task.FromResult(new SentItem($"practice-sent-{Guid.NewGuid():N}", chatId));
    }

    /// <summary>Hands over replies whose time has come, once each.</summary>
    public Task<IReadOnlyList<ProviderMessage>> FetchSinceAsync(ConnectedAccount account, DateTimeOffset since, CancellationToken ct)
    {
        var now = clock.GetUtcNow();
        var due = new List<ProviderMessage>();
        var notYet = new List<PendingReply>();

        while (_pendingReplies.TryDequeue(out var pending))
        {
            if (pending.AccountExternalId == account.ExternalId && pending.DueAt <= now)
            {
                due.Add(pending.Reply);
            }
            else
            {
                notYet.Add(pending);
            }
        }

        foreach (var pending in notYet)
        {
            _pendingReplies.Enqueue(pending);
        }

        return Task.FromResult<IReadOnlyList<ProviderMessage>>(due);
    }

    private void QueueReply(string accountExternalId, ProviderMessage reply) =>
        _pendingReplies.Enqueue(new PendingReply(accountExternalId, reply, reply.SentAt));
}
