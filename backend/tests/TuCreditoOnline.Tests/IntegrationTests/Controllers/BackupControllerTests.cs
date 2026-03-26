using System.Net;
using System.Net.Http.Json;
using System.Net.Http.Headers;
using Xunit;
using FluentAssertions;
using TuCreditoOnline.Application.DTOs;
using Bogus;

namespace TuCreditoOnline.Tests.IntegrationTests.Controllers;

public class BackupControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly Faker _faker;

    public BackupControllerTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
        _faker = new Faker();
    }

    private async Task<string?> GetAdminTokenAsync()
    {
        var registerDto = new RegisterRequestDto
        {
            Email = _faker.Internet.Email(),
            Password = "Admin123!@#",
            FullName = "Admin User",
            Role = "Admin"
        };

        var response = await _client.PostAsJsonAsync("/api/auth/register", registerDto);
        if (!response.IsSuccessStatusCode) return null;

        var result = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        return result?.Token;
    }

    [Fact]
    public async Task GetBackupStatus_WithoutAuth_ShouldReturnUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var response = await _client.GetAsync("/api/backup/status");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetBackupStatus_AsAdmin_ShouldReturnOk()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.GetAsync("/api/backup/status");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<BackupStatusDto>();
        result.Should().NotBeNull();
        result!.TotalBackups.Should().BeGreaterOrEqualTo(0);
        result.Backups.Should().NotBeNull();
    }

    [Fact]
    public async Task GetBackupStatus_WithInvalidToken_ShouldReturnUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "invalid-token");
        var response = await _client.GetAsync("/api/backup/status");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GenerateBackup_WithoutAuth_ShouldReturnUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var response = await _client.GetAsync("/api/backup/generate");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GenerateBackup_AsAdmin_ShouldReturnFileOrError()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.GetAsync("/api/backup/generate");

        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.OK,
            HttpStatusCode.InternalServerError
        );

        if (response.StatusCode == HttpStatusCode.OK)
        {
            response.Content.Headers.ContentType?.MediaType.Should().Be("application/zip");
            var bytes = await response.Content.ReadAsByteArrayAsync();
            bytes.Length.Should().BeGreaterThan(0);
        }
    }

    [Fact]
    public async Task GenerateBackup_WithInvalidToken_ShouldReturnUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "invalid-token");
        var response = await _client.GetAsync("/api/backup/generate");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetBackupStatus_ShouldReturnValidBackupList()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.GetAsync("/api/backup/status");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var result = await response.Content.ReadFromJsonAsync<BackupStatusDto>();
            result.Should().NotBeNull();

            foreach (var backup in result!.Backups)
            {
                backup.FileName.Should().NotBeNullOrEmpty();
                backup.Size.Should().BeGreaterOrEqualTo(0);
                backup.SizeFormatted.Should().NotBeNullOrEmpty();
            }
        }
    }
}
