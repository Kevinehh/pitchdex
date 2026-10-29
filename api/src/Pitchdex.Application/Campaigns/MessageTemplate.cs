using System.Text.RegularExpressions;
using Pitchdex.Domain.Leads;

namespace Pitchdex.Application.Campaigns;

/// <summary>
/// Fills {{firstName}}, {{fullName}} and {{firm}} in a step's subject and message.
/// Any other {{…}} is rejected when the campaign is saved, so a typo never reaches an investor.
/// </summary>
public static partial class MessageTemplate
{
    public static readonly IReadOnlyList<string> Fields = ["firstName", "fullName", "firm"];

    [GeneratedRegex(@"\{\{\s*([A-Za-z]+)\s*\}\}")]
    private static partial Regex Placeholder();

    public static string Render(string template, Lead lead) =>
        Placeholder().Replace(template, match => match.Groups[1].Value.ToLowerInvariant() switch
        {
            "firstname" => FirstName(lead.FullName),
            "fullname" => lead.FullName,
            "firm" => lead.Firm ?? "your firm",
            _ => match.Value,
        });

    /// <summary>Placeholders in the text that aren't one of <see cref="Fields"/>.</summary>
    public static IReadOnlyList<string> UnknownFields(string? template) =>
        template is null
            ? []
            : Placeholder().Matches(template)
                .Select(m => m.Groups[1].Value)
                .Where(name => !Fields.Contains(name, StringComparer.OrdinalIgnoreCase))
                .Distinct()
                .ToList();

    private static string FirstName(string fullName) =>
        fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? fullName;
}
