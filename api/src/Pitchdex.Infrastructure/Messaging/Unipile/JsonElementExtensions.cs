using System.Globalization;
using System.Text.Json;

namespace Pitchdex.Infrastructure.Messaging.Unipile;

/// <summary>Forgiving reads from Unipile's JSON: a missing or differently typed field gives null.</summary>
internal static class JsonElementExtensions
{
    public static string? Str(this JsonElement element, params string[] path)
    {
        var current = element;
        foreach (var name in path)
        {
            if (current.ValueKind != JsonValueKind.Object || !current.TryGetProperty(name, out current))
            {
                return null;
            }
        }

        return current.ValueKind switch
        {
            JsonValueKind.String => current.GetString(),
            JsonValueKind.Number => current.GetRawText(),
            _ => null,
        };
    }

    public static bool Flag(this JsonElement element, string name) =>
        element.TryGetProperty(name, out var value) &&
        (value.ValueKind == JsonValueKind.True || (value.ValueKind == JsonValueKind.Number && value.GetInt32() != 0));

    public static DateTimeOffset? Date(this JsonElement element, string name) =>
        DateTimeOffset.TryParse(element.Str(name), CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var date)
            ? date
            : null;

    public static int? Int(this JsonElement element, string name) =>
        element.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.Number && value.TryGetInt32(out var number)
            ? number
            : null;

    /// <summary>The items of an array field, or none when it's missing.</summary>
    public static IEnumerable<JsonElement> Array(this JsonElement element, string name) =>
        element.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.Array
            ? value.EnumerateArray()
            : [];

    public static IEnumerable<JsonElement> Items(this JsonDocument document) =>
        document.RootElement.TryGetProperty("items", out var items) && items.ValueKind == JsonValueKind.Array
            ? items.EnumerateArray()
            : [];

    public static string? Cursor(this JsonDocument document) => document.RootElement.Str("cursor");
}
