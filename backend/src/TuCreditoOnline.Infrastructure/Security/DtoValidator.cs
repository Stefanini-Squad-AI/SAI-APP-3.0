using System.Text.RegularExpressions;
using TuCreditoOnline.Application.Common.Models;

namespace TuCreditoOnline.Infrastructure.Security;

public static partial class DtoValidator
{
    [GeneratedRegex(@"[A-Z]")]
    private static partial Regex UppercaseRegex();

    [GeneratedRegex(@"[a-z]")]
    private static partial Regex LowercaseRegex();

    [GeneratedRegex(@"\d")]
    private static partial Regex DigitRegex();

    [GeneratedRegex(@"[!@#$%^&*(),.?""':{}|<>]")]
    private static partial Regex SpecialCharRegex();

    [GeneratedRegex(@"<script|javascript:|onerror=|onclick=|\$where|\$ne|\$gt|\$lt|UNION\s+SELECT|DROP\s+TABLE|INSERT\s+INTO|\.\.\/|\.\.\\|eval\(|exec\(|system\(", RegexOptions.IgnoreCase)]
    private static partial Regex SuspiciousPatternRegex();
    private const int MaxStringLength = 500;
    private const int MaxEmailLength = 100;
    private const int MaxPhoneLength = 15;

    /// <summary>
    /// Validates and sanitizes email format
    /// </summary>
    public static Result<string> ValidateEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return Result<string>.Failure("Email is required");

        var sanitized = InputSanitizer.SanitizeEmail(email);

        if (string.IsNullOrWhiteSpace(sanitized))
            return Result<string>.Failure("Email is not valid");

        if (sanitized.Length > MaxEmailLength)
            return Result<string>.Failure($"Email cannot exceed {MaxEmailLength} characters");

        return Result<string>.Success(sanitized);
    }

    /// <summary>
    /// Validates and sanitizes a required string field
    /// </summary>
    public static Result<string> ValidateRequiredString(string? input, string fieldName, int? maxLength = null)
    {
        if (string.IsNullOrWhiteSpace(input))
            return Result<string>.Failure($"{fieldName} is required");

        var sanitized = InputSanitizer.SanitizeString(input);

        if (string.IsNullOrWhiteSpace(sanitized))
            return Result<string>.Failure($"{fieldName} contains invalid characters");

        var max = maxLength ?? MaxStringLength;
        if (sanitized.Length > max)
            return Result<string>.Failure($"{fieldName} cannot exceed {max} characters");

        return Result<string>.Success(sanitized);
    }

    /// <summary>
    /// Validates and sanitizes a phone number
    /// </summary>
    public static Result<string> ValidatePhoneNumber(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return Result<string>.Failure("Phone is required");

        var sanitized = InputSanitizer.SanitizePhoneNumber(phone);

        if (string.IsNullOrWhiteSpace(sanitized))
            return Result<string>.Failure("Phone is not valid");

        if (sanitized.Length < 10)
            return Result<string>.Failure("Phone must have at least 10 digits");

        if (sanitized.Length > MaxPhoneLength)
            return Result<string>.Failure($"Phone cannot exceed {MaxPhoneLength} digits");

        return Result<string>.Success(sanitized);
    }

    /// <summary>
    /// Validates password strength
    /// </summary>
    public static Result<string> ValidatePassword(string? password)
    {
        if (string.IsNullOrWhiteSpace(password))
            return Result<string>.Failure("Password is required");

        if (password.Length < 8)
            return Result<string>.Failure("Password must be at least 8 characters");

        if (password.Length > 100)
            return Result<string>.Failure("Password cannot exceed 100 characters");

        // Check for at least one uppercase letter
        if (!UppercaseRegex().IsMatch(password))
            return Result<string>.Failure("Password must contain at least one uppercase letter");

        // Check for at least one lowercase letter
        if (!LowercaseRegex().IsMatch(password))
            return Result<string>.Failure("Password must contain at least one lowercase letter");

        // Check for at least one digit
        if (!DigitRegex().IsMatch(password))
            return Result<string>.Failure("Password must contain at least one number");

        // Check for at least one special character
        if (!SpecialCharRegex().IsMatch(password))
            return Result<string>.Failure("Password must contain at least one special character");

        return Result<string>.Success(password);
    }

    /// <summary>
    /// Validates a positive decimal value within an optional range
    /// </summary>
    public static Result<decimal> ValidatePositiveDecimal(decimal value, string fieldName, decimal min = 0, decimal max = decimal.MaxValue)
    {
        if (value <= min)
            return Result<decimal>.Failure($"{fieldName} must be greater than {min}");

        if (value > max)
            return Result<decimal>.Failure($"{fieldName} cannot exceed {max}");

        var sanitized = InputSanitizer.SanitizeDecimal(value, min, max);
        return Result<decimal>.Success(sanitized);
    }

    /// <summary>
    /// Validates a positive integer value within an optional range
    /// </summary>
    public static Result<int> ValidatePositiveInt(int value, string fieldName, int min = 0, int max = int.MaxValue)
    {
        if (value < min)
            return Result<int>.Failure($"{fieldName} must be at least {min}");

        if (value > max)
            return Result<int>.Failure($"{fieldName} cannot exceed {max}");

        var sanitized = InputSanitizer.SanitizeInt(value, min, max);
        return Result<int>.Success(sanitized);
    }

    /// <summary>
    /// Checks whether the input contains known injection or XSS patterns
    /// </summary>
    public static bool ContainsSuspiciousPatterns(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return false;

        return SuspiciousPatternRegex().IsMatch(input);
    }
}
