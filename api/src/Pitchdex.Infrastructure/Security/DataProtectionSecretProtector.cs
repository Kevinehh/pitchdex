using Microsoft.AspNetCore.DataProtection;
using Pitchdex.Application.Common;

namespace Pitchdex.Infrastructure.Security;

/// <summary>
/// Encrypts with ASP.NET Data Protection, the same keys that protect sign-in cookies. In
/// production the keys must be kept somewhere that outlives a deploy (a database table or a
/// key vault), or every saved token stops working on the next release.
/// </summary>
internal sealed class DataProtectionSecretProtector(IDataProtectionProvider provider) : ISecretProtector
{
    // The purpose string keeps these apart from cookies: a token can't be read as one, or the reverse.
    private readonly IDataProtector protector = provider.CreateProtector("Pitchdex.ConnectedSecrets.v1");

    public string Protect(string secret) => protector.Protect(secret);

    public string Unprotect(string protectedSecret) => protector.Unprotect(protectedSecret);
}
