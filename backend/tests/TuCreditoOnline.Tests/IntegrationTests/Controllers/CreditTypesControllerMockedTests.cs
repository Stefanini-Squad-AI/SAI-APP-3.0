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
public class CreditTypesControllerMockedTests : IClassFixture<MockedWebApplicationFactory>
{
    private readonly MockedWebApplicationFactory _factory;

    public CreditTypesControllerMockedTests(MockedWebApplicationFactory factory)
        => _factory = factory;

    private HttpClient AdminClient()
    {
        var c = _factory.CreateClient();
        c.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestAuthHandler.AdminToken);
        return c;
    }

    private static CreditTypeResponseDto MakeDto(string id = "ct1") => new()
    {
        Id = id, Name = "Personal", Description = "Personal loan",
        BaseInterestRate = 12, MinAmount = 1000, MaxAmount = 50000,
        MinTermMonths = 6, MaxTermMonths = 60, IsActive = true
    };

    // ── GetAll (public) ───────────────────────────────────────────────────────

    [Fact]
    public async Task GetAll_ReturnsOk()
    {
        _factory.MockCreditTypeService
            .Setup(s => s.GetAllAsync(It.IsAny<bool?>()))
            .ReturnsAsync(Result<List<CreditTypeResponseDto>>.Success(new List<CreditTypeResponseDto> { MakeDto() }));

        var resp = await _factory.CreateClient().GetAsync("/api/credittypes");

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAll_WhenFails_Returns500()
    {
        _factory.MockCreditTypeService
            .Setup(s => s.GetAllAsync(It.IsAny<bool?>()))
            .ReturnsAsync(Result<List<CreditTypeResponseDto>>.Failure("DB error"));

        var resp = await _factory.CreateClient().GetAsync("/api/credittypes");

        resp.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
    }

    // ── GetById (public) ──────────────────────────────────────────────────────

    [Fact]
    public async Task GetById_WhenFound_ReturnsOk()
    {
        _factory.MockCreditTypeService
            .Setup(s => s.GetByIdAsync("ct1"))
            .ReturnsAsync(Result<CreditTypeResponseDto>.Success(MakeDto()));

        var resp = await _factory.CreateClient().GetAsync("/api/credittypes/ct1");

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetById_WhenNotFound_ReturnsNotFound()
    {
        _factory.MockCreditTypeService
            .Setup(s => s.GetByIdAsync("none"))
            .ReturnsAsync(Result<CreditTypeResponseDto>.Failure("Not found"));

        var resp = await _factory.CreateClient().GetAsync("/api/credittypes/none");

        resp.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── Create (admin) ────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_WhenSuccess_ReturnsCreated()
    {
        _factory.MockCreditTypeService
            .Setup(s => s.CreateAsync(It.IsAny<CreateCreditTypeDto>()))
            .ReturnsAsync(Result<CreditTypeResponseDto>.Success(MakeDto()));

        var body = new CreateCreditTypeDto
        {
            Name = "Personal", Description = "Personal loan",
            BaseInterestRate = 12, MinAmount = 1000, MaxAmount = 50000,
            MinTermMonths = 6, MaxTermMonths = 60, IsActive = true
        };
        var resp = await AdminClient().PostAsJsonAsync("/api/credittypes", body);

        resp.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Create_WhenFails_ReturnsBadRequest()
    {
        _factory.MockCreditTypeService
            .Setup(s => s.CreateAsync(It.IsAny<CreateCreditTypeDto>()))
            .ReturnsAsync(Result<CreditTypeResponseDto>.Failure("Duplicate name"));

        var body = new CreateCreditTypeDto { Name = "Personal" };
        var resp = await AdminClient().PostAsJsonAsync("/api/credittypes", body);

        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── Update (admin) ────────────────────────────────────────────────────────

    [Fact]
    public async Task Update_WhenSuccess_ReturnsOk()
    {
        _factory.MockCreditTypeService
            .Setup(s => s.UpdateAsync("ct1", It.IsAny<UpdateCreditTypeDto>()))
            .ReturnsAsync(Result<CreditTypeResponseDto>.Success(MakeDto()));

        var body = new UpdateCreditTypeDto { Name = "Updated", IsActive = true };
        var resp = await AdminClient().PutAsJsonAsync("/api/credittypes/ct1", body);

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Update_WhenFails_ReturnsBadRequest()
    {
        _factory.MockCreditTypeService
            .Setup(s => s.UpdateAsync("none", It.IsAny<UpdateCreditTypeDto>()))
            .ReturnsAsync(Result<CreditTypeResponseDto>.Failure("Not found"));

        var body = new UpdateCreditTypeDto { Name = "X", IsActive = true };
        var resp = await AdminClient().PutAsJsonAsync("/api/credittypes/none", body);

        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── Delete (admin) ────────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_WhenSuccess_ReturnsOk()
    {
        _factory.MockCreditTypeService
            .Setup(s => s.DeleteAsync("ct1"))
            .ReturnsAsync(Result<bool>.Success(true));

        var resp = await AdminClient().DeleteAsync("/api/credittypes/ct1");

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Delete_WhenFails_ReturnsBadRequest()
    {
        _factory.MockCreditTypeService
            .Setup(s => s.DeleteAsync("none"))
            .ReturnsAsync(Result<bool>.Failure("Not found"));

        var resp = await AdminClient().DeleteAsync("/api/credittypes/none");

        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
