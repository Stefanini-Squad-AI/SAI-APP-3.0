using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Moq;
using TuCreditoOnline.Application.DTOs;
using TuCreditoOnline.Domain.Entities;
using TuCreditoOnline.Infrastructure.Repositories;
using TuCreditoOnline.Infrastructure.Services;
using Xunit;
using BCryptNet = BCrypt.Net.BCrypt;

namespace TuCreditoOnline.Tests.IntegrationTests.Services;

/// <summary>
/// Integration-layer tests for AuthService.
/// Uses mocked UserRepository + real IConfiguration/BCrypt.
/// </summary>
public class AuthServiceIntegrationTests
{
    private readonly Mock<UserRepository> _userRepo = new();
    private readonly IConfiguration _config;
    private readonly AuthService _svc;

    private const string ValidPassword = "SecurePass@1";

    public AuthServiceIntegrationTests()
    {
        _config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:Secret"] = "TestSecretKeyForIntegrationTestsThatIs64CharsLong!!",
                ["JwtSettings:Issuer"] = "TuCreditoOnline",
                ["JwtSettings:Audience"] = "TuCreditoOnlineUsers",
                ["JwtSettings:ExpirationMinutes"] = "60",
                ["IntegrationTests:AllowRequestRoleInRegistration"] = "true",
            })
            .Build();

        _svc = new AuthService(_userRepo.Object, _config);
    }

    private static User ActiveUser(string id = "u1") => new()
    {
        Id = id,
        Email = "admin@test.com",
        PasswordHash = BCryptNet.HashPassword(ValidPassword),
        FullName = "Test Admin",
        Role = "Admin",
        IsActive = true,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow,
        LastLogin = DateTime.UtcNow,
    };

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║  LoginAsync                                                             ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    [Fact]
    public async Task Login_ValidCredentials_ReturnsToken()
    {
        var user = ActiveUser();
        _userRepo.Setup(r => r.GetByEmailAsync(user.Email)).ReturnsAsync(user);
        _userRepo.Setup(r => r.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
                 .Returns(Task.CompletedTask);

        var result = await _svc.LoginAsync(new LoginRequestDto { Email = user.Email, Password = ValidPassword });

        result.IsSuccess.Should().BeTrue();
        result.Data.Token.Should().NotBeNullOrEmpty();
        result.Data.Email.Should().Be(user.Email);
    }

    [Fact]
    public async Task Login_InvalidEmailFormat_ReturnsFailure()
    {
        var result = await _svc.LoginAsync(new LoginRequestDto { Email = "not-an-email", Password = ValidPassword });

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Login_EmptyPassword_ReturnsFailure()
    {
        var result = await _svc.LoginAsync(new LoginRequestDto { Email = "admin@test.com", Password = "" });

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Login_UserNotFound_ReturnsFailure()
    {
        _userRepo.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);

        var result = await _svc.LoginAsync(new LoginRequestDto { Email = "nobody@test.com", Password = ValidPassword });

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Login_InactiveUser_ReturnsFailure()
    {
        var user = ActiveUser();
        user.IsActive = false;
        _userRepo.Setup(r => r.GetByEmailAsync(user.Email)).ReturnsAsync(user);

        var result = await _svc.LoginAsync(new LoginRequestDto { Email = user.Email, Password = ValidPassword });

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("inactive");
    }

    [Fact]
    public async Task Login_WrongPassword_ReturnsFailure()
    {
        var user = ActiveUser();
        _userRepo.Setup(r => r.GetByEmailAsync(user.Email)).ReturnsAsync(user);

        var result = await _svc.LoginAsync(new LoginRequestDto { Email = user.Email, Password = "WrongPass999!" });

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Login_WhenRepoThrows_ReturnsFailure()
    {
        _userRepo.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ThrowsAsync(new Exception("DB error"));

        var result = await _svc.LoginAsync(new LoginRequestDto { Email = "admin@test.com", Password = ValidPassword });

        result.IsSuccess.Should().BeFalse();
    }

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║  RegisterAsync                                                          ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    [Fact]
    public async Task Register_ValidData_ReturnsToken()
    {
        _userRepo.Setup(r => r.EmailExistsAsync(It.IsAny<string>())).ReturnsAsync(false);
        _userRepo.Setup(r => r.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync((User u, CancellationToken _) => u);

        var result = await _svc.RegisterAsync(new RegisterRequestDto
        {
            Email = "new@test.com",
            Password = ValidPassword,
            FullName = "New User",
            Role = "Admin"
        });

        result.IsSuccess.Should().BeTrue();
        result.Data.Token.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Register_InvalidEmailFormat_ReturnsFailure()
    {
        var result = await _svc.RegisterAsync(new RegisterRequestDto
        {
            Email = "bad-email",
            Password = ValidPassword,
            FullName = "User"
        });

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Register_WeakPassword_ReturnsFailure()
    {
        var result = await _svc.RegisterAsync(new RegisterRequestDto
        {
            Email = "test@test.com",
            Password = "weak",
            FullName = "User"
        });

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Register_EmptyName_ReturnsFailure()
    {
        var result = await _svc.RegisterAsync(new RegisterRequestDto
        {
            Email = "test@test.com",
            Password = ValidPassword,
            FullName = ""
        });

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Register_EmailAlreadyExists_ReturnsFailure()
    {
        _userRepo.Setup(r => r.EmailExistsAsync(It.IsAny<string>())).ReturnsAsync(true);

        var result = await _svc.RegisterAsync(new RegisterRequestDto
        {
            Email = "dup@test.com",
            Password = ValidPassword,
            FullName = "Dup User"
        });

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("already registered");
    }

    [Fact]
    public async Task Register_WhenRepoThrows_ReturnsFailure()
    {
        _userRepo.Setup(r => r.EmailExistsAsync(It.IsAny<string>())).ThrowsAsync(new Exception("DB error"));

        var result = await _svc.RegisterAsync(new RegisterRequestDto
        {
            Email = "error@test.com",
            Password = ValidPassword,
            FullName = "Error User"
        });

        result.IsSuccess.Should().BeFalse();
    }
}
