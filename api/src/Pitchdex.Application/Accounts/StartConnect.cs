using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;
using Pitchdex.Application.Integrations;
using Pitchdex.Domain.Accounts;

namespace Pitchdex.Application.Accounts;

public sealed record StartConnectCommand(AccountChannel Channel);

/// <summary>Where to send the founder to sign in. The provider sends them back to the Account page.</summary>
public sealed record ConnectLinkDto(string Url);

public sealed class StartConnectHandler(IAccountProvider provider, WorkspaceContext workspace)
{
    public async Task<ConnectLinkDto> Handle(StartConnectCommand command, CancellationToken ct)
    {
        var link = await provider.CreateConnectLinkAsync(command.Channel, workspace.RequiredId, ct);
        return new ConnectLinkDto(link.ToString());
    }
}

public sealed class StartReconnectHandler(IAppDbContext db, IAccountProvider provider)
{
    public async Task<ConnectLinkDto> Handle(Guid accountId, CancellationToken ct)
    {
        var account = await db.ConnectedAccounts.AsNoTracking().FirstOrDefaultAsync(a => a.Id == accountId, ct)
            ?? throw new NotFoundException("That account isn't connected.");

        var link = await provider.CreateReconnectLinkAsync(account.ExternalId, ct);
        return new ConnectLinkDto(link.ToString());
    }
}
