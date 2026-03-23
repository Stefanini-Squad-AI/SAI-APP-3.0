using System.Net;
using System.Text.RegularExpressions;

namespace TuCreditoOnline.Infrastructure.Security;

public static partial class InputSanitizer
{
    [GeneratedRegex(@"[\x00-\x08\x0B\x0C\x0E-\x1F]")]
    private static partial Regex ControlCharsRegex();

    [GeneratedRegex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$")]
    private static partial Regex EmailFormatRegex();

    [GeneratedRegex(@"[^\d]")]
    private static partial Regex NonDigitRegex();

    [GeneratedRegex(@"<script\b[^>]*>[\s\S]*?</script>", RegexOptions.IgnoreCase)]
    private static partial Regex ScriptBlockRegex();

    [GeneratedRegex(@"<style\b[^>]*>[\s\S]*?</style>", RegexOptions.IgnoreCase)]
    private static partial Regex StyleBlockRegex();

    [GeneratedRegex(@"<[^>]+>")]
    private static partial Regex HtmlTagRegex();

    [GeneratedRegex(@"\s+")]
    private static partial Regex WhitespaceCollapseRegex();

    /// <summary>
    /// Sanitizes HTML content by removing all HTML tags and potentially malicious content
    /// </summary>
    public static string SanitizeHtml(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        var s = input.Trim();
        s = ScriptBlockRegex().Replace(s, string.Empty);
        s = StyleBlockRegex().Replace(s, string.Empty);
        s = HtmlTagRegex().Replace(s, " ");
        s = WebUtility.HtmlDecode(s);
        s = WhitespaceCollapseRegex().Replace(s, " ").Trim();
        return s;
    }

    /// <summary>
    /// Sanitizes string input by removing potentially dangerous characters
    /// </summary>
    public static string SanitizeString(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        // Remove HTML tags
        var sanitized = SanitizeHtml(input);

        // Remove control characters except newline and tab
        sanitized = ControlCharsRegex().Replace(sanitized, string.Empty);

        // Trim whitespace
        return sanitized.Trim();
    }

    /// <summary>
    /// Validates and sanitizes email address
    /// </summary>
    public static string SanitizeEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return string.Empty;

        var sanitized = SanitizeString(email).ToLowerInvariant();

        // Basic email validation
        if (!EmailFormatRegex().IsMatch(sanitized))
            return string.Empty;

        return sanitized;
    }

    /// <summary>
    /// Validates that a string contains only alphanumeric characters and specific allowed characters
    /// </summary>
    public static string SanitizeAlphanumeric(string? input, string allowedSpecialChars = "")
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        var pattern = $@"[^a-zA-Z0-9{Regex.Escape(allowedSpecialChars)}]";
        return Regex.Replace(input.Trim(), pattern, string.Empty);
    }

    /// <summary>
    /// Validates phone number format
    /// </summary>
    public static string SanitizePhoneNumber(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return string.Empty;

        // Remove all non-digit characters
        var digitsOnly = NonDigitRegex().Replace(phone, string.Empty);

        // Validate length (10 digits for Mexican phone numbers)
        if (digitsOnly.Length < 10 || digitsOnly.Length > 15)
            return string.Empty;

        return digitsOnly;
    }

    /// <summary>
    /// Prevents SQL injection by escaping special characters
    /// </summary>
    public static string PreventSqlInjection(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        // Remove potentially dangerous SQL characters
        var sanitized = input
            .Replace("'", "''")
            .Replace("--", string.Empty)
            .Replace(";", string.Empty)
            .Replace("/*", string.Empty)
            .Replace("*/", string.Empty)
            .Replace("xp_", string.Empty)
            .Replace("sp_", string.Empty);

        return SanitizeString(sanitized);
    }

    /// <summary>
    /// Prevents NoSQL injection by removing MongoDB operators
    /// </summary>
    public static string PreventNoSqlInjection(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        // Remove MongoDB operators
        var sanitized = input
            .Replace("$", string.Empty)
            .Replace("{", string.Empty)
            .Replace("}", string.Empty)
            .Replace("[", string.Empty)
            .Replace("]", string.Empty);

        return SanitizeString(sanitized);
    }

    /// <summary>
    /// Validates that numeric input is within a reasonable range
    /// </summary>
    public static decimal SanitizeDecimal(decimal value, decimal min = 0, decimal max = decimal.MaxValue)
    {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }

    /// <summary>
    /// Validates that integer input is within a reasonable range
    /// </summary>
    public static int SanitizeInt(int value, int min = 0, int max = int.MaxValue)
    {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }
}
