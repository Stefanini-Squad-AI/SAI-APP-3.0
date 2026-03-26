using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using Moq;
using TuCreditoOnline.Application.Common.Models;
using TuCreditoOnline.Application.DTOs;
using Xunit;

namespace TuCreditoOnline.Tests.IntegrationTests.Controllers;

public class AuthControllerMockedTests : IClassFixture<MockedWebApplicationFactory>
{
    private readonly MockedWebApplicationFactory _factory;

    public AuthControllerMockedTests(MockedWebApplicationFactory factory) => _factory = factory;

    private HttpClient PublicClient() => _factory.CreateClient();

    private HttpClient AdminClient()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestAuthHandler.AdminToken);
        return client;
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_WithValidCredentials_Returns200()
    {
        var dto = new LoginResponseDto { Token = "tok", Email = "admin@test.com", Role = "Admin" };
        _factory.MockAuthService
            .Setup(s => s.LoginAsync(It.IsAny<LoginRequestDto>()))
            .ReturnsAsync(Result<LoginResponseDto>.Success(dto));

        var response = await PublicClient().PostAsJsonAsync("/api/auth/login",
            new LoginRequestDto { Email = "admin@test.com", Password = "Pass123!" });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_Returns401()
    {
        _factory.MockAuthService
            .Setup(s => s.LoginAsync(It.IsAny<LoginRequestDto>()))
            .ReturnsAsync(Result<LoginResponseDto>.Failure("Invalid credentials"));

        var response = await PublicClient().PostAsJsonAsync("/api/auth/login",
            new LoginRequestDto { Email = "wrong@test.com", Password = "bad" });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ── Register ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Register_WhenNoUsersExist_ReturnsSuccess()
    {
        // No existing users → hasUsers = false → open registration
        _factory.MockUserManagementService
            .Setup(s => s.GetAllUsersAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string?>()))
            .ReturnsAsync(Result<UserListDto>.Success(new UserListDto { TotalCount = 0 }));

        var responseDto = new AuthResponseDto
        {
            Token = "token",
            User = new UserDto { Email = "new@test.com", Role = "Admin" }
        };
        _factory.MockAuthService
            .Setup(s => s.RegisterAsync(It.IsAny<RegisterRequestDto>()))
            .ReturnsAsync(Result<AuthResponseDto>.Success(responseDto));

        var response = await AdminClient().PostAsJsonAsync("/api/auth/register",
            new RegisterRequestDto { Email = "new@test.com", Password = "Pass123!", FullName = "New Admin", Role = "Admin" });

        response.IsSuccessStatusCode.Should().BeTrue();
    }

    [Fact]
    public async Task Register_WhenServiceFails_Returns400()
    {
        _factory.MockUserManagementService
            .Setup(s => s.GetAllUsersAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string?>()))
            .ReturnsAsync(Result<UserListDto>.Success(new UserListDto { TotalCount = 0 }));

        _factory.MockAuthService
            .Setup(s => s.RegisterAsync(It.IsAny<RegisterRequestDto>()))
            .ReturnsAsync(Result<AuthResponseDto>.Failure("Email already exists"));

        var response = await AdminClient().PostAsJsonAsync("/api/auth/register",
            new RegisterRequestDto { Email = "dup@test.com", Password = "Pass123!", FullName = "Dup" });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
