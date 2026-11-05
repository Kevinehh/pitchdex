using Microsoft.AspNetCore.DataProtection;
using Pitchdex.Application.Common;

namespace Pitchdex.Infrastructure.Security;

/// <summary>
/// Encrypts with ASP.NET Data Protection, the same keys that protect sign-in cookies. On AWS
/// the keys are kept in Parameter Store (see the API's HostingSetup), so saved tokens keep
/// working after a deploy.
/// </summary>
internal sealed class DataProtectionSecretProtector(IDataProtectionProvider provider) : ISecretProtector
{
    // The purpose string keeps these apart from cookies: a token can't be read as one, or the reverse.
    private readonly IDataProtector protector = provider.CreateProtector("Pitchdex.ConnectedSecrets.v1");

    public string Protect(string secret) => protector.Protect(secret);

    public string Unprotect(string protectedSecret) => protector.Unprotect(protectedSecret);
}
