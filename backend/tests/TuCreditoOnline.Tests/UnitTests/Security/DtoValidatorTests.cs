using TuCreditoOnline.Infrastructure.Security;

namespace TuCreditoOnline.Tests.UnitTests.Security;

public class DtoValidatorTests
{
    // ── ValidateEmail ─────────────────────────────────────────────────────────

    [Theory]
    [InlineData(null, false, "Email is required")]
    [InlineData("", false, "Email is required")]
    [InlineData("   ", false, "Email is required")]
    [InlineData("not-an-email", false, "Email is not valid")]
    [InlineData("missing@dot", false, "Email is not valid")]
    public void ValidateEmail_WithInvalidInput_ShouldReturnFailure(string? email, bool expectedSuccess, string expectedError)
    {
        var result = DtoValidator.ValidateEmail(email);

        result.IsSuccess.Should().Be(expectedSuccess);
        result.Message.Should().Contain(expectedError);
    }

    [Theory]
    [InlineData("valid@example.com")]
    [InlineData("USER@EXAMPLE.COM")]
    [InlineData("sub.domain+tag@mail.co")]
    public void ValidateEmail_WithValidInput_ShouldReturnSuccess(string email)
    {
        var result = DtoValidator.ValidateEmail(email);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNullOrEmpty();
        result.Data.Should().Be(result.Data.ToLowerInvariant());
    }

    [Fact]
    public void ValidateEmail_WithTooLongEmail_ShouldReturnFailure()
    {
        var longEmail = new string('a', 92) + "@x.com"; // > 100 chars
        var result = DtoValidator.ValidateEmail(longEmail);

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("cannot exceed");
    }

    // ── ValidateRequiredString ────────────────────────────────────────────────

    [Fact]
    public void ValidateRequiredString_WithValidInput_ShouldReturnSanitizedValue()
    {
        var result = DtoValidator.ValidateRequiredString("  Hello World  ", "FieldName");

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().Be("Hello World");
    }

    [Theory]
    [InlineData(null, "Name is required")]
    [InlineData("", "Name is required")]
    [InlineData("   ", "Name is required")]
    public void ValidateRequiredString_WithEmptyInput_ShouldReturnFailure(string? input, string expectedError)
    {
        var result = DtoValidator.ValidateRequiredString(input, "Name");

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain(expectedError);
    }

    [Fact]
    public void ValidateRequiredString_ExceedingDefaultMaxLength_ShouldReturnFailure()
    {
        var longString = new string('a', 501);
        var result = DtoValidator.ValidateRequiredString(longString, "Field");

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("cannot exceed");
    }

    [Fact]
    public void ValidateRequiredString_ExceedingCustomMaxLength_ShouldReturnFailure()
    {
        var result = DtoValidator.ValidateRequiredString("Hello World", "Field", maxLength: 5);

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("cannot exceed 5");
    }

    // ── ValidatePhoneNumber ───────────────────────────────────────────────────

    [Theory]
    [InlineData(null, false)]
    [InlineData("", false)]
    [InlineData("123", false)]
    [InlineData("abc", false)]
    public void ValidatePhoneNumber_WithInvalidInput_ShouldReturnFailure(string? phone, bool expectedSuccess)
    {
        var result = DtoValidator.ValidatePhoneNumber(phone);

        result.IsSuccess.Should().Be(expectedSuccess);
    }

    [Theory]
    [InlineData("5551234567")]
    [InlineData("55512345678")]
    public void ValidatePhoneNumber_WithValidInput_ShouldReturnSuccess(string phone)
    {
        var result = DtoValidator.ValidatePhoneNumber(phone);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNullOrEmpty();
    }

    // ── ValidatePassword ──────────────────────────────────────────────────────

    [Fact]
    public void ValidatePassword_WithValidPassword_ShouldReturnSuccess()
    {
        var result = DtoValidator.ValidatePassword("Secure@Pass1");

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().Be("Secure@Pass1");
    }

    [Theory]
    [InlineData(null, "Password is required")]
    [InlineData("", "Password is required")]
    [InlineData("Sh1!", "at least 8 characters")]
    [InlineData("alllowercase1!", "uppercase")]
    [InlineData("ALLUPPERCASE1!", "lowercase")]
    [InlineData("NoDigitsHere!", "number")]
    [InlineData("NoSpecialChar1", "special character")]
    public void ValidatePassword_WithInvalidInput_ShouldReturnFailure(string? password, string expectedError)
    {
        var result = DtoValidator.ValidatePassword(password);

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain(expectedError);
    }

    [Fact]
    public void ValidatePassword_ExceedingMaxLength_ShouldReturnFailure()
    {
        var longPassword = "Aa1!" + new string('x', 100); // 104 chars
        var result = DtoValidator.ValidatePassword(longPassword);

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("cannot exceed 100 characters");
    }

    // ── ValidatePositiveDecimal ───────────────────────────────────────────────

    [Fact]
    public void ValidatePositiveDecimal_WithValidValue_ShouldReturnSuccess()
    {
        var result = DtoValidator.ValidatePositiveDecimal(50000m, "Amount");

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().Be(50000m);
    }

    [Fact]
    public void ValidatePositiveDecimal_WithZeroValue_ShouldReturnFailure()
    {
        var result = DtoValidator.ValidatePositiveDecimal(0m, "Amount");

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Amount must be greater than");
    }

    [Fact]
    public void ValidatePositiveDecimal_WithNegativeValue_ShouldReturnFailure()
    {
        var result = DtoValidator.ValidatePositiveDecimal(-100m, "Amount");

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Amount must be greater than");
    }

    [Fact]
    public void ValidatePositiveDecimal_ExceedingMax_ShouldReturnFailure()
    {
        var result = DtoValidator.ValidatePositiveDecimal(200m, "Amount", max: 100m);

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("cannot exceed");
    }

    // ── ValidatePositiveInt ───────────────────────────────────────────────────

    [Fact]
    public void ValidatePositiveInt_WithValidValue_ShouldReturnSuccess()
    {
        var result = DtoValidator.ValidatePositiveInt(36, "Term");

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().Be(36);
    }

    [Fact]
    public void ValidatePositiveInt_BelowMin_ShouldReturnFailure()
    {
        var result = DtoValidator.ValidatePositiveInt(-1, "Term", min: 0);

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("must be at least");
    }

    [Fact]
    public void ValidatePositiveInt_ExceedingMax_ShouldReturnFailure()
    {
        var result = DtoValidator.ValidatePositiveInt(200, "Term", max: 100);

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("cannot exceed");
    }

    [Fact]
    public void ValidatePositiveInt_AtMinBoundary_ShouldReturnSuccess()
    {
        var result = DtoValidator.ValidatePositiveInt(0, "Term", min: 0);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().Be(0);
    }

    // ── ContainsSuspiciousPatterns ────────────────────────────────────────────

    [Theory]
    [InlineData(null, false)]
    [InlineData("", false)]
    [InlineData("Hello World", false)]
    [InlineData("Normal text with numbers 123", false)]
    public void ContainsSuspiciousPatterns_WithCleanInput_ShouldReturnFalse(string? input, bool expected)
    {
        DtoValidator.ContainsSuspiciousPatterns(input).Should().Be(expected);
    }

    [Theory]
    [InlineData("<script>alert(1)</script>", true)]
    [InlineData("javascript:alert(1)", true)]
    [InlineData("UNION SELECT * FROM users", true)]
    [InlineData("DROP TABLE users", true)]
    [InlineData("INSERT INTO users", true)]
    [InlineData("../../etc/passwd", true)]
    [InlineData("eval(document.cookie)", true)]
    [InlineData("exec(cmd)", true)]
    public void ContainsSuspiciousPatterns_WithMaliciousInput_ShouldReturnTrue(string input, bool expected)
    {
        DtoValidator.ContainsSuspiciousPatterns(input).Should().Be(expected);
    }
}
