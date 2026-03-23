using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using TuCreditoOnline.API.Middleware;

namespace TuCreditoOnline.Tests.UnitTests.Middleware;

public class RequestValidationMiddlewareExtensionsTests
{
    [Fact]
    public void UseRequestValidation_ShouldReturnSameApplicationBuilder()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var serviceProvider = services.BuildServiceProvider();
        var builder = new ApplicationBuilder(serviceProvider);

        var result = builder.UseRequestValidation();

        result.Should().BeSameAs(builder);
    }
}
