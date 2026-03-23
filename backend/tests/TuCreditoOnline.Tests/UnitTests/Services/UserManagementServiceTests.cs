using System.Linq.Expressions;
using TuCreditoOnline.Application.DTOs;
using TuCreditoOnline.Domain.Entities;
using TuCreditoOnline.Infrastructure.Repositories;
using TuCreditoOnline.Infrastructure.Services;

namespace TuCreditoOnline.Tests.UnitTests.Services;

public class UserManagementServiceTests
{
    private readonly Mock<UserRepository> _mockRepo;
    private readonly UserManagementService _service;

    public UserManagementServiceTests()
    {
        _mockRepo = new Mock<UserRepository>();
        _service = new UserManagementService(_mockRepo.Object);
    }

    // ── GetAllUsersAsync ──────────────────────────────────────────────────────

    [Fact]
    public async Task GetAllUsersAsync_ShouldReturnPagedUsers()
    {
        var users = new List<User>
        {
            new() { Id = "u1", Email = "a@a.com", FullName = "User A", Role = "User", IsActive = true, CreatedAt = DateTime.UtcNow },
            new() { Id = "u2", Email = "b@b.com", FullName = "User B", Role = "Admin", IsActive = true, CreatedAt = DateTime.UtcNow }
        };
        _mockRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(users);

        var result = await _service.GetAllUsersAsync();

        result.IsSuccess.Should().BeTrue();
        result.Data.Users.Should().HaveCount(2);
        result.Data.TotalCount.Should().Be(2);
        result.Data.Page.Should().Be(1);
        result.Data.PageSize.Should().Be(10);
    }

    [Fact]
    public async Task GetAllUsersAsync_WithSearchTerm_ShouldFilterUsers()
    {
        var users = new List<User>
        {
            new() { Id = "u1", Email = "john@a.com", FullName = "John Doe", Role = "User", CreatedAt = DateTime.UtcNow },
            new() { Id = "u2", Email = "jane@a.com", FullName = "Jane Smith", Role = "User", CreatedAt = DateTime.UtcNow }
        };
        _mockRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(users);

        var result = await _service.GetAllUsersAsync(1, 10, "john");

        result.IsSuccess.Should().BeTrue();
        result.Data.Users.Should().HaveCount(1);
        result.Data.Users[0].Email.Should().Be("john@a.com");
        result.Data.TotalCount.Should().Be(1);
    }

    [Fact]
    public async Task GetAllUsersAsync_WithPagination_ShouldReturnCorrectPage()
    {
        var users = Enumerable.Range(1, 15)
            .Select(i => new User
            {
                Id = $"u{i}",
                Email = $"user{i}@a.com",
                FullName = $"User {i}",
                Role = "User",
                CreatedAt = DateTime.UtcNow.AddDays(-i)
            })
            .ToList();
        _mockRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(users);

        var result = await _service.GetAllUsersAsync(2, 5);

        result.IsSuccess.Should().BeTrue();
        result.Data.Users.Should().HaveCount(5);
        result.Data.TotalCount.Should().Be(15);
        result.Data.Page.Should().Be(2);
        result.Data.PageSize.Should().Be(5);
    }

    [Fact]
    public async Task GetAllUsersAsync_WhenExceptionThrown_ShouldReturnFailure()
    {
        _mockRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>()))
                 .ThrowsAsync(new Exception("DB connection error"));

        var result = await _service.GetAllUsersAsync();

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Failed to fetch users");
    }

    // ── GetUserByIdAsync ──────────────────────────────────────────────────────

    [Fact]
    public async Task GetUserByIdAsync_WithValidId_ShouldReturnUser()
    {
        var user = new User { Id = "u1", Email = "a@a.com", FullName = "User A", Role = "User", IsActive = true };
        _mockRepo.Setup(x => x.GetByIdAsync("u1", It.IsAny<CancellationToken>())).ReturnsAsync(user);

        var result = await _service.GetUserByIdAsync("u1");

        result.IsSuccess.Should().BeTrue();
        result.Data.Email.Should().Be("a@a.com");
        result.Data.FullName.Should().Be("User A");
    }

    [Fact]
    public async Task GetUserByIdAsync_WithInvalidId_ShouldReturnFailure()
    {
        _mockRepo.Setup(x => x.GetByIdAsync("bad", It.IsAny<CancellationToken>())).ReturnsAsync((User?)null);

        var result = await _service.GetUserByIdAsync("bad");

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("not found");
    }

    [Fact]
    public async Task GetUserByIdAsync_WhenExceptionThrown_ShouldReturnFailure()
    {
        _mockRepo.Setup(x => x.GetByIdAsync("u1", It.IsAny<CancellationToken>()))
                 .ThrowsAsync(new Exception("DB error"));

        var result = await _service.GetUserByIdAsync("u1");

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Failed to fetch user");
    }

    // ── CreateUserAsync ───────────────────────────────────────────────────────

    [Theory]
    [InlineData("Admin")]
    [InlineData("User")]
    [InlineData("Analista")]
    public async Task CreateUserAsync_WithValidRole_ShouldCreateUser(string role)
    {
        var dto = new CreateUserDto
        {
            Email = "new@a.com",
            Password = "Pass1234!",
            FullName = "New User",
            Role = role,
            IsActive = true
        };
        _mockRepo.Setup(x => x.FindAsync(It.IsAny<Expression<Func<User, bool>>>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync(new List<User>());
        _mockRepo.Setup(x => x.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync((User u, CancellationToken _) => u);

        var result = await _service.CreateUserAsync(dto);

        result.IsSuccess.Should().BeTrue();
        result.Data.Email.Should().Be(dto.Email);
        result.Data.Role.Should().Be(role);
        _mockRepo.Verify(x => x.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateUserAsync_WithExistingEmail_ShouldReturnFailure()
    {
        var dto = new CreateUserDto
        {
            Email = "existing@a.com",
            Password = "Pass1234!",
            FullName = "User",
            Role = "User"
        };
        _mockRepo.Setup(x => x.FindAsync(It.IsAny<Expression<Func<User, bool>>>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync(new List<User> { new User() });

        var result = await _service.CreateUserAsync(dto);

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("already registered");
        _mockRepo.Verify(x => x.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Theory]
    [InlineData("InvalidRole")]
    [InlineData("SuperAdmin")]
    [InlineData("")]
    public async Task CreateUserAsync_WithInvalidRole_ShouldReturnFailure(string role)
    {
        var dto = new CreateUserDto
        {
            Email = "user@a.com",
            Password = "Pass1234!",
            FullName = "User",
            Role = role
        };
        _mockRepo.Setup(x => x.FindAsync(It.IsAny<Expression<Func<User, bool>>>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync(new List<User>());

        var result = await _service.CreateUserAsync(dto);

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Invalid role");
    }

    // ── UpdateUserAsync ───────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateUserAsync_WithValidData_ShouldUpdateUser()
    {
        var user = new User { Id = "u1", Email = "u@a.com", FullName = "Old Name", Role = "User" };
        var dto = new UpdateUserDto { FullName = "New Name", Role = "Admin", IsActive = true };
        _mockRepo.Setup(x => x.GetByIdAsync("u1", It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _mockRepo.Setup(x => x.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _service.UpdateUserAsync("u1", dto);

        result.IsSuccess.Should().BeTrue();
        result.Data.FullName.Should().Be("New Name");
        result.Data.Role.Should().Be("Admin");
        result.Data.IsActive.Should().BeTrue();
        _mockRepo.Verify(x => x.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateUserAsync_WithNonExistentUser_ShouldReturnFailure()
    {
        _mockRepo.Setup(x => x.GetByIdAsync("bad", It.IsAny<CancellationToken>())).ReturnsAsync((User?)null);

        var result = await _service.UpdateUserAsync("bad", new UpdateUserDto { FullName = "Name", Role = "User" });

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("not found");
    }

    [Theory]
    [InlineData("BadRole")]
    [InlineData("Manager")]
    public async Task UpdateUserAsync_WithInvalidRole_ShouldReturnFailure(string role)
    {
        var user = new User { Id = "u1", Email = "u@a.com", FullName = "Name", Role = "User" };
        _mockRepo.Setup(x => x.GetByIdAsync("u1", It.IsAny<CancellationToken>())).ReturnsAsync(user);

        var result = await _service.UpdateUserAsync("u1", new UpdateUserDto { FullName = "Name", Role = role });

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Invalid role");
    }

    // ── DeleteUserAsync ───────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteUserAsync_WithValidId_ShouldSucceed()
    {
        var user = new User { Id = "u1" };
        _mockRepo.Setup(x => x.GetByIdAsync("u1", It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _mockRepo.Setup(x => x.DeleteAsync("u1", It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _service.DeleteUserAsync("u1");

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().BeTrue();
        _mockRepo.Verify(x => x.DeleteAsync("u1", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteUserAsync_WithInvalidId_ShouldReturnFailure()
    {
        _mockRepo.Setup(x => x.GetByIdAsync("bad", It.IsAny<CancellationToken>())).ReturnsAsync((User?)null);

        var result = await _service.DeleteUserAsync("bad");

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("not found");
    }

    // ── ChangePasswordAsync ───────────────────────────────────────────────────

    [Fact]
    public async Task ChangePasswordAsync_WithValidUser_ShouldSucceed()
    {
        var user = new User { Id = "u1", Email = "u@a.com" };
        var dto = new ChangePasswordDto { UserId = "u1", NewPassword = "NewPass123!" };
        _mockRepo.Setup(x => x.GetByIdAsync("u1", It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _mockRepo.Setup(x => x.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _service.ChangePasswordAsync(dto);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().BeTrue();
        _mockRepo.Verify(x => x.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ChangePasswordAsync_WithInvalidUser_ShouldReturnFailure()
    {
        _mockRepo.Setup(x => x.GetByIdAsync("bad", It.IsAny<CancellationToken>())).ReturnsAsync((User?)null);

        var result = await _service.ChangePasswordAsync(new ChangePasswordDto { UserId = "bad", NewPassword = "Pass1!" });

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("not found");
    }
}
