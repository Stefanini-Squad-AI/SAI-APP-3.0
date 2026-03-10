using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuCreditoOnline.Infrastructure.Services;

namespace TuCreditoOnline.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class DashboardController : ControllerBase
{
    private readonly DashboardService _dashboardService;
    private readonly ILogger<DashboardController> _logger;

    public DashboardController(DashboardService dashboardService, ILogger<DashboardController> logger)
    {
        _dashboardService = dashboardService;
        _logger = logger;
    }

    /// <summary>
    /// Get dashboard statistics
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        _logger.LogInformation("Fetching dashboard statistics.");
        var result = await _dashboardService.GetDashboardStatsAsync();

        if (!result.IsSuccess)
        {
            return StatusCode(500, new { error = result.Message });
        }

        return Ok(result.Data);
    }

    /// <summary>
    /// Get status distribution
    /// </summary>
    [HttpGet("status-distribution")]
    public async Task<IActionResult> GetStatusDistribution()
    {
        _logger.LogInformation("Fetching status distribution.");
        var result = await _dashboardService.GetStatusDistributionAsync();

        if (!result.IsSuccess)
        {
            return StatusCode(500, new { error = result.Message });
        }

        return Ok(result.Data);
    }
}
