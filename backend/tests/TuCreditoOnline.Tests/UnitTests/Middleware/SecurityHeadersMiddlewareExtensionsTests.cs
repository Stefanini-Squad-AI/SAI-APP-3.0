using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using TuCreditoOnline.API.Middleware;

namespace TuCreditoOnline.Tests.UnitTests.Middleware;

public class SecurityHeadersMiddlewareExtensionsTests
{
    [Fact]
    public void UseSecurityHeaders_ShouldReturnSameApplicationBuilder()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var serviceProvider = services.BuildServiceProvider();
        var builder = new ApplicationBuilder(serviceProvider);

        var result = builder.UseSecurityHeaders();

        result.Should().BeSameAs(builder);
    }
}
