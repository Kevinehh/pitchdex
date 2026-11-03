namespace Pitchdex.Application.Common;

/// <summary>
/// Encrypts secrets founders hand Pitchdex, such as API tokens, before they're stored, so a
/// copy of the database alone can't use them.
/// </summary>
public interface ISecretProtector
{
    string Protect(string secret);

    /// <summary>Throws a <see cref="System.Security.Cryptography.CryptographicException"/> when the key that protected it is gone.</summary>
    string Unprotect(string protectedSecret);
}
