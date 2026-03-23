using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TuCreditoOnline.API.Controllers;
using TuCreditoOnline.Application.Common.Models;
using TuCreditoOnline.Application.DTOs;
using TuCreditoOnline.Infrastructure.Repositories;
using TuCreditoOnline.Infrastructure.Services;

namespace TuCreditoOnline.Tests.UnitTests.Controllers;

public class UsersControllerTests
{
    private readonly Mock<UserManagementService> _mockService;
    private readonly UsersController _controller;

    public UsersControllerTests()
    {
        _mockService = new Mock<UserManagementService>((UserRepository)null!);
        var mockLogger = new Mock<ILogger<UsersController>>();
        _controller = new UsersController(_mockService.Object, mockLogger.Object);
    }

    private static UserResponseDto MakeUserDto(string id = "u1") => new()
    {
        Id = id, Email = "user@a.com", FullName = "Test User", Role = "User", IsActive = true
    };

    // ── GetAllUsers ───────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAllUsers_WhenSuccess_ShouldReturnOk()
    {
        var listDto = new UserListDto { Users = new List<UserResponseDto> { MakeUserDto() }, TotalCount = 1 };
        _mockService.Setup(x => x.GetAllUsersAsync(1, 10, null))
                    .ReturnsAsync(Result.Success(listDto));

        var result = await _controller.GetAllUsers();

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetAllUsers_WhenFailure_ShouldReturn500()
    {
        _mockService.Setup(x => x.GetAllUsersAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string?>()))
                    .ReturnsAsync(Result.Failure<UserListDto>("DB error"));

        var result = await _controller.GetAllUsers();

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(500);
    }

    // ── GetUserById ───────────────────────────────────────────────────────────

    [Fact]
    public async Task GetUserById_WhenFound_ShouldReturnOk()
    {
        _mockService.Setup(x => x.GetUserByIdAsync("u1"))
                    .ReturnsAsync(Result.Success(MakeUserDto()));

        var result = await _controller.GetUserById("u1");

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetUserById_WhenNotFound_ShouldReturnNotFound()
    {
        _mockService.Setup(x => x.GetUserByIdAsync("bad"))
                    .ReturnsAsync(Result.Failure<UserResponseDto>("User not found"));

        var result = await _controller.GetUserById("bad");

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    // ── CreateUser ────────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateUser_WhenSuccess_ShouldReturnCreated()
    {
        var dto = new CreateUserDto { Email = "new@a.com", Password = "Pass1!", FullName = "New", Role = "User" };
        _mockService.Setup(x => x.CreateUserAsync(dto))
                    .ReturnsAsync(Result.Success(MakeUserDto("u2")));

        var result = await _controller.CreateUser(dto);

        result.Should().BeOfType<CreatedAtActionResult>();
    }

    [Fact]
    public async Task CreateUser_WhenFailure_ShouldReturnBadRequest()
    {
        var dto = new CreateUserDto { Email = "dup@a.com" };
        _mockService.Setup(x => x.CreateUserAsync(dto))
                    .ReturnsAsync(Result.Failure<UserResponseDto>("Email already registered"));

        var result = await _controller.CreateUser(dto);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ── UpdateUser ────────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateUser_WhenSuccess_ShouldReturnOk()
    {
        var dto = new UpdateUserDto { FullName = "Updated", Role = "Admin", IsActive = true };
        _mockService.Setup(x => x.UpdateUserAsync("u1", dto))
                    .ReturnsAsync(Result.Success(MakeUserDto()));

        var result = await _controller.UpdateUser("u1", dto);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task UpdateUser_WhenFailure_ShouldReturnBadRequest()
    {
        var dto = new UpdateUserDto { Role = "BadRole" };
        _mockService.Setup(x => x.UpdateUserAsync("bad", dto))
                    .ReturnsAsync(Result.Failure<UserResponseDto>("Invalid role"));

        var result = await _controller.UpdateUser("bad", dto);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ── DeleteUser ────────────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteUser_WhenSuccess_ShouldReturnOk()
    {
        _mockService.Setup(x => x.DeleteUserAsync("u1"))
                    .ReturnsAsync(Result.Success(true));

        var result = await _controller.DeleteUser("u1");

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task DeleteUser_WhenNotFound_ShouldReturnBadRequest()
    {
        _mockService.Setup(x => x.DeleteUserAsync("bad"))
                    .ReturnsAsync(Result.Failure<bool>("User not found"));

        var result = await _controller.DeleteUser("bad");

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ── ChangePassword ────────────────────────────────────────────────────────

    [Fact]
    public async Task ChangePassword_WhenSuccess_ShouldReturnOk()
    {
        var dto = new ChangePasswordDto { UserId = "u1", NewPassword = "NewPass1!" };
        _mockService.Setup(x => x.ChangePasswordAsync(dto))
                    .ReturnsAsync(Result.Success(true));

        var result = await _controller.ChangePassword(dto);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task ChangePassword_WhenFailure_ShouldReturnBadRequest()
    {
        var dto = new ChangePasswordDto { UserId = "bad" };
        _mockService.Setup(x => x.ChangePasswordAsync(dto))
                    .ReturnsAsync(Result.Failure<bool>("User not found"));

        var result = await _controller.ChangePassword(dto);

        result.Should().BeOfType<BadRequestObjectResult>();
    }
}
