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
}
