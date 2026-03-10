using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuCreditoOnline.Application.DTOs;
using TuCreditoOnline.Infrastructure.Services;

namespace TuCreditoOnline.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class UsersController : ControllerBase
{
    private readonly UserManagementService _userManagementService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(UserManagementService userManagementService, ILogger<UsersController> logger)
    {
        _userManagementService = userManagementService;
        _logger = logger;
    }

    /// <summary>
    /// Get all users with pagination and optional search
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAllUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null)
    {
        _logger.LogInformation("Fetching users - Page: {Page}, PageSize: {PageSize}, Search: {Search}", page, pageSize, search);
        var result = await _userManagementService.GetAllUsersAsync(page, pageSize, search);

        if (!result.IsSuccess)
        {
            return StatusCode(500, new { error = result.Message });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Get user by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetUserById(string id)
    {
        _logger.LogInformation("Fetching user with ID: {Id}", id);
        var result = await _userManagementService.GetUserByIdAsync(id);

        if (!result.IsSuccess)
        {
            return NotFound(new { error = result.Message });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Create a new user
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
    {
        _logger.LogInformation("Creating new user with email: {Email}", dto.Email);
        var result = await _userManagementService.CreateUserAsync(dto);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Message });
        }

        return CreatedAtAction(nameof(GetUserById), new { id = result.Data?.Id }, result.Data);
    }

    /// <summary>
    /// Update an existing user
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserDto dto)
    {
        _logger.LogInformation("Updating user with ID: {Id}", id);
        var result = await _userManagementService.UpdateUserAsync(id, dto);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Message });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Delete a user
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        _logger.LogInformation("Deleting user with ID: {Id}", id);
        var result = await _userManagementService.DeleteUserAsync(id);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Message });
        }

        return Ok(new { message = "User deleted successfully" });
    }

    /// <summary>
    /// Change user password
    /// </summary>
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        _logger.LogInformation("Cambiando contraseña para usuario con ID: {UserId}", dto.UserId);
        var result = await _userManagementService.ChangePasswordAsync(dto);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Message });
        }

        return Ok(new { message = "Password updated successfully" });
    }
}
