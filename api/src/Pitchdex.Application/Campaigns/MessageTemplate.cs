using System.Text.RegularExpressions;
using Pitchdex.Application.Common;
using Pitchdex.Domain.Leads;

namespace Pitchdex.Application.Campaigns;

/// <summary>
/// Fills {{firstName}}, {{fullName}}, {{firm}} and {{calendly}} in a step's subject and message.
/// Any other {{…}} is rejected when the campaign is saved, so a typo never reaches an investor.
/// </summary>
public static partial class MessageTemplate
{
    public static readonly IReadOnlyList<string> Fields = ["firstName", "fullName", "firm", "calendly"];

    public const string CalendlyMissing = "Add your Calendly link in Settings so {{calendly}} can be filled in.";

    [GeneratedRegex(@"\{\{\s*([A-Za-z]+)\s*\}\}")]
    private static partial Regex Placeholder();

    /// <param name="calendlyUrl">The workspace's booking page. Without one, {{calendly}} can't be sent.</param>
    public static string Render(string template, Lead lead, string? calendlyUrl) =>
        Placeholder().Replace(template, match => match.Groups[1].Value.ToLowerInvariant() switch
        {
            "firstname" => FirstName(lead.FullName),
            "fullname" => lead.FullName,
            "firm" => lead.Firm ?? "your firm",
            "calendly" => calendlyUrl ?? throw new UseCaseException(CalendlyMissing),
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

    /// <summary>Whether the text asks for the booking link.</summary>
    public static bool UsesCalendly(string? template) =>
        template is not null &&
        Placeholder().Matches(template).Any(m => m.Groups[1].Value.Equals("calendly", StringComparison.OrdinalIgnoreCase));

    private static string FirstName(string fullName) =>
        fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? fullName;
}
