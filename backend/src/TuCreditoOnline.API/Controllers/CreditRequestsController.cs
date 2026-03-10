using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuCreditoOnline.Application.DTOs;
using TuCreditoOnline.Infrastructure.Services;

namespace TuCreditoOnline.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CreditRequestsController : ControllerBase
{
    private readonly CreditRequestService _service;
    private readonly ILogger<CreditRequestsController> _logger;

    public CreditRequestsController(CreditRequestService service, ILogger<CreditRequestsController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> CreateCreditRequest([FromBody] CreateCreditRequestDto dto)
    {
        _logger.LogInformation("Creating credit request for {Email}", dto.Email);

        var result = await _service.CreateCreditRequestAsync(dto);

        if (!result.IsSuccess)
        {
            _logger.LogWarning("Error creating request: {Message}", result.Message);
            return BadRequest(new { error = result.Message });
        }

        _logger.LogInformation("Request created successfully with ID: {Id}", result.Data.Id);
        
        return CreatedAtAction(
            nameof(GetCreditRequestById),
            new { id = result.Data.Id },
            result.Data
        );
    }

    [HttpGet]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> GetAllCreditRequests()
    {
        var result = await _service.GetAllCreditRequestsAsync();

        if (!result.IsSuccess)
        {
            return StatusCode(500, new { error = result.Message });
        }

        return Ok(result.Data);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> GetCreditRequestById(string id)
    {
        var result = await _service.GetCreditRequestByIdAsync(id);

        if (!result.IsSuccess)
        {
            return NotFound(new { error = result.Message });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Get credit requests by status
    /// </summary>
    [HttpGet("status/{status}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> GetCreditRequestsByStatus(string status)
    {
        _logger.LogInformation("Fetching requests with status: {Status}", status);
        var result = await _service.GetCreditRequestsByStatusAsync(status);

        if (!result.IsSuccess)
        {
            return StatusCode(500, new { error = result.Message });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Update credit request status (Approve or Reject)
    /// </summary>
    [HttpPatch("{id}/status")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> UpdateCreditRequestStatus(string id, [FromBody] UpdateCreditRequestStatusDto dto)
    {
        _logger.LogInformation("Updating request {Id} status to {Status}", id, dto.Status);

        var result = await _service.UpdateCreditRequestStatusAsync(id, dto);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Message });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Approve a credit request
    /// </summary>
    [HttpPost("{id}/approve")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> ApproveCreditRequest(string id, [FromBody] UpdateCreditRequestStatusDto? dto)
    {
        _logger.LogInformation("Approving request {Id}", id);

        var updateDto = dto ?? new UpdateCreditRequestStatusDto();
        updateDto.Status = "Approved";

        var result = await _service.UpdateCreditRequestStatusAsync(id, updateDto);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Message });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Reject a credit request
    /// </summary>
    [HttpPost("{id}/reject")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> RejectCreditRequest(string id, [FromBody] UpdateCreditRequestStatusDto? dto)
    {
        _logger.LogInformation("Rejecting request {Id}", id);

        var updateDto = dto ?? new UpdateCreditRequestStatusDto();
        updateDto.Status = "Rejected";

        var result = await _service.UpdateCreditRequestStatusAsync(id, updateDto);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Message });
        }

        return Ok(result.Data);
    }
}
