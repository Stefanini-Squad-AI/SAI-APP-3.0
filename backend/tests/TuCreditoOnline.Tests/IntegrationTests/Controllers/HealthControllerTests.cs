using System.Net;
using System.Net.Http.Json;
using Xunit;
using FluentAssertions;

namespace TuCreditoOnline.Tests.IntegrationTests.Controllers;

public class HealthControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public HealthControllerTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetHealth_ShouldReturnHealthStatus()
    {
        var response = await _client.GetAsync("/api/health");

        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.ServiceUnavailable);

        var content = await response.Content.ReadFromJsonAsync<HealthCheckResponseTestDto>();
        content.Should().NotBeNull();
        content!.ApiVersion.Should().Be("1.0.0");
        content.Timestamp.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(5));
        content.Database.Should().NotBeNull();

        if (response.StatusCode == HttpStatusCode.OK)
        {
            content.Status.Should().Be("Healthy");
            content.Database!.IsConnected.Should().BeTrue();
            content.Database.Name.Should().NotBeNullOrEmpty();
            content.Database.ResponseTimeMs.Should().BeGreaterOrEqualTo(0);
            content.Database.CollectionsCount.Should().BeGreaterOrEqualTo(0);
        }
        else
        {
            content.Status.Should().Be("Unhealthy");
            content.Database!.IsConnected.Should().BeFalse();
            content.Database.Message.Should().NotBeNullOrEmpty();
        }
    }

    [Fact]
    public async Task GetHealth_ShouldReturnJsonContentType()
    {
        var response = await _client.GetAsync("/api/health");

        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
    }

    [Fact]
    public async Task GetHealth_ShouldReturnDatabaseInfo()
    {
        var response = await _client.GetAsync("/api/health");
        var content = await response.Content.ReadFromJsonAsync<HealthCheckResponseTestDto>();

        content.Should().NotBeNull();
        content!.Database.Should().NotBeNull();
        content.Database!.Message.Should().NotBeNull();
    }

    [Fact]
    public async Task GetHealth_MultipleCalls_ShouldBeConsistent()
    {
        var response1 = await _client.GetAsync("/api/health");
        var response2 = await _client.GetAsync("/api/health");

        response1.StatusCode.Should().Be(response2.StatusCode);
    }
}

public class HealthCheckResponseTestDto
{
    public string Status { get; set; } = string.Empty;
    public string ApiVersion { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public DatabaseInfoTestDto? Database { get; set; }
}

public class DatabaseInfoTestDto
{
    public bool IsConnected { get; set; }
    public string? Name { get; set; }
    public double? ResponseTimeMs { get; set; }
    public int? CollectionsCount { get; set; }
    public string Message { get; set; } = string.Empty;
}
