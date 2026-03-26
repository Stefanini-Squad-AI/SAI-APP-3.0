using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using TuCreditoOnline.API.Middleware;

namespace TuCreditoOnline.Tests.UnitTests.Middleware;

public class RequestValidationMiddlewareTests
{
    private readonly Mock<ILogger<RequestValidationMiddleware>> _mockLogger;

    public RequestValidationMiddlewareTests()
    {
        _mockLogger = new Mock<ILogger<RequestValidationMiddleware>>();
    }

    private static DefaultHttpContext CreateContext()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        return context;
    }

    private RequestValidationMiddleware BuildMiddleware(RequestDelegate next) =>
        new(next, _mockLogger.Object);

    // ── Normal request ────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_NormalRequest_ShouldCallNext()
    {
        var nextCalled = false;
        RequestDelegate next = ctx => { nextCalled = true; return Task.CompletedTask; };
        var middleware = BuildMiddleware(next);
        var context = CreateContext();

        await middleware.InvokeAsync(context);

        nextCalled.Should().BeTrue();
        context.Response.StatusCode.Should().Be(200);
    }

    [Fact]
    public async Task InvokeAsync_WithCleanQueryParam_ShouldCallNext()
    {
        var nextCalled = false;
        RequestDelegate next = ctx => { nextCalled = true; return Task.CompletedTask; };
        var middleware = BuildMiddleware(next);
        var context = CreateContext();
        context.Request.QueryString = new QueryString("?search=credit&page=1");

        await middleware.InvokeAsync(context);

        nextCalled.Should().BeTrue();
    }

    // ── Body too large ────────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WhenBodyTooLarge_ShouldReturn413()
    {
        var nextCalled = false;
        RequestDelegate next = ctx => { nextCalled = true; return Task.CompletedTask; };
        var middleware = BuildMiddleware(next);
        var context = CreateContext();
        context.Request.ContentLength = 11 * 1024 * 1024; // 11 MB > 10 MB limit

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(StatusCodes.Status413PayloadTooLarge);
        nextCalled.Should().BeFalse();
    }

    [Fact]
    public async Task InvokeAsync_WhenBodyExactlyAtLimit_ShouldCallNext()
    {
        var nextCalled = false;
        RequestDelegate next = ctx => { nextCalled = true; return Task.CompletedTask; };
        var middleware = BuildMiddleware(next);
        var context = CreateContext();
        context.Request.ContentLength = 10 * 1024 * 1024; // exactly 10 MB, not over

        await middleware.InvokeAsync(context);

        nextCalled.Should().BeTrue();
    }

    // ── Suspicious query parameters ───────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WithSuspiciousQueryParam_ShouldReturn400()
    {
        var nextCalled = false;
        RequestDelegate next = ctx => { nextCalled = true; return Task.CompletedTask; };
        var middleware = BuildMiddleware(next);
        var context = CreateContext();
        context.Request.QueryString = new QueryString("?q=<script>alert(1)</script>");

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        nextCalled.Should().BeFalse();
    }

    [Fact]
    public async Task InvokeAsync_WithSqlInjectionInQuery_ShouldReturn400()
    {
        var nextCalled = false;
        RequestDelegate next = ctx => { nextCalled = true; return Task.CompletedTask; };
        var middleware = BuildMiddleware(next);
        var context = CreateContext();
        context.Request.QueryString = new QueryString("?id=1 UNION SELECT * FROM users");

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        nextCalled.Should().BeFalse();
    }

    // ── Suspicious headers ────────────────────────────────────────────────────

    [Fact]
    public async Task InvokeAsync_WithSuspiciousHeader_ShouldReturn400()
    {
        var nextCalled = false;
        RequestDelegate next = ctx => { nextCalled = true; return Task.CompletedTask; };
        var middleware = BuildMiddleware(next);
        var context = CreateContext();
        context.Request.Headers["X-Custom-Header"] = "javascript:alert(1)";

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        nextCalled.Should().BeFalse();
    }

    [Fact]
    public async Task InvokeAsync_WithXssInHeader_ShouldReturn400()
    {
        var nextCalled = false;
        RequestDelegate next = ctx => { nextCalled = true; return Task.CompletedTask; };
        var middleware = BuildMiddleware(next);
        var context = CreateContext();
        context.Request.Headers["X-Attack"] = "<script>document.cookie</script>";

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        nextCalled.Should().BeFalse();
    }

    [Fact]
    public async Task InvokeAsync_WithNullContentLength_ShouldCallNext()
    {
        var nextCalled = false;
        RequestDelegate next = ctx => { nextCalled = true; return Task.CompletedTask; };
        var middleware = BuildMiddleware(next);
        var context = CreateContext();
        context.Request.ContentLength = null;

        await middleware.InvokeAsync(context);

        nextCalled.Should().BeTrue();
        context.Response.StatusCode.Should().Be(200);
    }

    [Fact]
    public async Task InvokeAsync_WithSmallContentLength_ShouldCallNext()
    {
        var nextCalled = false;
        RequestDelegate next = ctx => { nextCalled = true; return Task.CompletedTask; };
        var middleware = BuildMiddleware(next);
        var context = CreateContext();
        context.Request.ContentLength = 256;

        await middleware.InvokeAsync(context);

        nextCalled.Should().BeTrue();
    }

    [Fact]
    public async Task InvokeAsync_WithCleanHeaders_ShouldCallNext()
    {
        var nextCalled = false;
        RequestDelegate next = ctx => { nextCalled = true; return Task.CompletedTask; };
        var middleware = BuildMiddleware(next);
        var context = CreateContext();
        context.Request.Headers["Authorization"] = "Bearer some-jwt-token";
        context.Request.Headers["Accept"] = "application/json";

        await middleware.InvokeAsync(context);

        nextCalled.Should().BeTrue();
        context.Response.StatusCode.Should().Be(200);
    }

    [Fact]
    public async Task InvokeAsync_WithEmptyQueryString_ShouldCallNext()
    {
        var nextCalled = false;
        RequestDelegate next = ctx => { nextCalled = true; return Task.CompletedTask; };
        var middleware = BuildMiddleware(next);
        var context = CreateContext();
        context.Request.QueryString = QueryString.Empty;

        await middleware.InvokeAsync(context);

        nextCalled.Should().BeTrue();
    }

    [Fact]
    public async Task InvokeAsync_WithMultipleCleanQueryParams_ShouldCallNext()
    {
        var nextCalled = false;
        RequestDelegate next = ctx => { nextCalled = true; return Task.CompletedTask; };
        var middleware = BuildMiddleware(next);
        var context = CreateContext();
        context.Request.QueryString = new QueryString("?page=1&pageSize=10&search=credit&status=active");

        await middleware.InvokeAsync(context);

        nextCalled.Should().BeTrue();
    }

    [Fact]
    public async Task InvokeAsync_WithSuspiciousSecondQueryParam_ShouldReturn400()
    {
        var nextCalled = false;
        RequestDelegate next = ctx => { nextCalled = true; return Task.CompletedTask; };
        var middleware = BuildMiddleware(next);
        var context = CreateContext();
        context.Request.QueryString = new QueryString("?page=1&search=<script>alert(1)</script>");

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        nextCalled.Should().BeFalse();
    }
}
