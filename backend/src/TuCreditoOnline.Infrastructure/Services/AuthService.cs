using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BCryptNet = BCrypt.Net.BCrypt;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using TuCreditoOnline.Application.Common.Models;
using TuCreditoOnline.Application.DTOs;
using TuCreditoOnline.Domain.Entities;
using TuCreditoOnline.Infrastructure.Repositories;
using TuCreditoOnline.Infrastructure.Security;

namespace TuCreditoOnline.Infrastructure.Services;

public class AuthService
{
    private readonly UserRepository _userRepository;
    private readonly IConfiguration _configuration;

    public AuthService(UserRepository userRepository, IConfiguration configuration)
    {
        _userRepository = userRepository;
        _configuration = configuration;
    }

    public virtual async Task<Result<LoginResponseDto>> LoginAsync(LoginRequestDto request)
    {
        try
        {
            var emailValidation = DtoValidator.ValidateEmail(request.Email);
            if (!emailValidation.IsSuccess)
                return Result.Failure<LoginResponseDto>(emailValidation.Message);

            if (string.IsNullOrWhiteSpace(request.Password))
                return Result.Failure<LoginResponseDto>("Password is required");

            var user = await _userRepository.GetByEmailAsync(emailValidation.Data);

            if (user == null)
                return Result.Failure<LoginResponseDto>("Invalid email or password");

            if (!user.IsActive)
                return Result.Failure<LoginResponseDto>("User account is inactive");

            if (!VerifyPassword(request.Password, user.PasswordHash))
                return Result.Failure<LoginResponseDto>("Invalid email or password");

            var token = GenerateJwtToken(user);
            var expiresAt = DateTime.UtcNow.AddMinutes(GetJwtExpirationMinutes());

            user.LastLogin = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;
            await _userRepository.UpdateAsync(user);

            var response = new LoginResponseDto
            {
                Token = token,
                RefreshToken = GenerateRefreshToken(),
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role,
                ExpiresAt = expiresAt,
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FullName = user.FullName,
                    Role = user.Role
                }
            };

            return Result.Success(response);
        }
        catch (Exception ex)
        {
            return Result.Failure<LoginResponseDto>($"Login failed: {ex.Message}");
        }
    }

    public virtual async Task<Result<AuthResponseDto>> RegisterAsync(RegisterRequestDto request)
    {
        try
        {
            var emailValidation = DtoValidator.ValidateEmail(request.Email);
            if (!emailValidation.IsSuccess)
                return Result.Failure<AuthResponseDto>(emailValidation.Message);

            var passwordValidation = DtoValidator.ValidatePassword(request.Password);
            if (!passwordValidation.IsSuccess)
                return Result.Failure<AuthResponseDto>(passwordValidation.Message);

            var nameValidation = DtoValidator.ValidateRequiredString(request.FullName, "Full name", 100);
            if (!nameValidation.IsSuccess)
                return Result.Failure<AuthResponseDto>(nameValidation.Message);

            if (await _userRepository.EmailExistsAsync(emailValidation.Data))
                return Result.Failure<AuthResponseDto>("Email is already registered");

            var user = new User
            {
                Id = Guid.NewGuid().ToString(),
                Email = emailValidation.Data,
                PasswordHash = HashPassword(passwordValidation.Data),
                FullName = nameValidation.Data,
                Role = "User",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                LastLogin = DateTime.UtcNow
            };

            await _userRepository.AddAsync(user);

            var token = GenerateJwtToken(user);

            var response = new AuthResponseDto
            {
                Token = token,
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FullName = user.FullName,
                    Role = user.Role
                }
            };

            return Result.Success(response);
        }
        catch (Exception ex)
        {
            return Result.Failure<AuthResponseDto>($"Registration failed: {ex.Message}");
        }
    }

    private string GenerateJwtToken(User user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["Secret"];

        // Fall back to a random per-session secret — mirrors the behavior in Program.cs so
        // tokens signed here are always validated with the same key.
        if (string.IsNullOrEmpty(secretKey) || secretKey.Length < 32)
        {
            var randomFallback = _configuration["JwtSettings:RuntimeFallbackSecret"];
            if (string.IsNullOrEmpty(randomFallback))
                throw new InvalidOperationException("JwtSettings:Secret is not configured and no runtime fallback is available. Ensure Program.cs has set JwtSettings:RuntimeFallbackSecret before the first token is issued.");
            secretKey = randomFallback;
        }

        var issuer = jwtSettings["Issuer"] ?? "TuCreditoOnline";
        var audience = jwtSettings["Audience"] ?? "TuCreditoOnline.Client";
        var expirationMinutes = GetJwtExpirationMinutes();

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Name, user.FullName),
            // Tipo "role" alineado con JwtBearer TokenValidationParameters.RoleClaimType (Program.cs)
            new Claim("role", user.Role)
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>
    /// Solo si IntegrationTests:AllowRequestRoleInRegistration es true (appsettings.Testing.json)
    /// se respeta <see cref="RegisterRequestDto.Role"/>; en el resto de entornos el registro crea rol User.
    /// </summary>
    private string ResolveRegistrationRole(RegisterRequestDto request)
    {
        var r = string.IsNullOrWhiteSpace(request.Role) ? "User" : request.Role.Trim();
        var allowRoleFromRequest = string.Equals(
            _configuration["IntegrationTests:AllowRequestRoleInRegistration"],
            "true",
            StringComparison.OrdinalIgnoreCase);
        if (!allowRoleFromRequest)
            return "User";

        return r switch
        {
            "Admin" or "SuperAdmin" or "User" => r,
            _ => "User"
        };
    }

    private static string HashPassword(string password)
    {
        return BCryptNet.HashPassword(password);
    }

    private static bool VerifyPassword(string password, string hashedPassword)
    {
        return BCryptNet.Verify(password, hashedPassword);
    }

    private int GetJwtExpirationMinutes()
    {
        var expirationMinutes = _configuration.GetSection("JwtSettings")["ExpirationMinutes"];
        return int.TryParse(expirationMinutes, out var minutes) ? minutes : 60;
    }

    private static string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }
}
