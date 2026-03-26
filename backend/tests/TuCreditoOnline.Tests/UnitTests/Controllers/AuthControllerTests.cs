using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Security.Claims;
using TuCreditoOnline.API.Controllers;
using TuCreditoOnline.Application.Common.Models;
using TuCreditoOnline.Application.DTOs;
using TuCreditoOnline.Infrastructure.Repositories;
using TuCreditoOnline.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Hosting;

namespace TuCreditoOnline.Tests.UnitTests.Controllers;

public class AuthControllerTests
{
    private readonly Mock<AuthService> _mockAuthService;
    private readonly Mock<UserManagementService> _mockUserService;
    private readonly AuthController _controller;

    public AuthControllerTests()
    {
        _mockAuthService = new Mock<AuthService>((UserRepository)null!, (IConfiguration)null!);
        _mockUserService = new Mock<UserManagementService>((UserRepository)null!);
        var mockLogger = new Mock<ILogger<AuthController>>();
        var mockWebEnv = new Mock<IWebHostEnvironment>();
        mockWebEnv.Setup(e => e.EnvironmentName).Returns("Development");
        _controller = new AuthController(_mockAuthService.Object, _mockUserService.Object, mockWebEnv.Object, mockLogger.Object);
    }

    private void SetAnonymousUser()
    {
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
    }

    private void SetAuthenticatedUser(string role = "User")
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.Email, "user@test.com"),
            new(ClaimTypes.Role, role)
        };
        var identity = new ClaimsIdentity(claims, "test");
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
    }

    private static UserListDto EmptyUserList() =>
        new() { Users = new List<UserResponseDto>(), TotalCount = 0 };

    private static UserListDto NonEmptyUserList() =>
        new() { Users = new List<UserResponseDto> { new() { Id = "u1" } }, TotalCount = 1 };

    // ── Login ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_WhenSuccess_ShouldReturnOk()
    {
        var request = new LoginRequestDto { Email = "user@a.com", Password = "Pass1!" };
        var response = new LoginResponseDto { Token = "jwt-token", Email = "user@a.com" };
        _mockAuthService.Setup(x => x.LoginAsync(request)).ReturnsAsync(Result.Success(response));

        var result = await _controller.Login(request);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task Login_WhenInvalidCredentials_ShouldReturnUnauthorized()
    {
        var request = new LoginRequestDto { Email = "user@a.com", Password = "wrong" };
        _mockAuthService.Setup(x => x.LoginAsync(request))
                        .ReturnsAsync(Result.Failure<LoginResponseDto>("Invalid email or password"));

        var result = await _controller.Login(request);

        result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    // ── Register ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Register_WhenNoUsersExist_ShouldAllowAndReturnOk()
    {
        SetAnonymousUser();
        var request = new RegisterRequestDto { Email = "first@a.com", Password = "Pass1!", FullName = "First" };
        _mockUserService.Setup(x => x.GetAllUsersAsync(1, 1, null))
                        .ReturnsAsync(Result.Success(EmptyUserList()));
        _mockAuthService.Setup(x => x.RegisterAsync(request))
                        .ReturnsAsync(Result.Success(new AuthResponseDto { Token = "token" }));

        var result = await _controller.Register(request);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task Register_WhenNoUsersExist_AndServiceFails_ShouldReturnBadRequest()
    {
        SetAnonymousUser();
        var request = new RegisterRequestDto { Email = "bad@a.com", Password = "weak" };
        _mockUserService.Setup(x => x.GetAllUsersAsync(1, 1, null))
                        .ReturnsAsync(Result.Success(EmptyUserList()));
        _mockAuthService.Setup(x => x.RegisterAsync(request))
                        .ReturnsAsync(Result.Failure<AuthResponseDto>("Password must be at least 8 characters"));

        var result = await _controller.Register(request);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Register_WhenUsersExistAndNotAuthenticated_ShouldReturnUnauthorized()
    {
        SetAnonymousUser();
        var request = new RegisterRequestDto { Email = "new@a.com", Password = "Pass1!", FullName = "New" };
        _mockUserService.Setup(x => x.GetAllUsersAsync(1, 1, null))
                        .ReturnsAsync(Result.Success(NonEmptyUserList()));

        var result = await _controller.Register(request);

        result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task Register_WhenUsersExistAndAuthenticatedAsUser_ShouldReturnForbid()
    {
        SetAuthenticatedUser(role: "User");
        var request = new RegisterRequestDto { Email = "new@a.com", Password = "Pass1!", FullName = "New" };
        _mockUserService.Setup(x => x.GetAllUsersAsync(1, 1, null))
                        .ReturnsAsync(Result.Success(NonEmptyUserList()));

        var result = await _controller.Register(request);

        result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task Register_WhenUsersExistAndAuthenticatedAsAdmin_ShouldRegisterAndReturnOk()
    {
        SetAuthenticatedUser(role: "Admin");
        var request = new RegisterRequestDto { Email = "new@a.com", Password = "Pass1!", FullName = "New" };
        _mockUserService.Setup(x => x.GetAllUsersAsync(1, 1, null))
                        .ReturnsAsync(Result.Success(NonEmptyUserList()));
        _mockAuthService.Setup(x => x.RegisterAsync(request))
                        .ReturnsAsync(Result.Success(new AuthResponseDto { Token = "token" }));

        var result = await _controller.Register(request);

        result.Should().BeOfType<OkObjectResult>();
    }
}
