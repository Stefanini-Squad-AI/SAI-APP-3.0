using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using TuCreditoOnline.Application.DTOs;
using TuCreditoOnline.Infrastructure.Services;

namespace TuCreditoOnline.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly UserManagementService _userManagementService;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        AuthService authService,
        UserManagementService userManagementService,
        IWebHostEnvironment environment,
        ILogger<AuthController> logger)
    {
        _authService = authService;
        _userManagementService = userManagementService;
        _environment = environment;
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

    /// <summary>
    /// Creates a new user account.
    /// Open only when no users exist yet (first-time setup).
    /// Once users exist, requires Admin or SuperAdmin role.
    /// </summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
    {
        _logger.LogInformation("Registration attempt for {Email}", request.Email);

        // En entorno Testing (WebApplicationFactory) el registro permanece abierto para pruebas de integración.
        // En Development/Staging/Production: si ya hay usuarios, solo Admin/SuperAdmin puede registrar más cuentas.
        var usersResult = await _userManagementService.GetAllUsersAsync(1, 1, null);
        bool hasUsers = usersResult.IsSuccess && (usersResult.Data?.TotalCount ?? 0) > 0;

        if (!_environment.IsEnvironment("Testing") && hasUsers)
        {
            if (!User.Identity?.IsAuthenticated ?? true)
            {
                return Unauthorized(new { error = "Authentication required to register new users" });
            }
            if (!User.IsInRole("Admin") && !User.IsInRole("SuperAdmin"))
            {
                return Forbid();
            }
        }

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
