using Microsoft.AspNetCore.Http;
using Microsoft.Net.Http.Headers;
using TuCreditoOnline.API.Middleware;

namespace TuCreditoOnline.Tests.UnitTests.Middleware;

public class SecurityHeadersMiddlewareTests
{
    private static DefaultHttpContext CreateContext()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        return context;
    }

    [Fact]
    public async Task InvokeAsync_ShouldCallNextMiddleware()
    {
        var nextCalled = false;
        RequestDelegate next = ctx => { nextCalled = true; return Task.CompletedTask; };
        var middleware = new SecurityHeadersMiddleware(next);
        var context = CreateContext();

        await middleware.InvokeAsync(context);

        nextCalled.Should().BeTrue();
    }

    [Fact]
    public async Task InvokeAsync_ShouldAddXFrameOptionsHeader()
    {
        RequestDelegate next = ctx => Task.CompletedTask;
        var middleware = new SecurityHeadersMiddleware(next);
        var context = CreateContext();

        await middleware.InvokeAsync(context);

        context.Response.Headers[HeaderNames.XFrameOptions].ToString().Should().Be("DENY");
    }

    [Fact]
    public async Task InvokeAsync_ShouldAddXContentTypeOptionsHeader()
    {
        RequestDelegate next = ctx => Task.CompletedTask;
        var middleware = new SecurityHeadersMiddleware(next);
        var context = CreateContext();

        await middleware.InvokeAsync(context);

        context.Response.Headers[HeaderNames.XContentTypeOptions].ToString().Should().Be("nosniff");
    }

    [Fact]
    public async Task InvokeAsync_ShouldAddXssProtectionHeader()
    {
        RequestDelegate next = ctx => Task.CompletedTask;
        var middleware = new SecurityHeadersMiddleware(next);
        var context = CreateContext();

        await middleware.InvokeAsync(context);

        context.Response.Headers[HeaderNames.XXSSProtection].ToString().Should().Be("1; mode=block");
    }

    [Fact]
    public async Task InvokeAsync_ShouldAddAllRequiredSecurityHeaders()
    {
        RequestDelegate next = ctx => Task.CompletedTask;
        var middleware = new SecurityHeadersMiddleware(next);
        var context = CreateContext();

        await middleware.InvokeAsync(context);

        context.Response.Headers.Should().ContainKey(HeaderNames.XFrameOptions);
        context.Response.Headers.Should().ContainKey(HeaderNames.XContentTypeOptions);
        context.Response.Headers.Should().ContainKey(HeaderNames.XXSSProtection);
        context.Response.Headers.Should().ContainKey("Referrer-Policy");
        context.Response.Headers.Should().ContainKey(HeaderNames.ContentSecurityPolicy);
        context.Response.Headers.Should().ContainKey("Permissions-Policy");
        context.Response.Headers.Should().ContainKey(HeaderNames.StrictTransportSecurity);
    }

    [Fact]
    public async Task InvokeAsync_ShouldAddHstsHeader()
    {
        RequestDelegate next = ctx => Task.CompletedTask;
        var middleware = new SecurityHeadersMiddleware(next);
        var context = CreateContext();

        await middleware.InvokeAsync(context);

        context.Response.Headers[HeaderNames.StrictTransportSecurity].ToString()
               .Should().Contain("max-age=31536000");
    }
}
