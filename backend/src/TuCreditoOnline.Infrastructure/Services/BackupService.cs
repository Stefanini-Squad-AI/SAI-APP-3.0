using System.Diagnostics;
using System.IO.Compression;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TuCreditoOnline.Application.Common.Models;
using TuCreditoOnline.Infrastructure.Persistence;

namespace TuCreditoOnline.Infrastructure.Services;

public class BackupService
{
    private readonly MongoDbContext _context;
    private readonly ILogger<BackupService> _logger;
    private readonly string _backupPath;

    public BackupService(MongoDbContext context, ILogger<BackupService> logger, IConfiguration configuration)
    {
        _context = context;
        _logger = logger;
        _backupPath = Path.Combine(Path.GetTempPath(), "mongodb_backups");
        
        if (!Directory.Exists(_backupPath))
        {
            Directory.CreateDirectory(_backupPath);
        }
    }

    public virtual async Task<Result<string>> GenerateBackupAsync()
    {
        var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
        var backupName = $"backup_{timestamp}";
        var backupDir = Path.Combine(_backupPath, backupName);
        var zipFilePath = Path.Combine(_backupPath, $"{backupName}.zip");

        try
        {
            _logger.LogInformation("Starting MongoDB backup to {BackupDir}", backupDir);

            // Create backup directory
            if (Directory.Exists(backupDir))
            {
                Directory.Delete(backupDir, true);
            }
            Directory.CreateDirectory(backupDir);

            var mongoSettings = _context.GetMongoSettings();
            var connectionString = mongoSettings.ConnectionString;
            var databaseName = mongoSettings.DatabaseName;

            // Build mongodump command
            var mongodumpArgs = $"--uri=\"{connectionString}\" --db={databaseName} --out=\"{backupDir}\"";

            var processStartInfo = new ProcessStartInfo
            {
                FileName = "mongodump",
                Arguments = mongodumpArgs,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using (var process = Process.Start(processStartInfo))
            {
                if (process == null)
                {
                    return Result.Failure<string>("Failed to start mongodump process");
                }

                var error = await process.StandardError.ReadToEndAsync();

                await process.WaitForExitAsync();

                if (process.ExitCode != 0)
                {
                    _logger.LogError("mongodump error: {Error}", error);
                    return Result.Failure<string>($"mongodump execution failed: {error}");
                }
            }

            // Verify backup files were created
            if (!Directory.Exists(backupDir) || Directory.GetFiles(backupDir, "*.*", SearchOption.AllDirectories).Length == 0)
            {
                return Result.Failure<string>("No backup files were generated");
            }

            if (File.Exists(zipFilePath))
            {
                File.Delete(zipFilePath);
            }

            ZipFile.CreateFromDirectory(backupDir, zipFilePath, CompressionLevel.Optimal, false);

            // Remove temporary backup directory
            Directory.Delete(backupDir, true);

            _logger.LogInformation("Backup generated successfully: {ZipPath}", zipFilePath);

            return Result.Success<string>(zipFilePath);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating backup");
            
            // Clean up temp files on failure
            try
            {
                if (Directory.Exists(backupDir))
                {
                    Directory.Delete(backupDir, true);
                }
                if (File.Exists(zipFilePath))
                {
                    File.Delete(zipFilePath);
                }
            }
            catch
            {
                // Ignore cleanup errors
            }

            return Result.Failure<string>($"Failed to generate backup: {ex.Message}");
        }
    }

    public virtual void CleanupOldBackups(int daysToKeep = 7)
    {
        try
        {
            var files = Directory.GetFiles(_backupPath, "backup_*.zip");
            var cutoffDate = DateTime.UtcNow.AddDays(-daysToKeep);

            foreach (var file in files)
            {
                var fileInfo = new FileInfo(file);
                if (fileInfo.CreationTimeUtc < cutoffDate)
                {
                    _logger.LogInformation("Removing old backup: {File}", file);
                    File.Delete(file);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cleaning up old backups");
        }
    }
}
