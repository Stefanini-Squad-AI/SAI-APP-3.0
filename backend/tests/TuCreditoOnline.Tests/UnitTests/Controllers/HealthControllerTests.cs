using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TuCreditoOnline.API.Controllers;
using TuCreditoOnline.Infrastructure.Services;

namespace TuCreditoOnline.Tests.UnitTests.Controllers;

public class HealthControllerTests
{
    private readonly Mock<IDatabaseHealthService> _mockHealthService;
    private readonly HealthController _controller;

    public HealthControllerTests()
    {
        _mockHealthService = new Mock<IDatabaseHealthService>();
        var mockLogger = new Mock<ILogger<HealthController>>();
        _controller = new HealthController(_mockHealthService.Object, mockLogger.Object);
    }

    // ── GetHealth ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetHealth_WhenDatabaseHealthy_ShouldReturnOk()
    {
        _mockHealthService.Setup(x => x.CheckHealthAsync(It.IsAny<CancellationToken>()))
                          .ReturnsAsync(new DatabaseHealthResult
                          {
                              IsHealthy = true,
                              Message = "Database connection is healthy",
                              DatabaseName = "TestDb",
                              ResponseTimeMs = 5.0,
                              CollectionsCount = 8,
                              Timestamp = DateTime.UtcNow
                          });

        var result = await _controller.GetHealth(CancellationToken.None);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = ok.Value.Should().BeOfType<HealthCheckResponse>().Subject;
        response.Status.Should().Be("Healthy");
        response.Database.IsConnected.Should().BeTrue();
        response.Database.Name.Should().Be("TestDb");
    }

    [Fact]
    public async Task GetHealth_WhenDatabaseUnhealthy_ShouldReturn503()
    {
        _mockHealthService.Setup(x => x.CheckHealthAsync(It.IsAny<CancellationToken>()))
                          .ReturnsAsync(new DatabaseHealthResult
                          {
                              IsHealthy = false,
                              Message = "Connection refused",
                              Timestamp = DateTime.UtcNow
                          });

        var result = await _controller.GetHealth(CancellationToken.None);

        var statusResult = result.Should().BeOfType<ObjectResult>().Subject;
        statusResult.StatusCode.Should().Be(StatusCodes.Status503ServiceUnavailable);
        var response = statusResult.Value.Should().BeOfType<HealthCheckResponse>().Subject;
        response.Status.Should().Be("Unhealthy");
        response.Database.IsConnected.Should().BeFalse();
    }

    [Fact]
    public async Task GetHealth_WhenExceptionThrown_ShouldReturn503WithErrorMessage()
    {
        _mockHealthService.Setup(x => x.CheckHealthAsync(It.IsAny<CancellationToken>()))
                          .ThrowsAsync(new Exception("Unexpected DB failure"));

        var result = await _controller.GetHealth(CancellationToken.None);

        var statusResult = result.Should().BeOfType<ObjectResult>().Subject;
        statusResult.StatusCode.Should().Be(StatusCodes.Status503ServiceUnavailable);
        var response = statusResult.Value.Should().BeOfType<HealthCheckResponse>().Subject;
        response.Status.Should().Be("Unhealthy");
        response.Database.Message.Should().Contain("Unexpected DB failure");
    }

    [Fact]
    public async Task GetHealth_ResponseShouldIncludeApiVersion()
    {
        _mockHealthService.Setup(x => x.CheckHealthAsync(It.IsAny<CancellationToken>()))
                          .ReturnsAsync(new DatabaseHealthResult { IsHealthy = true, Timestamp = DateTime.UtcNow });

        var result = await _controller.GetHealth(CancellationToken.None);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = ok.Value.Should().BeOfType<HealthCheckResponse>().Subject;
        response.ApiVersion.Should().Be("1.0.0");
    }
}
