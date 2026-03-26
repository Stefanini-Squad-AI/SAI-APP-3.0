using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using Moq;
using TuCreditoOnline.Application.Common.Models;
using TuCreditoOnline.Application.DTOs;
using Xunit;

namespace TuCreditoOnline.Tests.IntegrationTests.Controllers;

[Collection("MockedIntegration")]
public class UsersControllerMockedTests : IClassFixture<MockedWebApplicationFactory>
{
    private readonly MockedWebApplicationFactory _factory;

    public UsersControllerMockedTests(MockedWebApplicationFactory factory)
        => _factory = factory;

    private HttpClient AdminClient()
    {
        var c = _factory.CreateClient();
        c.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestAuthHandler.AdminToken);
        return c;
    }

    private static UserResponseDto MakeUserDto(string id = "u1") => new()
    {
        Id = id, Email = "user@test.com", FullName = "Test User",
        Role = "Admin", IsActive = true, CreatedAt = DateTime.UtcNow
    };

    // ── GetAllUsers ───────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAllUsers_ReturnsOk()
    {
        var list = new UserListDto
        {
            Users = new List<UserResponseDto> { MakeUserDto() },
            TotalCount = 1, Page = 1, PageSize = 10
        };
        _factory.MockUserManagementService
            .Setup(s => s.GetAllUsersAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string?>()))
            .ReturnsAsync(Result<UserListDto>.Success(list));

        var resp = await AdminClient().GetAsync("/api/users");

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAllUsers_WhenFails_Returns500()
    {
        _factory.MockUserManagementService
            .Setup(s => s.GetAllUsersAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string?>()))
            .ReturnsAsync(Result<UserListDto>.Failure("DB error"));

        var resp = await AdminClient().GetAsync("/api/users");

        resp.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
    }

    // ── GetUserById ───────────────────────────────────────────────────────────

    [Fact]
    public async Task GetUserById_WhenFound_ReturnsOk()
    {
        _factory.MockUserManagementService
            .Setup(s => s.GetUserByIdAsync("u1"))
            .ReturnsAsync(Result<UserResponseDto>.Success(MakeUserDto()));

        var resp = await AdminClient().GetAsync("/api/users/u1");

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetUserById_WhenNotFound_ReturnsNotFound()
    {
        _factory.MockUserManagementService
            .Setup(s => s.GetUserByIdAsync("none"))
            .ReturnsAsync(Result<UserResponseDto>.Failure("Not found"));

        var resp = await AdminClient().GetAsync("/api/users/none");

        resp.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── CreateUser ────────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateUser_WhenSuccess_ReturnsCreated()
    {
        _factory.MockUserManagementService
            .Setup(s => s.CreateUserAsync(It.IsAny<CreateUserDto>()))
            .ReturnsAsync(Result<UserResponseDto>.Success(MakeUserDto()));

        var body = new CreateUserDto
        {
            Email = "new@test.com", Password = "Pass123!@#",
            FullName = "New User", Role = "Admin", IsActive = true
        };
        var resp = await AdminClient().PostAsJsonAsync("/api/users", body);

        resp.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task CreateUser_WhenFails_ReturnsBadRequest()
    {
        _factory.MockUserManagementService
            .Setup(s => s.CreateUserAsync(It.IsAny<CreateUserDto>()))
            .ReturnsAsync(Result<UserResponseDto>.Failure("Email already exists"));

        var body = new CreateUserDto
        {
            Email = "dup@test.com", Password = "Pass123!@#",
            FullName = "Dup", Role = "Admin", IsActive = true
        };
        var resp = await AdminClient().PostAsJsonAsync("/api/users", body);

        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── UpdateUser ────────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateUser_WhenSuccess_ReturnsOk()
    {
        _factory.MockUserManagementService
            .Setup(s => s.UpdateUserAsync("u1", It.IsAny<UpdateUserDto>()))
            .ReturnsAsync(Result<UserResponseDto>.Success(MakeUserDto()));

        var body = new UpdateUserDto { FullName = "Updated", Role = "Admin", IsActive = true };
        var resp = await AdminClient().PutAsJsonAsync("/api/users/u1", body);

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task UpdateUser_WhenFails_ReturnsBadRequest()
    {
        _factory.MockUserManagementService
            .Setup(s => s.UpdateUserAsync("none", It.IsAny<UpdateUserDto>()))
            .ReturnsAsync(Result<UserResponseDto>.Failure("Not found"));

        var body = new UpdateUserDto { FullName = "X", Role = "Admin", IsActive = true };
        var resp = await AdminClient().PutAsJsonAsync("/api/users/none", body);

        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── DeleteUser ────────────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteUser_WhenSuccess_ReturnsOk()
    {
        _factory.MockUserManagementService
            .Setup(s => s.DeleteUserAsync("u1"))
            .ReturnsAsync(Result<bool>.Success(true));

        var resp = await AdminClient().DeleteAsync("/api/users/u1");

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task DeleteUser_WhenFails_ReturnsBadRequest()
    {
        _factory.MockUserManagementService
            .Setup(s => s.DeleteUserAsync("none"))
            .ReturnsAsync(Result<bool>.Failure("Not found"));

        var resp = await AdminClient().DeleteAsync("/api/users/none");

        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── ChangePassword ────────────────────────────────────────────────────────

    [Fact]
    public async Task ChangePassword_WhenSuccess_ReturnsOk()
    {
        _factory.MockUserManagementService
            .Setup(s => s.ChangePasswordAsync(It.IsAny<ChangePasswordDto>()))
            .ReturnsAsync(Result<bool>.Success(true));

        var body = new ChangePasswordDto { UserId = "u1", NewPassword = "NewPass123!@#" };
        var resp = await AdminClient().PostAsJsonAsync("/api/users/change-password", body);

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ChangePassword_WhenFails_ReturnsBadRequest()
    {
        _factory.MockUserManagementService
            .Setup(s => s.ChangePasswordAsync(It.IsAny<ChangePasswordDto>()))
            .ReturnsAsync(Result<bool>.Failure("User not found"));

        var body = new ChangePasswordDto { UserId = "none", NewPassword = "NewPass123!@#" };
        var resp = await AdminClient().PostAsJsonAsync("/api/users/change-password", body);

        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
