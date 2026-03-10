using Microsoft.AspNetCore.Mvc;
using TuCreditoOnline.Application.DTOs;
using TuCreditoOnline.Infrastructure.Services;

namespace TuCreditoOnline.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(AuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        _logger.LogInformation("Login attempt for {Email}", request.Email);

        var result = await _authService.LoginAsync(request);

        if (!result.IsSuccess)
        {
            _logger.LogWarning("Login failed for {Email}: {Error}", request.Email, result.Message);
            return Unauthorized(new { error = result.Message });
        }

        _logger.LogInformation("Login successful for {Email}", request.Email);
        return Ok(result.Data);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
    {
        _logger.LogInformation("Registration attempt for {Email}", request.Email);

        var result = await _authService.RegisterAsync(request);

        if (!result.IsSuccess)
        {
            _logger.LogWarning("Registration failed for {Email}: {Error}", request.Email, result.Message);
            return BadRequest(new { error = result.Message });
        }

        _logger.LogInformation("Registration successful for {Email}", request.Email);
        return Ok(result.Data);
    }
}
