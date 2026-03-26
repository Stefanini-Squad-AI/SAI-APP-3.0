using System.Net;
using System.Net.Http.Headers;
using FluentAssertions;
using Moq;
using TuCreditoOnline.Application.Common.Models;
using Xunit;

namespace TuCreditoOnline.Tests.IntegrationTests.Controllers;

[Collection("MockedIntegration")]
public class BackupControllerMockedTests : IClassFixture<MockedWebApplicationFactory>
{
    private readonly MockedWebApplicationFactory _factory;

    public BackupControllerMockedTests(MockedWebApplicationFactory factory)
        => _factory = factory;

    private HttpClient AdminClient()
    {
        var c = _factory.CreateClient();
        c.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestAuthHandler.AdminToken);
        return c;
    }

    // ── GetBackupStatus ───────────────────────────────────────────────────────

    [Fact]
    public async Task GetBackupStatus_ReturnsOk()
    {
        var resp = await AdminClient().GetAsync("/api/backup/status");

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ── GenerateBackup ────────────────────────────────────────────────────────

    [Fact]
    public async Task GenerateBackup_WhenServiceFails_Returns500()
    {
        _factory.MockBackupService
            .Setup(s => s.GenerateBackupAsync())
            .ReturnsAsync(Result<string>.Failure("mongodump not found"));

        var resp = await AdminClient().GetAsync("/api/backup/generate");

        resp.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task GenerateBackup_WhenServiceReturnsEmptyPath_Returns500()
    {
        _factory.MockBackupService
            .Setup(s => s.GenerateBackupAsync())
            .ReturnsAsync(Result<string>.Success(string.Empty));

        var resp = await AdminClient().GetAsync("/api/backup/generate");

        resp.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task GenerateBackup_WhenFileNotFound_Returns500()
    {
        _factory.MockBackupService
            .Setup(s => s.GenerateBackupAsync())
            .ReturnsAsync(Result<string>.Success("/nonexistent/path/backup.zip"));

        var resp = await AdminClient().GetAsync("/api/backup/generate");

        resp.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task GenerateBackup_WhenServiceSucceeds_ReturnsZipFile()
    {
        // Create a real temp zip file so the File.Exists check and ReadAllBytesAsync pass
        var zipPath = Path.Combine(Path.GetTempPath(), $"backup_test_{Guid.NewGuid():N}.zip");
        // Minimal valid zip file bytes (empty zip)
        byte[] emptyZip = { 0x50, 0x4B, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                             0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 };
        await File.WriteAllBytesAsync(zipPath, emptyZip);

        try
        {
            _factory.MockBackupService
                .Setup(s => s.GenerateBackupAsync())
                .ReturnsAsync(Result<string>.Success(zipPath));
            _factory.MockBackupService
                .Setup(s => s.CleanupOldBackups(It.IsAny<int>()));

            var resp = await AdminClient().GetAsync("/api/backup/generate");

            resp.StatusCode.Should().Be(HttpStatusCode.OK);
            resp.Content.Headers.ContentType!.MediaType.Should().Be("application/zip");
        }
        finally
        {
            if (File.Exists(zipPath)) File.Delete(zipPath);
        }
    }
}
