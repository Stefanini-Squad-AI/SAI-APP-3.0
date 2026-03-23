using TuCreditoOnline.Application.Common.Models;

namespace TuCreditoOnline.Tests.UnitTests.Application.Common.Models;

public class ResultTests
{
    [Fact]
    public void Success_WithoutMessage_ShouldUseDefaultMessage()
    {
        var result = Result.Success();

        result.IsSuccess.Should().BeTrue();
        result.Message.Should().Be("Operation successful");
        result.Errors.Should().BeEmpty();
    }

    [Fact]
    public void Success_WithMessage_ShouldPreserveMessage()
    {
        var result = Result.Success("Custom");

        result.Message.Should().Be("Custom");
    }

    [Fact]
    public void Failure_WithoutErrors_ShouldHaveEmptyErrors()
    {
        var result = Result.Failure("Failed");

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Be("Failed");
        result.Errors.Should().BeEmpty();
    }

    [Fact]
    public void Failure_WithErrors_ShouldPreserveErrors()
    {
        var errors = new List<string> { "e1", "e2" };

        var result = Result.Failure("Failed", errors);

        result.Errors.Should().BeEquivalentTo(errors);
    }

    [Fact]
    public void Success_GenericFromBase_ShouldPopulateData()
    {
        var result = Result.Success(42);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().Be(42);
    }

    [Fact]
    public void Success_GenericFromBase_WithMessage_ShouldPreserveBoth()
    {
        var result = Result.Success(7, "ok");

        result.Data.Should().Be(7);
        result.Message.Should().Be("ok");
    }

    [Fact]
    public void Failure_GenericFromBase_ShouldDefaultData()
    {
        var result = Result.Failure<int>("bad");

        result.IsSuccess.Should().BeFalse();
        result.Data.Should().Be(0);
    }

    [Fact]
    public void ResultT_Success_ShouldUseTypedFactory()
    {
        var result = Result<string>.Success("data", "done");

        result.Data.Should().Be("data");
        result.Message.Should().Be("done");
    }

    [Fact]
    public void ResultT_Failure_ShouldUseTypedFactoryWithErrors()
    {
        var result = Result<string>.Failure("bad", new List<string> { "detail" });

        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle().Which.Should().Be("detail");
    }
}
