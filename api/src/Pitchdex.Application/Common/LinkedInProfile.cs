namespace Pitchdex.Application.Common;

/// <summary>Reads LinkedIn profile links like https://www.linkedin.com/in/jane-doe-123/.</summary>
public static class LinkedInProfile
{
    public static bool IsProfileUrl(string? url) => PublicIdentifier(url) is not null;

    /// <summary>The part after /in/, such as "jane-doe-123". Empty if the link isn't a profile.</summary>
    public static string? PublicIdentifier(string? url)
    {
        if (!Uri.TryCreate(url?.Trim(), UriKind.Absolute, out var uri) ||
            !uri.Host.EndsWith("linkedin.com", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var segments = uri.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries);
        return segments.Length >= 2 && segments[0].Equals("in", StringComparison.OrdinalIgnoreCase)
            ? Uri.UnescapeDataString(segments[1])
            : null;
    }
}
