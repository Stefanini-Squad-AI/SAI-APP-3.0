using TuCreditoOnline.Domain.Entities;
using TuCreditoOnline.Infrastructure.Repositories;
using TuCreditoOnline.Infrastructure.Services;

namespace TuCreditoOnline.Tests.UnitTests.Services;

public class DashboardServiceTests
{
    private readonly Mock<CreditRequestRepository> _mockCreditRepo;
    private readonly Mock<UserRepository> _mockUserRepo;
    private readonly DashboardService _service;

    public DashboardServiceTests()
    {
        _mockCreditRepo = new Mock<CreditRequestRepository>();
        _mockUserRepo = new Mock<UserRepository>();
        _service = new DashboardService(_mockCreditRepo.Object, _mockUserRepo.Object);
    }

    // ── GetDashboardStatsAsync ────────────────────────────────────────────────

    [Fact]
    public async Task GetDashboardStatsAsync_ShouldReturnCorrectCounts()
    {
        var now = DateTime.UtcNow;
        var requests = new List<CreditRequest>
        {
            new() { Status = "Pending", RequestedAmount = 10000m, CreatedAt = now },
            new() { Status = "Approved", RequestedAmount = 20000m, CreatedAt = now },
            new() { Status = "Rejected", RequestedAmount = 5000m, CreatedAt = now },
            new() { Status = "UnderReview", RequestedAmount = 15000m, CreatedAt = now }
        };
        var users = new List<User>
        {
            new() { CreatedAt = now },
            new() { CreatedAt = now.AddMonths(-2) }
        };
        _mockCreditRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(requests);
        _mockUserRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(users);

        var result = await _service.GetDashboardStatsAsync();

        result.IsSuccess.Should().BeTrue();
        result.Data.TotalCreditRequests.Should().Be(4);
        result.Data.PendingRequests.Should().Be(1);
        result.Data.ApprovedRequests.Should().Be(1);
        result.Data.RejectedRequests.Should().Be(1);
        result.Data.UnderReviewRequests.Should().Be(1);
        result.Data.TotalUsers.Should().Be(2);
        result.Data.NewUsersThisMonth.Should().Be(1);
        result.Data.TotalApprovedAmount.Should().Be(20000m);
    }

    [Fact]
    public async Task GetDashboardStatsAsync_ShouldIncludeSixMonthsOfMonthlyStats()
    {
        _mockCreditRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>()))
                       .ReturnsAsync(new List<CreditRequest>());
        _mockUserRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>()))
                     .ReturnsAsync(new List<User>());

        var result = await _service.GetDashboardStatsAsync();

        result.IsSuccess.Should().BeTrue();
        result.Data.MonthlyStats.Should().HaveCount(6);
    }

    [Fact]
    public async Task GetDashboardStatsAsync_WithNoRequests_ShouldReturnZeroAverageAmount()
    {
        _mockCreditRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>()))
                       .ReturnsAsync(new List<CreditRequest>());
        _mockUserRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>()))
                     .ReturnsAsync(new List<User>());

        var result = await _service.GetDashboardStatsAsync();

        result.IsSuccess.Should().BeTrue();
        result.Data.AverageRequestAmount.Should().Be(0);
    }

    [Fact]
    public async Task GetDashboardStatsAsync_WithMultipleApproved_ShouldSumTotalApprovedAmount()
    {
        var requests = new List<CreditRequest>
        {
            new() { Status = "Approved", RequestedAmount = 30000m, CreatedAt = DateTime.UtcNow },
            new() { Status = "Approved", RequestedAmount = 50000m, CreatedAt = DateTime.UtcNow },
            new() { Status = "Pending", RequestedAmount = 10000m, CreatedAt = DateTime.UtcNow }
        };
        _mockCreditRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(requests);
        _mockUserRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(new List<User>());

        var result = await _service.GetDashboardStatsAsync();

        result.IsSuccess.Should().BeTrue();
        result.Data.TotalApprovedAmount.Should().Be(80000m);
        result.Data.AverageRequestAmount.Should().BeApproximately(30000m, 1m);
    }

    [Fact]
    public async Task GetDashboardStatsAsync_WhenExceptionThrown_ShouldReturnFailure()
    {
        _mockCreditRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>()))
                       .ThrowsAsync(new Exception("DB error"));

        var result = await _service.GetDashboardStatsAsync();

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Failed to fetch dashboard statistics");
    }

    // ── GetStatusDistributionAsync ────────────────────────────────────────────

    [Fact]
    public async Task GetStatusDistributionAsync_ShouldReturnCorrectPercentages()
    {
        var requests = new List<CreditRequest>
        {
            new() { Status = "Pending" },
            new() { Status = "Pending" },
            new() { Status = "Approved" }
        };
        _mockCreditRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(requests);

        var result = await _service.GetStatusDistributionAsync();

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().HaveCount(2);

        var pending = result.Data.First(d => d.Status == "Pending");
        pending.Count.Should().Be(2);
        pending.Percentage.Should().BeApproximately(66.67m, 0.01m);

        var approved = result.Data.First(d => d.Status == "Approved");
        approved.Count.Should().Be(1);
        approved.Percentage.Should().BeApproximately(33.33m, 0.01m);
    }

    [Fact]
    public async Task GetStatusDistributionAsync_WithNoRequests_ShouldReturnEmptyList()
    {
        _mockCreditRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>()))
                       .ReturnsAsync(new List<CreditRequest>());

        var result = await _service.GetStatusDistributionAsync();

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().BeEmpty();
    }

    [Fact]
    public async Task GetStatusDistributionAsync_ShouldOrderByCountDescending()
    {
        var requests = new List<CreditRequest>
        {
            new() { Status = "Approved" },
            new() { Status = "Pending" },
            new() { Status = "Pending" },
            new() { Status = "Pending" }
        };
        _mockCreditRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(requests);

        var result = await _service.GetStatusDistributionAsync();

        result.IsSuccess.Should().BeTrue();
        result.Data[0].Status.Should().Be("Pending");
        result.Data[0].Count.Should().Be(3);
    }

    [Fact]
    public async Task GetStatusDistributionAsync_WhenExceptionThrown_ShouldReturnFailure()
    {
        _mockCreditRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>()))
                       .ThrowsAsync(new Exception("DB error"));

        var result = await _service.GetStatusDistributionAsync();

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Failed to fetch status distribution");
    }
}
