using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using Moq;
using TuCreditoOnline.Application.Common.Models;
using TuCreditoOnline.Application.DTOs;
using Xunit;

namespace TuCreditoOnline.Tests.IntegrationTests.Controllers;

[Collection("MockedIntegration")]
public class ServicesControllerMockedTests : IClassFixture<MockedWebApplicationFactory>
{
    private readonly MockedWebApplicationFactory _factory;

    public ServicesControllerMockedTests(MockedWebApplicationFactory factory)
        => _factory = factory;

    private HttpClient AdminClient()
    {
        var c = _factory.CreateClient();
        c.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestAuthHandler.AdminToken);
        return c;
    }

    private static ServiceResponseDto MakeDto(string id = "svc1") => new()
    {
        Id = id, Title = "Loans", Description = "Personal loans",
        Icon = "icon.svg", DisplayOrder = 1, IsActive = true
    };

    // ── GetAll (public) ───────────────────────────────────────────────────────

    [Fact]
    public async Task GetAll_ReturnsOk()
    {
        _factory.MockServiceManagementService
            .Setup(s => s.GetAllAsync(It.IsAny<bool?>()))
            .ReturnsAsync(Result<List<ServiceResponseDto>>.Success(new List<ServiceResponseDto> { MakeDto() }));

        var resp = await _factory.CreateClient().GetAsync("/api/services");

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAll_WhenFails_Returns500()
    {
        _factory.MockServiceManagementService
            .Setup(s => s.GetAllAsync(It.IsAny<bool?>()))
            .ReturnsAsync(Result<List<ServiceResponseDto>>.Failure("DB error"));

        var resp = await _factory.CreateClient().GetAsync("/api/services");

        resp.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
    }

    // ── GetById (public) ──────────────────────────────────────────────────────

    [Fact]
    public async Task GetById_WhenFound_ReturnsOk()
    {
        _factory.MockServiceManagementService
            .Setup(s => s.GetByIdAsync("svc1"))
            .ReturnsAsync(Result<ServiceResponseDto>.Success(MakeDto()));

        var resp = await _factory.CreateClient().GetAsync("/api/services/svc1");

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetById_WhenNotFound_ReturnsNotFound()
    {
        _factory.MockServiceManagementService
            .Setup(s => s.GetByIdAsync("none"))
            .ReturnsAsync(Result<ServiceResponseDto>.Failure("Not found"));

        var resp = await _factory.CreateClient().GetAsync("/api/services/none");

        resp.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── Create (admin) ────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_WhenSuccess_ReturnsCreated()
    {
        _factory.MockServiceManagementService
            .Setup(s => s.CreateAsync(It.IsAny<CreateServiceDto>()))
            .ReturnsAsync(Result<ServiceResponseDto>.Success(MakeDto()));

        var body = new CreateServiceDto
        {
            Title = "Loans", Description = "Personal loans",
            Icon = "icon.svg", DisplayOrder = 1, IsActive = true
        };
        var resp = await AdminClient().PostAsJsonAsync("/api/services", body);

        resp.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Create_WhenFails_ReturnsBadRequest()
    {
        _factory.MockServiceManagementService
            .Setup(s => s.CreateAsync(It.IsAny<CreateServiceDto>()))
            .ReturnsAsync(Result<ServiceResponseDto>.Failure("Duplicate title"));

        var body = new CreateServiceDto { Title = "Duplicate" };
        var resp = await AdminClient().PostAsJsonAsync("/api/services", body);

        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── Update (admin) ────────────────────────────────────────────────────────

    [Fact]
    public async Task Update_WhenSuccess_ReturnsOk()
    {
        _factory.MockServiceManagementService
            .Setup(s => s.UpdateAsync("svc1", It.IsAny<UpdateServiceDto>()))
            .ReturnsAsync(Result<ServiceResponseDto>.Success(MakeDto()));

        var body = new UpdateServiceDto { Title = "Updated", IsActive = true, DisplayOrder = 2 };
        var resp = await AdminClient().PutAsJsonAsync("/api/services/svc1", body);

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Update_WhenFails_ReturnsBadRequest()
    {
        _factory.MockServiceManagementService
            .Setup(s => s.UpdateAsync("none", It.IsAny<UpdateServiceDto>()))
            .ReturnsAsync(Result<ServiceResponseDto>.Failure("Not found"));

        var body = new UpdateServiceDto { Title = "X", IsActive = true };
        var resp = await AdminClient().PutAsJsonAsync("/api/services/none", body);

        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── Delete (admin) ────────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_WhenSuccess_ReturnsOk()
    {
        _factory.MockServiceManagementService
            .Setup(s => s.DeleteAsync("svc1"))
            .ReturnsAsync(Result<bool>.Success(true));

        var resp = await AdminClient().DeleteAsync("/api/services/svc1");

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Delete_WhenFails_ReturnsBadRequest()
    {
        _factory.MockServiceManagementService
            .Setup(s => s.DeleteAsync("none"))
            .ReturnsAsync(Result<bool>.Failure("Not found"));

        var resp = await AdminClient().DeleteAsync("/api/services/none");

        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
