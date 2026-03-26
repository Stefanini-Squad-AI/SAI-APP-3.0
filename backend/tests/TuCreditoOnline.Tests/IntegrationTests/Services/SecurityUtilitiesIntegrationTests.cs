using FluentAssertions;
using TuCreditoOnline.Infrastructure.Security;
using Xunit;

namespace TuCreditoOnline.Tests.IntegrationTests.Services;

/// <summary>
/// Integration-layer tests for DtoValidator and InputSanitizer security utilities.
/// No mocking required — these are pure static methods.
/// </summary>
public class SecurityUtilitiesIntegrationTests
{
    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║  DtoValidator.ValidateEmail                                             ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    [Fact] public void Email_Null_ReturnsFailure() =>
        DtoValidator.ValidateEmail(null).IsSuccess.Should().BeFalse();

    [Fact] public void Email_Empty_ReturnsFailure() =>
        DtoValidator.ValidateEmail("").IsSuccess.Should().BeFalse();

    [Fact] public void Email_Valid_ReturnsSuccess() =>
        DtoValidator.ValidateEmail("user@example.com").IsSuccess.Should().BeTrue();

    [Fact] public void Email_Valid_IsLowercased() =>
        DtoValidator.ValidateEmail("USER@EXAMPLE.COM").Data.Should().Be("user@example.com");

    [Fact] public void Email_InvalidFormat_ReturnsFailure() =>
        DtoValidator.ValidateEmail("not-an-email").IsSuccess.Should().BeFalse();

    [Fact] public void Email_TooLong_ReturnsFailure() =>
        DtoValidator.ValidateEmail(new string('a', 50) + "@" + new string('b', 50) + ".com").IsSuccess.Should().BeFalse();

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║  DtoValidator.ValidateRequiredString                                   ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    [Fact] public void RequiredString_Null_ReturnsFailure() =>
        DtoValidator.ValidateRequiredString(null, "Field").IsSuccess.Should().BeFalse();

    [Fact] public void RequiredString_Empty_ReturnsFailure() =>
        DtoValidator.ValidateRequiredString("  ", "Field").IsSuccess.Should().BeFalse();

    [Fact] public void RequiredString_Valid_ReturnsSuccess() =>
        DtoValidator.ValidateRequiredString("Hello World", "Field").IsSuccess.Should().BeTrue();

    [Fact] public void RequiredString_ExceedsMaxLength_ReturnsFailure() =>
        DtoValidator.ValidateRequiredString(new string('a', 50), "Field", 10).IsSuccess.Should().BeFalse();

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║  DtoValidator.ValidatePhoneNumber                                      ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    [Fact] public void Phone_Null_ReturnsFailure() =>
        DtoValidator.ValidatePhoneNumber(null).IsSuccess.Should().BeFalse();

    [Fact] public void Phone_Valid10Digits_ReturnsSuccess() =>
        DtoValidator.ValidatePhoneNumber("1234567890").IsSuccess.Should().BeTrue();

    [Fact] public void Phone_TooShort_ReturnsFailure() =>
        DtoValidator.ValidatePhoneNumber("12345").IsSuccess.Should().BeFalse();

    [Fact] public void Phone_TooLong_ReturnsFailure() =>
        DtoValidator.ValidatePhoneNumber("1234567890123456").IsSuccess.Should().BeFalse();

    [Fact] public void Phone_WithDashes_StillValid() =>
        DtoValidator.ValidatePhoneNumber("123-456-7890").IsSuccess.Should().BeTrue();

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║  DtoValidator.ValidatePassword                                         ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    [Fact] public void Password_Null_ReturnsFailure() =>
        DtoValidator.ValidatePassword(null).IsSuccess.Should().BeFalse();

    [Fact] public void Password_TooShort_ReturnsFailure() =>
        DtoValidator.ValidatePassword("Ab1!").IsSuccess.Should().BeFalse();

    [Fact] public void Password_TooLong_ReturnsFailure() =>
        DtoValidator.ValidatePassword(new string('A', 101)).IsSuccess.Should().BeFalse();

    [Fact] public void Password_NoUppercase_ReturnsFailure() =>
        DtoValidator.ValidatePassword("abcde123!").IsSuccess.Should().BeFalse();

    [Fact] public void Password_NoLowercase_ReturnsFailure() =>
        DtoValidator.ValidatePassword("ABCDE123!").IsSuccess.Should().BeFalse();

    [Fact] public void Password_NoDigit_ReturnsFailure() =>
        DtoValidator.ValidatePassword("Abcdefgh!").IsSuccess.Should().BeFalse();

    [Fact] public void Password_NoSpecialChar_ReturnsFailure() =>
        DtoValidator.ValidatePassword("Abcde123").IsSuccess.Should().BeFalse();

    [Fact] public void Password_Valid_ReturnsSuccess() =>
        DtoValidator.ValidatePassword("Secure@Pass1").IsSuccess.Should().BeTrue();

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║  DtoValidator.ValidatePositiveDecimal / ValidatePositiveInt            ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    [Fact] public void Decimal_AtZero_ReturnsFailure() =>
        DtoValidator.ValidatePositiveDecimal(0m, "Amount").IsSuccess.Should().BeFalse();

    [Fact] public void Decimal_Positive_ReturnsSuccess() =>
        DtoValidator.ValidatePositiveDecimal(100m, "Amount").IsSuccess.Should().BeTrue();

    [Fact] public void Decimal_ExceedsMax_ReturnsFailure() =>
        DtoValidator.ValidatePositiveDecimal(200m, "Amount", max: 100m).IsSuccess.Should().BeFalse();

    [Fact] public void Int_BelowMin_ReturnsFailure() =>
        DtoValidator.ValidatePositiveInt(-1, "Count", min: 0).IsSuccess.Should().BeFalse();

    [Fact] public void Int_Valid_ReturnsSuccess() =>
        DtoValidator.ValidatePositiveInt(5, "Count", min: 1, max: 10).IsSuccess.Should().BeTrue();

    [Fact] public void Int_ExceedsMax_ReturnsFailure() =>
        DtoValidator.ValidatePositiveInt(20, "Count", min: 0, max: 10).IsSuccess.Should().BeFalse();

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║  DtoValidator.ContainsSuspiciousPatterns                               ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    [Fact] public void Suspicious_Null_ReturnsFalse() =>
        DtoValidator.ContainsSuspiciousPatterns(null).Should().BeFalse();

    [Fact] public void Suspicious_NormalText_ReturnsFalse() =>
        DtoValidator.ContainsSuspiciousPatterns("Hello World").Should().BeFalse();

    [Fact] public void Suspicious_ScriptTag_ReturnsTrue() =>
        DtoValidator.ContainsSuspiciousPatterns("<script>alert(1)</script>").Should().BeTrue();

    [Fact] public void Suspicious_SqlUnion_ReturnsTrue() =>
        DtoValidator.ContainsSuspiciousPatterns("UNION SELECT * FROM users").Should().BeTrue();

    [Fact] public void Suspicious_DropTable_ReturnsTrue() =>
        DtoValidator.ContainsSuspiciousPatterns("DROP TABLE users").Should().BeTrue();

    [Fact] public void Suspicious_MongoOperator_ReturnsTrue() =>
        DtoValidator.ContainsSuspiciousPatterns("{\"$ne\": null}").Should().BeTrue();

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║  InputSanitizer.SanitizeHtml                                           ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    [Fact] public void Html_Null_ReturnsEmpty() =>
        InputSanitizer.SanitizeHtml(null).Should().BeEmpty();

    [Fact] public void Html_CleanText_ReturnsText() =>
        InputSanitizer.SanitizeHtml("Hello World").Should().Be("Hello World");

    [Fact] public void Html_WithScriptTag_RemovesScript() =>
        InputSanitizer.SanitizeHtml("<script>alert('xss')</script>Hello").Should().NotContain("script");

    [Fact] public void Html_WithStyleTag_RemovesStyle() =>
        InputSanitizer.SanitizeHtml("<style>body{}</style>Text").Should().NotContain("style");

    [Fact] public void Html_WithHtmlTags_StripsTags() =>
        InputSanitizer.SanitizeHtml("<p>Hello <b>World</b></p>").Should().NotContain("<p>");

    [Fact] public void Html_Entities_AreDecoded() =>
        InputSanitizer.SanitizeHtml("Hello &amp; World").Should().Contain("&");

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║  InputSanitizer.SanitizeString                                         ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    [Fact] public void String_Null_ReturnsEmpty() =>
        InputSanitizer.SanitizeString(null).Should().BeEmpty();

    [Fact] public void String_Valid_ReturnsText() =>
        InputSanitizer.SanitizeString("Hello World").Should().Be("Hello World");

    [Fact] public void String_WithHtml_StripsTags() =>
        InputSanitizer.SanitizeString("<b>Bold</b>").Should().NotContain("<b>");

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║  InputSanitizer.SanitizeEmail                                          ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    [Fact] public void SanitizeEmail_Null_ReturnsEmpty() =>
        InputSanitizer.SanitizeEmail(null).Should().BeEmpty();

    [Fact] public void SanitizeEmail_Valid_LowercasesResult() =>
        InputSanitizer.SanitizeEmail("USER@EXAMPLE.COM").Should().Be("user@example.com");

    [Fact] public void SanitizeEmail_InvalidFormat_ReturnsEmpty() =>
        InputSanitizer.SanitizeEmail("not-an-email").Should().BeEmpty();

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║  InputSanitizer.SanitizeAlphanumeric                                   ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    [Fact] public void Alphanumeric_Null_ReturnsEmpty() =>
        InputSanitizer.SanitizeAlphanumeric(null).Should().BeEmpty();

    [Fact] public void Alphanumeric_CleanInput_ReturnsSame() =>
        InputSanitizer.SanitizeAlphanumeric("Hello123").Should().Be("Hello123");

    [Fact] public void Alphanumeric_WithSpecialChars_RemovesThem() =>
        InputSanitizer.SanitizeAlphanumeric("Hello!@#World").Should().Be("HelloWorld");

    [Fact] public void Alphanumeric_WithAllowedSpecialChars_KeepsThem() =>
        InputSanitizer.SanitizeAlphanumeric("Hello-World", "-").Should().Be("Hello-World");

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║  InputSanitizer.SanitizePhoneNumber                                    ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    [Fact] public void SanitizePhone_Null_ReturnsEmpty() =>
        InputSanitizer.SanitizePhoneNumber(null).Should().BeEmpty();

    [Fact] public void SanitizePhone_Valid_ReturnsDigitsOnly() =>
        InputSanitizer.SanitizePhoneNumber("(123) 456-7890").Should().Be("1234567890");

    [Fact] public void SanitizePhone_TooShort_ReturnsEmpty() =>
        InputSanitizer.SanitizePhoneNumber("12345").Should().BeEmpty();

    [Fact] public void SanitizePhone_TooLong_ReturnsEmpty() =>
        InputSanitizer.SanitizePhoneNumber("1234567890123456").Should().BeEmpty();

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║  InputSanitizer.PreventSqlInjection                                    ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    [Fact] public void SqlInjection_Null_ReturnsEmpty() =>
        InputSanitizer.PreventSqlInjection(null).Should().BeEmpty();

    [Fact] public void SqlInjection_NormalText_ReturnsText() =>
        InputSanitizer.PreventSqlInjection("Hello World").Should().Be("Hello World");

    [Fact] public void SqlInjection_RemovesDangerousChars()
    {
        var result = InputSanitizer.PreventSqlInjection("'; DROP TABLE users; --");
        result.Should().NotContain("--");
    }

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║  InputSanitizer.PreventNoSqlInjection                                  ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    [Fact] public void NoSqlInjection_Null_ReturnsEmpty() =>
        InputSanitizer.PreventNoSqlInjection(null).Should().BeEmpty();

    [Fact] public void NoSqlInjection_NormalText_ReturnsText() =>
        InputSanitizer.PreventNoSqlInjection("Hello World").Should().Be("Hello World");

    [Fact] public void NoSqlInjection_RemovesMongoOperators()
    {
        var result = InputSanitizer.PreventNoSqlInjection("{\"$ne\":null}");
        result.Should().NotContain("$");
    }

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║  InputSanitizer.SanitizeDecimal / SanitizeInt                          ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    [Fact] public void SanitizeDecimal_BelowMin_ReturnsMin() =>
        InputSanitizer.SanitizeDecimal(-5m, min: 0m).Should().Be(0m);

    [Fact] public void SanitizeDecimal_AboveMax_ReturnsMax() =>
        InputSanitizer.SanitizeDecimal(200m, max: 100m).Should().Be(100m);

    [Fact] public void SanitizeDecimal_ValidValue_ReturnsValue() =>
        InputSanitizer.SanitizeDecimal(50m, min: 0m, max: 100m).Should().Be(50m);
}
