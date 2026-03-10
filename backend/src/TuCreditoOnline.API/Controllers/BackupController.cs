using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuCreditoOnline.Infrastructure.Services;

namespace TuCreditoOnline.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class BackupController : ControllerBase
{
    private readonly BackupService _backupService;
    private readonly ILogger<BackupController> _logger;

    public BackupController(BackupService backupService, ILogger<BackupController> logger)
    {
        _backupService = backupService;
        _logger = logger;
    }

    /// <summary>
    /// Generate database backup and download as ZIP file
    /// </summary>
    [HttpGet("generate")]
    public async Task<IActionResult> GenerateBackup()
    {
        _logger.LogInformation("Backup generation request received");

        try
        {
            var result = await _backupService.GenerateBackupAsync();

            if (!result.IsSuccess)
            {
                _logger.LogWarning("Error generating backup: {Message}", result.Message);
                return StatusCode(500, new { error = result.Message });
            }

            var zipFilePath = result.Data;

            if (string.IsNullOrEmpty(zipFilePath) || !System.IO.File.Exists(zipFilePath))
            {
                return StatusCode(500, new { error = "Backup file was not generated correctly" });
            }

            // Read the backup file
            var fileBytes = await System.IO.File.ReadAllBytesAsync(zipFilePath);
            var fileName = Path.GetFileName(zipFilePath);

            _logger.LogInformation("Backup generated successfully: {FileName}, Size: {Size} bytes", fileName, fileBytes.Length);

            // Clean up old backups in the background
            _ = Task.Run(() => _backupService.CleanupOldBackups(7));

            // Delete the temp file after a delay so the HTTP response can complete first
            _ = Task.Run(async () =>
            {
                await Task.Delay(TimeSpan.FromMinutes(5));
                try
                {
                    if (System.IO.File.Exists(zipFilePath))
                    {
                        System.IO.File.Delete(zipFilePath);
                        _logger.LogInformation("Temporary backup file deleted: {File}", zipFilePath);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error deleting temporary file");
                }
            });

            // Return the file for download
            return File(fileBytes, "application/zip", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error generating backup");
            return StatusCode(500, new { error = "Internal error generating backup" });
        }
    }

    /// <summary>
    /// Get backup status and information
    /// </summary>
    [HttpGet("status")]
    public IActionResult GetBackupStatus()
    {
        try
        {
            var backupPath = Path.Combine(Path.GetTempPath(), "mongodb_backups");
            var files = Directory.Exists(backupPath) 
                ? Directory.GetFiles(backupPath, "backup_*.zip")
                : Array.Empty<string>();

            var backups = files
                .Select(f => new FileInfo(f))
                .OrderByDescending(f => f.CreationTimeUtc)
                .Take(10)
                .Select(f => new
                {
                    fileName = f.Name,
                    size = f.Length,
                    createdAt = f.CreationTimeUtc,
                    sizeFormatted = FormatBytes(f.Length)
                })
                .ToList();

            return Ok(new
            {
                totalBackups = backups.Count,
                backups = backups,
                backupPath = backupPath
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching backup status");
            return StatusCode(500, new { error = "Error fetching backup status" });
        }
    }

    private static string FormatBytes(long bytes)
    {
        string[] sizes = { "B", "KB", "MB", "GB", "TB" };
        double len = bytes;
        int order = 0;
        while (len >= 1024 && order < sizes.Length - 1)
        {
            order++;
            len = len / 1024;
        }
        return $"{len:0.##} {sizes[order]}";
    }
}
