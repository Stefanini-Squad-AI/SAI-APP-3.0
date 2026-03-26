using System.Net;
using System.Net.Http.Headers;
using FluentAssertions;
using Moq;
using TuCreditoOnline.Application.Common.Models;
using TuCreditoOnline.Application.DTOs;
using Xunit;

namespace TuCreditoOnline.Tests.IntegrationTests.Controllers;

[Collection("MockedIntegration")]
public class DashboardControllerMockedTests : IClassFixture<MockedWebApplicationFactory>
{
    private readonly MockedWebApplicationFactory _factory;

    public DashboardControllerMockedTests(MockedWebApplicationFactory factory)
        => _factory = factory;

    private HttpClient AdminClient()
    {
        var c = _factory.CreateClient();
        c.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestAuthHandler.AdminToken);
        return c;
    }

    // ── GetStats ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetStats_ReturnsOk()
    {
        var stats = new DashboardStatsDto
        {
            TotalCreditRequests = 10, PendingRequests = 3,
            ApprovedRequests = 5, RejectedRequests = 2,
            TotalUsers = 20, TotalApprovedAmount = 50000,
        };
        _factory.MockDashboardService
            .Setup(s => s.GetDashboardStatsAsync())
            .ReturnsAsync(Result<DashboardStatsDto>.Success(stats));

        var resp = await AdminClient().GetAsync("/api/dashboard/stats");

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetStats_WhenFails_Returns500()
    {
        _factory.MockDashboardService
            .Setup(s => s.GetDashboardStatsAsync())
            .ReturnsAsync(Result<DashboardStatsDto>.Failure("DB error"));

        var resp = await AdminClient().GetAsync("/api/dashboard/stats");

        resp.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
    }

    // ── GetStatusDistribution ─────────────────────────────────────────────────

    [Fact]
    public async Task GetStatusDistribution_ReturnsOk()
    {
        var distribution = new List<StatusDistributionDto>
        {
            new() { Status = "Pending", Count = 5, Percentage = 50 },
            new() { Status = "Approved", Count = 5, Percentage = 50 },
        };
        _factory.MockDashboardService
            .Setup(s => s.GetStatusDistributionAsync())
            .ReturnsAsync(Result<List<StatusDistributionDto>>.Success(distribution));

        var resp = await AdminClient().GetAsync("/api/dashboard/status-distribution");

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetStatusDistribution_WhenFails_Returns500()
    {
        _factory.MockDashboardService
            .Setup(s => s.GetStatusDistributionAsync())
            .ReturnsAsync(Result<List<StatusDistributionDto>>.Failure("DB error"));

        var resp = await AdminClient().GetAsync("/api/dashboard/status-distribution");

        resp.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
    }
}
