using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TuCreditoOnline.Application.DTOs;
using TuCreditoOnline.Infrastructure.Services;

namespace TuCreditoOnline.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContactMessagesController : ControllerBase
{
    private readonly ContactMessageService _contactMessageService;
    private readonly ILogger<ContactMessagesController> _logger;

    public ContactMessagesController(
        ContactMessageService contactMessageService,
        ILogger<ContactMessagesController> logger)
    {
        _contactMessageService = contactMessageService;
        _logger = logger;
    }

    /// <summary>
    /// Creates a new contact message (public endpoint)
    /// </summary>
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create([FromBody] CreateContactMessageDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        _logger.LogInformation("Creating contact message from {Email}", dto.Email);
        var result = await _contactMessageService.CreateAsync(dto);

        if (!result.IsSuccess)
        {
            return StatusCode(500, new { error = result.Message });
        }

        return Ok(new 
        { 
            message = "Message sent successfully. We will get back to you soon.",
            data = result.Data 
        });
    }

    /// <summary>
    /// Returns all messages (Admin only)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> GetAll([FromQuery] int? status = null)
    {
        _logger.LogInformation("Fetching contact messages. Status filter: {Status}", status);
        var result = await _contactMessageService.GetAllAsync(status);

        if (!result.IsSuccess)
        {
            return StatusCode(500, new { error = result.Message });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Returns a message by ID (Admin only)
    /// </summary>
    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> GetById(string id)
    {
        _logger.LogInformation("Fetching message {MessageId}", id);
        var result = await _contactMessageService.GetByIdAsync(id);

        if (!result.IsSuccess)
        {
            return NotFound(new { error = result.Message });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Returns pending messages (New or InProgress)
    /// </summary>
    [HttpGet("pending")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> GetPending()
    {
        _logger.LogInformation("Fetching pending messages");
        var result = await _contactMessageService.GetPendingMessagesAsync();

        if (!result.IsSuccess)
        {
            return StatusCode(500, new { error = result.Message });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Returns message statistics
    /// </summary>
    [HttpGet("stats")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> GetStats()
    {
        _logger.LogInformation("Retrieving message statistics");
        var result = await _contactMessageService.GetStatsAsync();

        if (!result.IsSuccess)
        {
            return StatusCode(500, new { error = result.Message });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Updates the status of a message
    /// </summary>
    [HttpPatch("{id}/status")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateContactMessageStatusDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var adminEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "unknown";
        
        _logger.LogInformation("Admin {Admin} updating message {MessageId} status to {Status}", 
            adminEmail, id, dto.Status);

        var result = await _contactMessageService.UpdateStatusAsync(id, dto, adminEmail);

        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Message });
        }

        return Ok(new 
        { 
            message = "Status updated successfully",
            data = result.Data 
        });
    }

    /// <summary>
    /// Soft-deletes a message
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> Delete(string id)
    {
        var adminEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "unknown";
        
        _logger.LogInformation("Admin {Admin} deleting message {MessageId}", adminEmail, id);
        
        var result = await _contactMessageService.DeleteAsync(id);

        if (!result.IsSuccess)
        {
            return NotFound(new { error = result.Message });
        }

        return Ok(new { message = "Message deleted successfully" });
    }
}
