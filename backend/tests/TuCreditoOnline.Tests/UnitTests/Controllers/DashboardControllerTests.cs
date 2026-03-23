using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TuCreditoOnline.API.Controllers;
using TuCreditoOnline.Application.Common.Models;
using TuCreditoOnline.Application.DTOs;
using TuCreditoOnline.Infrastructure.Repositories;
using TuCreditoOnline.Infrastructure.Services;

namespace TuCreditoOnline.Tests.UnitTests.Controllers;

public class DashboardControllerTests
{
    private readonly Mock<DashboardService> _mockService;
    private readonly DashboardController _controller;

    public DashboardControllerTests()
    {
        _mockService = new Mock<DashboardService>((CreditRequestRepository)null!, (UserRepository)null!);
        var mockLogger = new Mock<ILogger<DashboardController>>();
        _controller = new DashboardController(_mockService.Object, mockLogger.Object);
    }

    // ── GetStats ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetStats_WhenSuccess_ShouldReturnOk()
    {
        var stats = new DashboardStatsDto { TotalCreditRequests = 5, TotalUsers = 3 };
        _mockService.Setup(x => x.GetDashboardStatsAsync())
                    .ReturnsAsync(Result.Success(stats));

        var result = await _controller.GetStats();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeEquivalentTo(stats);
    }

    [Fact]
    public async Task GetStats_WhenFailure_ShouldReturn500()
    {
        _mockService.Setup(x => x.GetDashboardStatsAsync())
                    .ReturnsAsync(Result.Failure<DashboardStatsDto>("DB error"));

        var result = await _controller.GetStats();

        var statusResult = result.Should().BeOfType<ObjectResult>().Subject;
        statusResult.StatusCode.Should().Be(500);
    }

    // ── GetStatusDistribution ─────────────────────────────────────────────────

    [Fact]
    public async Task GetStatusDistribution_WhenSuccess_ShouldReturnOk()
    {
        var distribution = new List<StatusDistributionDto>
        {
            new() { Status = "Pending", Count = 3, Percentage = 60m },
            new() { Status = "Approved", Count = 2, Percentage = 40m }
        };
        _mockService.Setup(x => x.GetStatusDistributionAsync())
                    .ReturnsAsync(Result.Success(distribution));

        var result = await _controller.GetStatusDistribution();

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetStatusDistribution_WhenFailure_ShouldReturn500()
    {
        _mockService.Setup(x => x.GetStatusDistributionAsync())
                    .ReturnsAsync(Result.Failure<List<StatusDistributionDto>>("Error"));

        var result = await _controller.GetStatusDistribution();

        var statusResult = result.Should().BeOfType<ObjectResult>().Subject;
        statusResult.StatusCode.Should().Be(500);
    }
}
