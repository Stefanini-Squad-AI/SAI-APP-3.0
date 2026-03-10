using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuCreditoOnline.Application.DTOs;
using TuCreditoOnline.Infrastructure.Services;

namespace TuCreditoOnline.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CreditTypesController : ControllerBase
{
    private readonly CreditTypeService _creditTypeService;
    private readonly ILogger<CreditTypesController> _logger;

    public CreditTypesController(CreditTypeService creditTypeService, ILogger<CreditTypesController> logger)
    {
        _creditTypeService = creditTypeService;
        _logger = logger;
    }

    /// <summary>
    /// Get all credit types (public endpoint for calculator)
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll([FromQuery] bool? isActive = null)
    {
        _logger.LogInformation("Fetching credit types");
        var result = await _creditTypeService.GetAllAsync(isActive);

        if (!result.IsSuccess)
        {
            return StatusCode(500, new { error = result.Message });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Get credit type by ID
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(string id)
    {
        _logger.LogInformation("Fetching credit type {Id}", id);
        var result = await _creditTypeService.GetByIdAsync(id);

        if (!result.IsSuccess)
        {
            return NotFound(new { error = result.Message });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Create a new credit type (Admin only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> Create([FromBody] CreateCreditTypeDto dto)
    {
        _logger.LogInformation("Creating credit type: {Name}", dto.Name);
        var result = await _creditTypeService.CreateAsync(dto);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Message });
        }

        return CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result.Data);
    }

    /// <summary>
    /// Update an existing credit type (Admin only)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateCreditTypeDto dto)
    {
        _logger.LogInformation("Updating credit type {Id}", id);
        var result = await _creditTypeService.UpdateAsync(id, dto);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Message });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Delete a credit type (Admin only)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> Delete(string id)
    {
        _logger.LogInformation("Deleting credit type {Id}", id);
        var result = await _creditTypeService.DeleteAsync(id);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Message });
        }

        return Ok(new { message = "Credit type deleted successfully" });
    }
}
