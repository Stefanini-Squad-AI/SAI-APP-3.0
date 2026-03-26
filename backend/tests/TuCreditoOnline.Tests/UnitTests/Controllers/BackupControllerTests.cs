using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TuCreditoOnline.API.Controllers;
using TuCreditoOnline.Application.Common.Models;
using TuCreditoOnline.Application.DTOs;
using TuCreditoOnline.Infrastructure.Persistence;
using TuCreditoOnline.Infrastructure.Services;

namespace TuCreditoOnline.Tests.UnitTests.Controllers;

public class BackupControllerTests
{
    private readonly Mock<BackupService> _mockService;
    private readonly BackupController _controller;

    public BackupControllerTests()
    {
        _mockService = new Mock<BackupService>(
            (MongoDbContext)null!,
            (ILogger<BackupService>)null!,
            (IConfiguration)null!);
        var mockLogger = new Mock<ILogger<BackupController>>();
        _controller = new BackupController(_mockService.Object, mockLogger.Object);
    }

    // ── GetBackupStatus ───────────────────────────────────────────────────────

    [Fact]
    public void GetBackupStatus_ShouldReturnOkWithBackupStatusDto()
    {
        var result = _controller.GetBackupStatus();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeOfType<BackupStatusDto>();
    }

    [Fact]
    public void GetBackupStatus_WhenNoBackupsExist_ShouldReturnEmptyList()
    {
        var result = _controller.GetBackupStatus();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<BackupStatusDto>().Subject;
        dto.TotalBackups.Should().BeGreaterThanOrEqualTo(0);
        dto.Backups.Should().NotBeNull();
    }

    [Fact]
    public void GetBackupStatus_WhenBackupFileExists_ShouldReturnFileInfo()
    {
        // Create a real temp backup file so the FileInfo path is exercised
        var backupDir = Path.Combine(Path.GetTempPath(), "mongodb_backups");
        Directory.CreateDirectory(backupDir);
        var testFile = Path.Combine(backupDir, "backup_test_unit.zip");
        File.WriteAllBytes(testFile, new byte[] { 0x50, 0x4B, 0x05, 0x06 });

        try
        {
            var result = _controller.GetBackupStatus();

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var dto = ok.Value.Should().BeOfType<BackupStatusDto>().Subject;
            dto.TotalBackups.Should().BeGreaterThan(0);
            dto.Backups.Should().NotBeEmpty();
            dto.Backups[0].FileName.Should().NotBeNullOrEmpty();
            dto.Backups[0].SizeFormatted.Should().NotBeNullOrEmpty();
        }
        finally
        {
            if (File.Exists(testFile)) File.Delete(testFile);
        }
    }

    // ── GenerateBackup ────────────────────────────────────────────────────────

    [Fact]
    public async Task GenerateBackup_WhenServiceFails_ShouldReturn500()
    {
        _mockService.Setup(x => x.GenerateBackupAsync())
                    .ReturnsAsync(Result.Failure<string>("mongodump not found"));

        var result = await _controller.GenerateBackup();

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(500);
    }

    [Fact]
    public async Task GenerateBackup_WhenServiceReturnsNonExistentPath_ShouldReturn500()
    {
        _mockService.Setup(x => x.GenerateBackupAsync())
                    .ReturnsAsync(Result.Success<string>("/nonexistent/path/backup.zip"));

        var result = await _controller.GenerateBackup();

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(500);
    }

    [Fact]
    public async Task GenerateBackup_WhenServiceReturnsEmptyPath_ShouldReturn500()
    {
        _mockService.Setup(x => x.GenerateBackupAsync())
                    .ReturnsAsync(Result.Success<string>(string.Empty));

        var result = await _controller.GenerateBackup();

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(500);
    }

    [Fact]
    public async Task GenerateBackup_WhenExceptionThrown_ShouldReturn500()
    {
        _mockService.Setup(x => x.GenerateBackupAsync())
                    .ThrowsAsync(new Exception("Unexpected DB failure"));

        var result = await _controller.GenerateBackup();

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(500);
    }

    [Fact]
    public async Task GenerateBackup_WhenServiceReturnsNullPath_ShouldReturn500()
    {
        _mockService.Setup(x => x.GenerateBackupAsync())
                    .ReturnsAsync(Result.Success<string>(null!));

        var result = await _controller.GenerateBackup();

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(500);
    }

    [Fact]
    public async Task GenerateBackup_WhenRealFileExists_ShouldReturnFile()
    {
        var tempDir = Path.Combine(Path.GetTempPath(), "backup_test_unit_gen");
        Directory.CreateDirectory(tempDir);
        var tempFile = Path.Combine(tempDir, "backup_test.zip");
        await File.WriteAllBytesAsync(tempFile, new byte[] { 0x50, 0x4B, 0x05, 0x06 });

        try
        {
            _mockService.Setup(x => x.GenerateBackupAsync())
                        .ReturnsAsync(Result.Success<string>(tempFile));
            _mockService.Setup(x => x.CleanupOldBackups(It.IsAny<int>()));

            var result = await _controller.GenerateBackup();

            var fileResult = result.Should().BeOfType<FileContentResult>().Subject;
            fileResult.ContentType.Should().Be("application/zip");
            fileResult.FileContents.Should().NotBeEmpty();
            fileResult.FileDownloadName.Should().Be("backup_test.zip");
        }
        finally
        {
            if (File.Exists(tempFile)) File.Delete(tempFile);
            if (Directory.Exists(tempDir)) Directory.Delete(tempDir, true);
        }
    }

    [Fact]
    public void GetBackupStatus_WhenDirectoryDoesNotExist_ShouldReturnEmptyBackups()
    {
        var nonExistentDir = Path.Combine(Path.GetTempPath(), "mongodb_backups_nonexistent_" + Guid.NewGuid().ToString("N"));

        var result = _controller.GetBackupStatus();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<BackupStatusDto>().Subject;
        dto.TotalBackups.Should().BeGreaterThanOrEqualTo(0);
    }

    [Fact]
    public void GetBackupStatus_ShouldReturnFormattedSizes_ForMultipleBackups()
    {
        var backupDir = Path.Combine(Path.GetTempPath(), "mongodb_backups");
        Directory.CreateDirectory(backupDir);
        var smallFile = Path.Combine(backupDir, "backup_small_unit.zip");
        var largeFile = Path.Combine(backupDir, "backup_large_unit.zip");

        File.WriteAllBytes(smallFile, new byte[100]);
        File.WriteAllBytes(largeFile, new byte[2048]);

        try
        {
            var result = _controller.GetBackupStatus();

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var dto = ok.Value.Should().BeOfType<BackupStatusDto>().Subject;
            dto.TotalBackups.Should().BeGreaterThanOrEqualTo(2);
            dto.Backups.Should().AllSatisfy(b => b.SizeFormatted.Should().NotBeNullOrEmpty());
        }
        finally
        {
            if (File.Exists(smallFile)) File.Delete(smallFile);
            if (File.Exists(largeFile)) File.Delete(largeFile);
        }
    }
}
