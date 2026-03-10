using Microsoft.AspNetCore.Mvc;
using TuCreditoOnline.Infrastructure.Services;

namespace TuCreditoOnline.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly IDatabaseHealthService _databaseHealthService;
    private readonly ILogger<HealthController> _logger;

    public HealthController(
        IDatabaseHealthService databaseHealthService,
        ILogger<HealthController> logger)
    {
        _databaseHealthService = databaseHealthService;
        _logger = logger;
    }

    /// <summary>
    /// Health check endpoint that verifies database connectivity
    /// </summary>
    /// <returns>Health status including database connection information</returns>
    [HttpGet]
    [ProducesResponseType(typeof(HealthCheckResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(HealthCheckResponse), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetHealth(CancellationToken cancellationToken)
    {
        try
        {
            var dbHealth = await _databaseHealthService.CheckHealthAsync(cancellationToken);
            
            var response = new HealthCheckResponse
            {
                Status = dbHealth.IsHealthy ? "Healthy" : "Unhealthy",
                ApiVersion = "1.0.0",
                Timestamp = DateTime.UtcNow,
                Database = new DatabaseInfo
                {
                    IsConnected = dbHealth.IsHealthy,
                    Name = dbHealth.DatabaseName,
                    ResponseTimeMs = dbHealth.ResponseTimeMs,
                    CollectionsCount = dbHealth.CollectionsCount,
                    Message = dbHealth.Message
                }
            };

            if (dbHealth.IsHealthy)
            {
                _logger.LogInformation("Health check passed. Database: {DatabaseName}, Response time: {ResponseTime}ms", 
                    dbHealth.DatabaseName, dbHealth.ResponseTimeMs);
                return Ok(response);
            }
            else
            {
                _logger.LogWarning("Health check failed. Database connection issue: {Message}", dbHealth.Message);
                return StatusCode(StatusCodes.Status503ServiceUnavailable, response);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check endpoint failed");
            
            var errorResponse = new HealthCheckResponse
            {
                Status = "Unhealthy",
                ApiVersion = "1.0.0",
                Timestamp = DateTime.UtcNow,
                Database = new DatabaseInfo
                {
                    IsConnected = false,
                    Message = $"Health check failed: {ex.Message}"
                }
            };
            
            return StatusCode(StatusCodes.Status503ServiceUnavailable, errorResponse);
        }
    }
}

public class HealthCheckResponse
{
    public string Status { get; set; } = string.Empty;
    public string ApiVersion { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public DatabaseInfo Database { get; set; } = new();
}

public class DatabaseInfo
{
    public bool IsConnected { get; set; }
    public string? Name { get; set; }
    public double? ResponseTimeMs { get; set; }
    public int? CollectionsCount { get; set; }
    public string Message { get; set; } = string.Empty;
}
