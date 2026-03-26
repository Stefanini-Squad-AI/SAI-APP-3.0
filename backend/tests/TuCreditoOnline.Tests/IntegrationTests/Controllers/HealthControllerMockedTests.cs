using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Moq;
using TuCreditoOnline.Infrastructure.Services;
using Xunit;

namespace TuCreditoOnline.Tests.IntegrationTests.Controllers;

public class HealthControllerMockedTests : IClassFixture<MockedWebApplicationFactory>
{
    private readonly MockedWebApplicationFactory _factory;

    public HealthControllerMockedTests(MockedWebApplicationFactory factory) => _factory = factory;

    private HttpClient Client() => _factory.CreateClient();

    [Fact]
    public async Task GetHealth_WhenDatabaseHealthy_Returns200()
    {
        _factory.MockDatabaseHealthService
            .Setup(s => s.CheckHealthAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DatabaseHealthResult
            {
                IsHealthy = true,
                DatabaseName = "TuCreditoOnline",
                ResponseTimeMs = 5.0,
                CollectionsCount = 8,
                Message = "Healthy"
            });

        var response = await Client().GetAsync("/api/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetHealth_WhenDatabaseUnhealthy_Returns503()
    {
        _factory.MockDatabaseHealthService
            .Setup(s => s.CheckHealthAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DatabaseHealthResult
            {
                IsHealthy = false,
                Message = "Connection refused"
            });

        var response = await Client().GetAsync("/api/health");

        response.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
    }

    [Fact]
    public async Task GetHealth_WhenExceptionThrown_Returns503()
    {
        _factory.MockDatabaseHealthService
            .Setup(s => s.CheckHealthAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Unexpected DB failure"));

        var response = await Client().GetAsync("/api/health");

        response.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
    }
}
