using System.Linq.Expressions;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using TuCreditoOnline.Application.DTOs;
using TuCreditoOnline.Domain.Entities;
using TuCreditoOnline.Infrastructure.Repositories;
using TuCreditoOnline.Infrastructure.Services;
using Xunit;

namespace TuCreditoOnline.Tests.IntegrationTests.Services;

/// <summary>
/// Integration-layer tests for UserManagementService and DashboardService.
/// Tests run real service implementations with mocked repositories.
/// </summary>
public class UserDashboardServicesIntegrationTests
{
    // ── UserManagementService ─────────────────────────────────────────────────

    private readonly Mock<UserRepository> _userRepo = new();
    private readonly UserManagementService _userSvc;

    // ── DashboardService ──────────────────────────────────────────────────────

    private readonly Mock<CreditRequestRepository> _crRepo = new();
    private readonly DashboardService _dashboard;

    public UserDashboardServicesIntegrationTests()
    {
        _userSvc = new UserManagementService(_userRepo.Object);
        _dashboard = new DashboardService(_crRepo.Object, _userRepo.Object);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static User MakeUser(string id = "u1", string email = "user@test.com", string role = "Admin") =>
        new() { Id = id, Email = email, FullName = "Test User", Role = role,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Pass123!"),
                IsActive = true, CreatedAt = DateTime.UtcNow };

    private static CreditRequest MakeCR(string id = "cr1", string status = "Pending", decimal amount = 10000m) =>
        new() { Id = id, FullName = "John", Email = "j@j.com", Status = status,
                RequestedAmount = amount, CreatedAt = DateTime.UtcNow };

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║  UserManagementService tests                                           ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    [Fact]
    public async Task User_GetAll_ReturnsPagedList()
    {
        var users = new List<User> { MakeUser("1"), MakeUser("2") };
        _userRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(users);

        var result = await _userSvc.GetAllUsersAsync(page: 1, pageSize: 10);

        result.IsSuccess.Should().BeTrue();
        result.Data.TotalCount.Should().Be(2);
    }

    [Fact]
    public async Task User_GetAll_WithSearch_FiltersResults()
    {
        var users = new List<User> { MakeUser("1", "alice@x.com"), MakeUser("2", "bob@x.com") };
        _userRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(users);

        var result = await _userSvc.GetAllUsersAsync(page: 1, pageSize: 10, searchTerm: "alice");

        result.IsSuccess.Should().BeTrue();
        result.Data.TotalCount.Should().Be(1);
    }

    [Fact]
    public async Task User_GetAll_WhenException_ReturnsFailure()
    {
        _userRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ThrowsAsync(new Exception("DB error"));

        var result = await _userSvc.GetAllUsersAsync();

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task User_GetById_WhenFound_ReturnsDto()
    {
        _userRepo.Setup(r => r.GetByIdAsync("u1", It.IsAny<CancellationToken>())).ReturnsAsync(MakeUser());

        var result = await _userSvc.GetUserByIdAsync("u1");

        result.IsSuccess.Should().BeTrue();
        result.Data.Email.Should().Be("user@test.com");
    }

    [Fact]
    public async Task User_GetById_WhenNotFound_ReturnsFailure()
    {
        _userRepo.Setup(r => r.GetByIdAsync("x", It.IsAny<CancellationToken>())).ReturnsAsync((User?)null);

        var result = await _userSvc.GetUserByIdAsync("x");

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task User_GetById_WhenException_ReturnsFailure()
    {
        _userRepo.Setup(r => r.GetByIdAsync("u1", It.IsAny<CancellationToken>())).ThrowsAsync(new Exception("DB error"));

        var result = await _userSvc.GetUserByIdAsync("u1");

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task User_Create_WithValidRole_ReturnsCreatedDto()
    {
        // FindAsync returns empty (email not taken), AddAsync returns the user
        _userRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<User, bool>>>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync(new List<User>());
        _userRepo.Setup(r => r.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync((User u, CancellationToken _) => u);

        var dto = new CreateUserDto
        {
            Email = "new@test.com", Password = "Pass123!@#",
            FullName = "New User", Role = "Admin", IsActive = true
        };

        var result = await _userSvc.CreateUserAsync(dto);

        result.IsSuccess.Should().BeTrue();
        result.Data.Email.Should().Be("new@test.com");
    }

    [Fact]
    public async Task User_Create_WithExistingEmail_ReturnsFailure()
    {
        _userRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<User, bool>>>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync(new List<User> { MakeUser() }); // non-empty = duplicate

        var result = await _userSvc.CreateUserAsync(new CreateUserDto
        {
            Email = "dup@test.com", Password = "Pass123!@#", FullName = "Dup", Role = "Admin"
        });

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task User_Create_WithInvalidRole_ReturnsFailure()
    {
        var result = await _userSvc.CreateUserAsync(new CreateUserDto
        {
            Email = "x@test.com", Password = "Pass123!", FullName = "X", Role = "InvalidRole"
        });

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task User_Update_WhenFound_ReturnsUpdatedDto()
    {
        _userRepo.Setup(r => r.GetByIdAsync("u1", It.IsAny<CancellationToken>())).ReturnsAsync(MakeUser());
        _userRepo.Setup(r => r.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _userSvc.UpdateUserAsync("u1", new UpdateUserDto
        {
            FullName = "Updated", Role = "Admin", IsActive = true
        });

        result.IsSuccess.Should().BeTrue();
        result.Data.FullName.Should().Be("Updated");
    }

    [Fact]
    public async Task User_Update_WhenNotFound_ReturnsFailure()
    {
        _userRepo.Setup(r => r.GetByIdAsync("x", It.IsAny<CancellationToken>())).ReturnsAsync((User?)null);

        var result = await _userSvc.UpdateUserAsync("x", new UpdateUserDto { FullName = "X", Role = "Admin" });

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task User_Delete_WhenFound_Succeeds()
    {
        _userRepo.Setup(r => r.GetByIdAsync("u1", It.IsAny<CancellationToken>())).ReturnsAsync(MakeUser());
        _userRepo.Setup(r => r.DeleteAsync("u1", It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _userSvc.DeleteUserAsync("u1");

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task User_Delete_WhenNotFound_ReturnsFailure()
    {
        _userRepo.Setup(r => r.GetByIdAsync("x", It.IsAny<CancellationToken>())).ReturnsAsync((User?)null);

        var result = await _userSvc.DeleteUserAsync("x");

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task User_ChangePassword_WhenFound_Succeeds()
    {
        _userRepo.Setup(r => r.GetByIdAsync("u1", It.IsAny<CancellationToken>())).ReturnsAsync(MakeUser());
        _userRepo.Setup(r => r.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _userSvc.ChangePasswordAsync(new ChangePasswordDto
        {
            UserId = "u1", NewPassword = "NewPass123!@#"
        });

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task User_ChangePassword_WhenNotFound_ReturnsFailure()
    {
        _userRepo.Setup(r => r.GetByIdAsync("x", It.IsAny<CancellationToken>())).ReturnsAsync((User?)null);

        var result = await _userSvc.ChangePasswordAsync(new ChangePasswordDto
        {
            UserId = "x", NewPassword = "NewPass123!@#"
        });

        result.IsSuccess.Should().BeFalse();
    }

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║  DashboardService tests                                                ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    [Fact]
    public async Task Dashboard_GetStats_ReturnsCorrectCounts()
    {
        var requests = new List<CreditRequest>
        {
            MakeCR("1", "Pending", 10000m),
            MakeCR("2", "Approved", 20000m),
            MakeCR("3", "Rejected", 5000m),
        };
        var users = new List<User> { MakeUser("u1"), MakeUser("u2") };

        _crRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(requests);
        _userRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(users);

        var result = await _dashboard.GetDashboardStatsAsync();

        result.IsSuccess.Should().BeTrue();
        result.Data.TotalCreditRequests.Should().Be(3);
        result.Data.TotalUsers.Should().Be(2);
        result.Data.ApprovedRequests.Should().Be(1);
        result.Data.TotalApprovedAmount.Should().Be(20000m);
    }

    [Fact]
    public async Task Dashboard_GetStats_WithNoRequests_ReturnsZeroAverage()
    {
        _crRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(new List<CreditRequest>());
        _userRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(new List<User>());

        var result = await _dashboard.GetDashboardStatsAsync();

        result.IsSuccess.Should().BeTrue();
        result.Data.AverageRequestAmount.Should().Be(0);
    }

    [Fact]
    public async Task Dashboard_GetStats_WhenException_ReturnsFailure()
    {
        _crRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ThrowsAsync(new Exception("DB error"));

        var result = await _dashboard.GetDashboardStatsAsync();

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Dashboard_GetStatusDistribution_ReturnsPercentages()
    {
        var requests = new List<CreditRequest>
        {
            MakeCR("1", "Pending"), MakeCR("2", "Pending"),
            MakeCR("3", "Approved"),
        };
        _crRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(requests);

        var result = await _dashboard.GetStatusDistributionAsync();

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeEmpty();
        result.Data.Sum(d => d.Count).Should().Be(3);
    }

    [Fact]
    public async Task Dashboard_GetStatusDistribution_WithNoRequests_ReturnsEmpty()
    {
        _crRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(new List<CreditRequest>());

        var result = await _dashboard.GetStatusDistributionAsync();

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().BeEmpty();
    }

    [Fact]
    public async Task Dashboard_GetStatusDistribution_WhenException_ReturnsFailure()
    {
        _crRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ThrowsAsync(new Exception("DB error"));

        var result = await _dashboard.GetStatusDistributionAsync();

        result.IsSuccess.Should().BeFalse();
    }
}
