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
    private readonly Mock<IConfiguration> _mockConfiguration;
    private readonly AuthService _authService;

    public AuthServiceTests()
    {
        _mockUserRepository = new Mock<UserRepository>();
        _mockConfiguration = new Mock<IConfiguration>();
        
        // Setup JWT configuration
        var jwtSection = new Mock<IConfigurationSection>();
        jwtSection.Setup(x => x["Secret"]).Returns("superSecretKeyForDevelopmentOnly1234567890");
        jwtSection.Setup(x => x["Issuer"]).Returns("TuCreditoOnline");
        jwtSection.Setup(x => x["Audience"]).Returns("TuCreditoOnlineUsers");
        jwtSection.Setup(x => x["ExpirationMinutes"]).Returns("60");
        jwtSection.Setup(x => x["RefreshTokenExpirationDays"]).Returns("7");
        
        _mockConfiguration.Setup(x => x.GetSection("JwtSettings")).Returns(jwtSection.Object);
        
        _authService = new AuthService(_mockUserRepository.Object, _mockConfiguration.Object);
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
        result.Message.Should().Contain("ya está registrado");
        
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

        // Hash password using SHA256 (same as AuthService)
        using var sha256 = System.Security.Cryptography.SHA256.Create();
        var hashedBytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes("Password123!"));
        var hashedPassword = Convert.ToBase64String(hashedBytes);

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
        result.Data.User.Email.Should().Be(loginDto.Email);
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
        result.Message.Should().ContainAny("incorrectos", "inválidas");
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

        // Hash correct password using SHA256
        using var sha256 = System.Security.Cryptography.SHA256.Create();
        var hashedBytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes("CorrectPassword123!"));
        var hashedPassword = Convert.ToBase64String(hashedBytes);

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
        result.Message.Should().ContainAny("incorrectos", "inválidas");
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

        // Hash password using SHA256
        using var sha256 = System.Security.Cryptography.SHA256.Create();
        var hashedBytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes("Password123!"));
        var hashedPassword = Convert.ToBase64String(hashedBytes);

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
        result.Message.Should().ContainAny("inactivo", "incorrectos");
    }

    [Theory]
    [InlineData("", "Password123!", "Email es requerido")]
    [InlineData("invalid-email", "Password123!", "Email no es válido")]
    [InlineData("user@example.com", "", "contraseña es requerida")]
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
        result.Message.Should().ContainAny(expectedError, expectedError.ToLower());
    }
}
