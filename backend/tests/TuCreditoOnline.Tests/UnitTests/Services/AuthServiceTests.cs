using Xunit;
using Moq;
using FluentAssertions;
using TuCreditoOnline.Infrastructure.Services;
using TuCreditoOnline.Infrastructure.Repositories;
using TuCreditoOnline.Domain.Entities;
using TuCreditoOnline.Application.DTOs;
using Microsoft.Extensions.Configuration;
using System.Linq.Expressions;
using TuCreditoOnline.Infrastructure.Persistence;

namespace TuCreditoOnline.Tests.UnitTests.Services;

public class AuthServiceTests
{
    private readonly Mock<UserRepository> _mockUserRepository;
    private readonly IConfiguration _configuration;
    private readonly AuthService _authService;

    public AuthServiceTests()
    {
        _mockUserRepository = new Mock<UserRepository>();
        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:Secret"] = "superSecretKeyForDevelopmentOnly1234567890",
                ["JwtSettings:Issuer"] = "TuCreditoOnline",
                ["JwtSettings:Audience"] = "TuCreditoOnlineUsers",
                ["JwtSettings:ExpirationMinutes"] = "60",
                ["JwtSettings:RefreshTokenExpirationDays"] = "7",
                ["IntegrationTests:AllowRequestRoleInRegistration"] = "false",
            })
            .Build();

        _authService = new AuthService(_mockUserRepository.Object, _configuration);
    }

    [Fact]
    public async Task RegisterAsync_WithValidData_ShouldCreateUser()
    {
        // Arrange
        var registerDto = new RegisterRequestDto
        {
            Email = "test@example.com",
            Password = "Password123!",
            FullName = "Test User",
            Role = "User"
        };

        _mockUserRepository
            .Setup(x => x.EmailExistsAsync(It.IsAny<string>()))
            .ReturnsAsync(false);

        var createdUser = new User
        {
            Id = Guid.NewGuid().ToString(),
            Email = registerDto.Email,
            FullName = registerDto.FullName,
            Role = registerDto.Role
        };

        _mockUserRepository
            .Setup(x => x.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User u, CancellationToken ct) => u);

        // Act
        var result = await _authService.RegisterAsync(registerDto);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data.User.Should().NotBeNull();
        result.Data.User.Email.Should().Be(registerDto.Email);
        result.Data.Token.Should().NotBeNullOrEmpty();
        
        _mockUserRepository.Verify(x => x.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RegisterAsync_WithExistingEmail_ShouldFail()
    {
        // Arrange
        var registerDto = new RegisterRequestDto
        {
            Email = "existing@example.com",
            Password = "Password123!",
            FullName = "Test User",
            Role = "User"
        };

        _mockUserRepository
            .Setup(x => x.EmailExistsAsync(It.IsAny<string>()))
            .ReturnsAsync(true);

        // Act
        var result = await _authService.RegisterAsync(registerDto);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("already registered");
        
        _mockUserRepository.Verify(x => x.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ShouldReturnToken()
    {
        // Arrange
        var loginDto = new LoginRequestDto
        {
            Email = "user@example.com",
            Password = "Password123!"
        };

        var hashedPassword = BCrypt.Net.BCrypt.HashPassword("Password123!");

        var user = new User
        {
            Id = "user-id-123",
            Email = "user@example.com",
            PasswordHash = hashedPassword,
            FullName = "Test User",
            Role = "User",
            IsActive = true
        };

        _mockUserRepository
            .Setup(x => x.GetByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync(user);

        _mockUserRepository
            .Setup(x => x.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _authService.LoginAsync(loginDto);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data.Token.Should().NotBeNullOrEmpty();
        result.Data.RefreshToken.Should().NotBeNullOrEmpty();
        result.Data.User.Email.Should().Be(loginDto.Email.Trim().ToLowerInvariant());
    }

    [Fact]
    public async Task LoginAsync_WithInvalidEmail_ShouldFail()
    {
        // Arrange
        var loginDto = new LoginRequestDto
        {
            Email = "nonexistent@example.com",
            Password = "Password123!"
        };

        _mockUserRepository
            .Setup(x => x.GetByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _authService.LoginAsync(loginDto);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Invalid email or password");
    }

    [Fact]
    public async Task LoginAsync_WithInvalidPassword_ShouldFail()
    {
        // Arrange
        var loginDto = new LoginRequestDto
        {
            Email = "user@example.com",
            Password = "WrongPassword!"
        };

        var hashedPassword = BCrypt.Net.BCrypt.HashPassword("CorrectPassword123!");

        var user = new User
        {
            Email = "user@example.com",
            PasswordHash = hashedPassword,
            IsActive = true
        };

        _mockUserRepository
            .Setup(x => x.GetByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync(user);

        // Act
        var result = await _authService.LoginAsync(loginDto);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Invalid email or password");
    }

    [Fact]
    public async Task LoginAsync_WithInactiveUser_ShouldFail()
    {
        // Arrange
        var loginDto = new LoginRequestDto
        {
            Email = "user@example.com",
            Password = "Password123!"
        };

        var hashedPassword = BCrypt.Net.BCrypt.HashPassword("Password123!");

        var user = new User
        {
            Email = "user@example.com",
            PasswordHash = hashedPassword,
            IsActive = false
        };

        _mockUserRepository
            .Setup(x => x.GetByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync(user);

        // Act
        var result = await _authService.LoginAsync(loginDto);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("inactive");
    }

    [Theory]
    [InlineData("", "Password123!", "Email is required")]
    [InlineData("invalid-email", "Password123!", "Email is not valid")]
    [InlineData("user@example.com", "", "Password is required")]
    public async Task LoginAsync_WithInvalidInput_ShouldFail(string email, string password, string expectedError)
    {
        // Arrange
        var loginDto = new LoginRequestDto
        {
            Email = email,
            Password = password
        };

        // Act
        var result = await _authService.LoginAsync(loginDto);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain(expectedError);
    }
}
