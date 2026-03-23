using TuCreditoOnline.Infrastructure.Security;

namespace TuCreditoOnline.Tests.UnitTests.Security;

public class InputSanitizerTests
{
    // ── SanitizeHtml ──────────────────────────────────────────────────────────

    [Theory]
    [InlineData(null, "")]
    [InlineData("", "")]
    [InlineData("   ", "")]
    public void SanitizeHtml_WithNullOrEmpty_ShouldReturnEmpty(string? input, string expected)
    {
        InputSanitizer.SanitizeHtml(input).Should().Be(expected);
    }

    [Fact]
    public void SanitizeHtml_WithPlainText_ShouldReturnTextUnchanged()
    {
        var result = InputSanitizer.SanitizeHtml("Hello World");
        result.Should().Be("Hello World");
    }

    [Fact]
    public void SanitizeHtml_WithScriptTag_ShouldRemoveIt()
    {
        var result = InputSanitizer.SanitizeHtml("<script>alert('xss')</script>Hello");
        result.Should().NotContain("<script>");
        result.Should().NotContain("</script>");
    }

    [Fact]
    public void SanitizeHtml_WithHtmlParagraph_ShouldRemoveTags()
    {
        var result = InputSanitizer.SanitizeHtml("<p>Hello <b>World</b></p>");
        result.Should().NotContain("<p>");
        result.Should().NotContain("<b>");
        result.Should().Contain("Hello");
        result.Should().Contain("World");
    }

    // ── SanitizeString ────────────────────────────────────────────────────────

    [Theory]
    [InlineData(null, "")]
    [InlineData("", "")]
    public void SanitizeString_WithNullOrEmpty_ShouldReturnEmpty(string? input, string expected)
    {
        InputSanitizer.SanitizeString(input).Should().Be(expected);
    }

    [Fact]
    public void SanitizeString_WithWhitespace_ShouldTrimResult()
    {
        var result = InputSanitizer.SanitizeString("  Hello World  ");
        result.Should().Be("Hello World");
    }

    [Fact]
    public void SanitizeString_WithPlainText_ShouldReturnText()
    {
        var result = InputSanitizer.SanitizeString("Normal text");
        result.Should().Be("Normal text");
    }

    // ── SanitizeEmail ─────────────────────────────────────────────────────────

    [Theory]
    [InlineData(null, "")]
    [InlineData("", "")]
    [InlineData("invalid-email", "")]
    [InlineData("missing@dot", "")]
    [InlineData("noDomainAt", "")]
    public void SanitizeEmail_WithInvalidInput_ShouldReturnEmpty(string? email, string expected)
    {
        InputSanitizer.SanitizeEmail(email).Should().Be(expected);
    }

    [Theory]
    [InlineData("user@example.com", "user@example.com")]
    [InlineData("USER@EXAMPLE.COM", "user@example.com")]
    [InlineData("  user@example.com  ", "user@example.com")]
    public void SanitizeEmail_WithValidInput_ShouldNormalizeToLowerCase(string email, string expected)
    {
        InputSanitizer.SanitizeEmail(email).Should().Be(expected);
    }

    // ── SanitizeAlphanumeric ──────────────────────────────────────────────────

    [Theory]
    [InlineData(null, "")]
    [InlineData("", "")]
    public void SanitizeAlphanumeric_WithNullOrEmpty_ShouldReturnEmpty(string? input, string expected)
    {
        InputSanitizer.SanitizeAlphanumeric(input).Should().Be(expected);
    }

    [Fact]
    public void SanitizeAlphanumeric_WithSpecialChars_ShouldRemoveThem()
    {
        var result = InputSanitizer.SanitizeAlphanumeric("Hello, World! 123");
        result.Should().Be("HelloWorld123");
    }

    [Fact]
    public void SanitizeAlphanumeric_WithAllowedSpecialChars_ShouldRetainThem()
    {
        var result = InputSanitizer.SanitizeAlphanumeric("Hello-World_123", "-_");
        result.Should().Be("Hello-World_123");
    }

    // ── SanitizePhoneNumber ───────────────────────────────────────────────────

    [Theory]
    [InlineData(null, "")]
    [InlineData("", "")]
    [InlineData("123", "")]
    [InlineData("12345678901234567", "")]
    public void SanitizePhoneNumber_WithInvalidInput_ShouldReturnEmpty(string? phone, string expected)
    {
        InputSanitizer.SanitizePhoneNumber(phone).Should().Be(expected);
    }

    [Theory]
    [InlineData("555-123-4567", "5551234567")]
    [InlineData("(555) 123-4567", "5551234567")]
    [InlineData("5551234567", "5551234567")]
    public void SanitizePhoneNumber_WithValidInput_ShouldReturnDigitsOnly(string phone, string expected)
    {
        InputSanitizer.SanitizePhoneNumber(phone).Should().Be(expected);
    }

    // ── PreventSqlInjection ───────────────────────────────────────────────────

    [Theory]
    [InlineData(null, "")]
    [InlineData("", "")]
    public void PreventSqlInjection_WithNullOrEmpty_ShouldReturnEmpty(string? input, string expected)
    {
        InputSanitizer.PreventSqlInjection(input).Should().Be(expected);
    }

    [Fact]
    public void PreventSqlInjection_WithSqlCommentOperator_ShouldRemoveIt()
    {
        var result = InputSanitizer.PreventSqlInjection("SELECT * FROM users --comment");
        result.Should().NotContain("--");
    }

    [Fact]
    public void PreventSqlInjection_WithSemicolon_ShouldRemoveIt()
    {
        var result = InputSanitizer.PreventSqlInjection("value; DROP TABLE users");
        result.Should().NotContain(";");
    }

    [Fact]
    public void PreventSqlInjection_WithSingleQuote_ShouldEscapeIt()
    {
        var result = InputSanitizer.PreventSqlInjection("O'Brien");
        result.Should().Contain("''");
    }

    [Fact]
    public void PreventSqlInjection_WithPlainText_ShouldReturnText()
    {
        var result = InputSanitizer.PreventSqlInjection("Hello World");
        result.Should().Be("Hello World");
    }

    // ── PreventNoSqlInjection ─────────────────────────────────────────────────

    [Theory]
    [InlineData(null, "")]
    [InlineData("", "")]
    public void PreventNoSqlInjection_WithNullOrEmpty_ShouldReturnEmpty(string? input, string expected)
    {
        InputSanitizer.PreventNoSqlInjection(input).Should().Be(expected);
    }

    [Fact]
    public void PreventNoSqlInjection_WithMongoOperator_ShouldRemoveDollarSign()
    {
        var result = InputSanitizer.PreventNoSqlInjection("{\"$gt\": \"\"}");
        result.Should().NotContain("$");
    }

    [Fact]
    public void PreventNoSqlInjection_WithCurlyBraces_ShouldRemoveThem()
    {
        var result = InputSanitizer.PreventNoSqlInjection("{\"key\":\"value\"}");
        result.Should().NotContain("{");
        result.Should().NotContain("}");
    }

    [Fact]
    public void PreventNoSqlInjection_WithSquareBrackets_ShouldRemoveThem()
    {
        var result = InputSanitizer.PreventNoSqlInjection("[\"item1\",\"item2\"]");
        result.Should().NotContain("[");
        result.Should().NotContain("]");
    }

    // ── SanitizeDecimal ───────────────────────────────────────────────────────

    [Theory]
    [InlineData(50000, 0, 100000, 50000)]
    [InlineData(0, 0, 100000, 0)]
    [InlineData(100000, 0, 100000, 100000)]
    public void SanitizeDecimal_WithValueInRange_ShouldReturnValueUnchanged(
        double value, double min, double max, double expected)
    {
        var result = InputSanitizer.SanitizeDecimal((decimal)value, (decimal)min, (decimal)max);
        result.Should().Be((decimal)expected);
    }

    [Fact]
    public void SanitizeDecimal_BelowMin_ShouldClampToMin()
    {
        var result = InputSanitizer.SanitizeDecimal(-100m, min: 0m, max: 1000m);
        result.Should().Be(0m);
    }

    [Fact]
    public void SanitizeDecimal_AboveMax_ShouldClampToMax()
    {
        var result = InputSanitizer.SanitizeDecimal(2000m, min: 0m, max: 1000m);
        result.Should().Be(1000m);
    }

    // ── SanitizeInt ───────────────────────────────────────────────────────────

    [Theory]
    [InlineData(36, 0, 100, 36)]
    [InlineData(0, 0, 100, 0)]
    [InlineData(100, 0, 100, 100)]
    public void SanitizeInt_WithValueInRange_ShouldReturnValueUnchanged(int value, int min, int max, int expected)
    {
        InputSanitizer.SanitizeInt(value, min, max).Should().Be(expected);
    }

    [Fact]
    public void SanitizeInt_BelowMin_ShouldClampToMin()
    {
        var result = InputSanitizer.SanitizeInt(-5, min: 0, max: 100);
        result.Should().Be(0);
    }

    [Fact]
    public void SanitizeInt_AboveMax_ShouldClampToMax()
    {
        var result = InputSanitizer.SanitizeInt(200, min: 0, max: 100);
        result.Should().Be(100);
    }
}
