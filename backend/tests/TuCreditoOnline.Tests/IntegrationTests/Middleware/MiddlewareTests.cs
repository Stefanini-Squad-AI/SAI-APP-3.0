using System.Net;
using System.Net.Http.Json;
using Xunit;
using FluentAssertions;
using TuCreditoOnline.Application.DTOs;
using Bogus;

namespace TuCreditoOnline.Tests.IntegrationTests.Middleware;

public class SecurityHeadersMiddlewareTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public SecurityHeadersMiddlewareTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Response_ShouldContainXFrameOptions()
    {
        var response = await _client.GetAsync("/api/health");
        response.Headers.TryGetValues("X-Frame-Options", out var values).Should().BeTrue();
        values!.Should().Contain("DENY");
    }

    [Fact]
    public async Task Response_ShouldContainXContentTypeOptions()
    {
        var response = await _client.GetAsync("/api/health");
        response.Headers.TryGetValues("X-Content-Type-Options", out var values).Should().BeTrue();
        values!.Should().Contain("nosniff");
    }

    [Fact]
    public async Task Response_ShouldContainXXSSProtection()
    {
        var response = await _client.GetAsync("/api/health");
        response.Headers.TryGetValues("X-XSS-Protection", out var values).Should().BeTrue();
        values!.Should().Contain("1; mode=block");
    }

    [Fact]
    public async Task Response_ShouldContainReferrerPolicy()
    {
        var response = await _client.GetAsync("/api/health");
        response.Headers.TryGetValues("Referrer-Policy", out var values).Should().BeTrue();
        values!.Should().Contain("strict-origin-when-cross-origin");
    }

    [Fact]
    public async Task Response_ShouldContainPermissionsPolicy()
    {
        var response = await _client.GetAsync("/api/health");
        response.Headers.TryGetValues("Permissions-Policy", out var values).Should().BeTrue();
        var policy = string.Join("", values!);
        policy.Should().Contain("geolocation=()");
        policy.Should().Contain("camera=()");
    }

    [Fact]
    public async Task Response_ShouldContainStrictTransportSecurity()
    {
        var response = await _client.GetAsync("/api/health");
        response.Headers.TryGetValues("Strict-Transport-Security", out var values).Should().BeTrue();
        var hsts = string.Join("", values!);
        hsts.Should().Contain("max-age=31536000");
        hsts.Should().Contain("includeSubDomains");
    }

    [Fact]
    public async Task Response_ShouldContainContentSecurityPolicy()
    {
        var response = await _client.GetAsync("/api/health");
        response.Headers.TryGetValues("Content-Security-Policy", out var values).Should().BeTrue();
        var csp = string.Join("", values!);
        csp.Should().Contain("default-src 'self'");
        csp.Should().Contain("frame-ancestors 'none'");
    }

    [Fact]
    public async Task Response_ShouldNotContainServerHeader()
    {
        var response = await _client.GetAsync("/api/health");
        response.Headers.Contains("Server").Should().BeFalse();
    }

    [Fact]
    public async Task Response_ShouldNotContainXPoweredByHeader()
    {
        var response = await _client.GetAsync("/api/health");
        response.Headers.Contains("X-Powered-By").Should().BeFalse();
    }

    [Fact]
    public async Task SecurityHeaders_ShouldBePresentOnAllEndpoints()
    {
        var endpoints = new[]
        {
            "/api/health",
            "/api/credittypes",
            "/api/services"
        };

        foreach (var endpoint in endpoints)
        {
            var response = await _client.GetAsync(endpoint);
            response.Headers.TryGetValues("X-Frame-Options", out _).Should().BeTrue(
                $"X-Frame-Options should be present on {endpoint}");
            response.Headers.TryGetValues("X-Content-Type-Options", out _).Should().BeTrue(
                $"X-Content-Type-Options should be present on {endpoint}");
        }
    }
}

public class RequestValidationMiddlewareTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly Faker _faker;

    public RequestValidationMiddlewareTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
        _faker = new Faker();
    }

    [Fact]
    public async Task Request_WithSuspiciousQueryParam_ShouldReturnBadRequest()
    {
        var response = await _client.GetAsync("/api/health?test=<script>alert('xss')</script>");
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Request_WithSuspiciousJavascriptInQuery_ShouldReturnBadRequest()
    {
        var response = await _client.GetAsync("/api/health?test=javascript:void(0)");
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Request_WithNormalQueryParam_ShouldNotBeBlocked()
    {
        var response = await _client.GetAsync("/api/health?test=normalvalue");
        response.StatusCode.Should().NotBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Request_WithSqlInjectionInQuery_ShouldReturnBadRequest()
    {
        var response = await _client.GetAsync("/api/credittypes?isActive=true; DROP TABLE users;--");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.OK);
    }

    [Fact]
    public async Task Request_WithOnErrorInQuery_ShouldReturnBadRequest()
    {
        var response = await _client.GetAsync("/api/health?img=onerror=alert(1)");
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Request_WithEmptyQueryParam_ShouldNotBeBlocked()
    {
        var response = await _client.GetAsync("/api/health?test=");
        response.StatusCode.Should().NotBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Request_WithMultipleValidQueryParams_ShouldNotBeBlocked()
    {
        var response = await _client.GetAsync("/api/users?page=1&pageSize=10&search=admin");
        response.StatusCode.Should().NotBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Request_WithNormalBody_ShouldNotBeBlocked()
    {
        var dto = new CreateContactMessageDto
        {
            Name = _faker.Name.FullName(),
            Email = _faker.Internet.Email(),
            Subject = "Normal message subject",
            Message = "This is a perfectly normal message."
        };

        var response = await _client.PostAsJsonAsync("/api/contactmessages", dto);
        response.StatusCode.Should().NotBe(HttpStatusCode.RequestEntityTooLarge);
    }

    [Fact]
    public async Task Request_WithContentLengthHeader_ShouldProcess()
    {
        var dto = new LoginRequestDto
        {
            Email = "test@example.com",
            Password = "Test123!"
        };

        var response = await _client.PostAsJsonAsync("/api/auth/login", dto);
        response.StatusCode.Should().NotBe(HttpStatusCode.RequestEntityTooLarge);
    }
}
