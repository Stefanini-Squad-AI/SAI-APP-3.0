using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuCreditoOnline.Application.DTOs;
using TuCreditoOnline.Infrastructure.Services;

namespace TuCreditoOnline.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServicesController : ControllerBase
{
    private readonly ServiceManagementService _serviceManagementService;
    private readonly ILogger<ServicesController> _logger;

    public ServicesController(ServiceManagementService serviceManagementService, ILogger<ServicesController> logger)
    {
        _serviceManagementService = serviceManagementService;
        _logger = logger;
    }

    /// <summary>
    /// Get all services (public endpoint for landing page)
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll([FromQuery] bool? isActive = null)
    {
        _logger.LogInformation("Fetching services");
        var result = await _serviceManagementService.GetAllAsync(isActive);

        if (!result.IsSuccess)
        {
            return StatusCode(500, new { error = result.Message });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Get service by ID
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(string id)
    {
        _logger.LogInformation("Fetching service with ID: {Id}", id);
        var result = await _serviceManagementService.GetByIdAsync(id);

        if (!result.IsSuccess)
        {
            return NotFound(new { error = result.Message });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Create a new service (Admin only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> Create([FromBody] CreateServiceDto dto)
    {
        _logger.LogInformation("Creating new service: {Title}", dto.Title);
        var result = await _serviceManagementService.CreateAsync(dto);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Message });
        }

        return CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result.Data);
    }

    /// <summary>
    /// Update an existing service (Admin only)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateServiceDto dto)
    {
        _logger.LogInformation("Updating service with ID: {Id}", id);
        var result = await _serviceManagementService.UpdateAsync(id, dto);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Message });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Delete a service (Admin only)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> Delete(string id)
    {
        _logger.LogInformation("Deleting service with ID: {Id}", id);
        var result = await _serviceManagementService.DeleteAsync(id);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Message });
        }

        return Ok(new { message = "Service deleted successfully" });
    }
}
