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
public class ContactMessagesControllerMockedTests : IClassFixture<MockedWebApplicationFactory>
{
    private readonly MockedWebApplicationFactory _factory;

    public ContactMessagesControllerMockedTests(MockedWebApplicationFactory factory)
        => _factory = factory;

    private HttpClient AdminClient()
    {
        var c = _factory.CreateClient();
        c.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestAuthHandler.AdminToken);
        return c;
    }

    // ── Create (public) ───────────────────────────────────────────────────────

    [Fact]
    public async Task Create_WithValidData_ReturnsOk()
    {
        var dto = new ContactMessageDto { Id = "m1", Name = "Test", Email = "t@t.com" };
        _factory.MockContactMessageService
            .Setup(s => s.CreateAsync(It.IsAny<CreateContactMessageDto>()))
            .ReturnsAsync(Result<ContactMessageDto>.Success(dto));

        var client = _factory.CreateClient();
        var body = new CreateContactMessageDto
        {
            Name = "Test", Email = "t@t.com", Subject = "Hi", Message = "Hello world"
        };

        var resp = await client.PostAsJsonAsync("/api/contactmessages", body);

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Create_WhenServiceFails_Returns500()
    {
        _factory.MockContactMessageService
            .Setup(s => s.CreateAsync(It.IsAny<CreateContactMessageDto>()))
            .ReturnsAsync(Result<ContactMessageDto>.Failure("DB error"));

        var client = _factory.CreateClient();
        var body = new CreateContactMessageDto
        {
            Name = "Test", Email = "t@t.com", Subject = "Sub", Message = "Msg"
        };

        var resp = await client.PostAsJsonAsync("/api/contactmessages", body);

        resp.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
    }

    // ── GetAll (admin) ────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAll_AsAdmin_ReturnsOk()
    {
        _factory.MockContactMessageService
            .Setup(s => s.GetAllAsync(It.IsAny<int?>()))
            .ReturnsAsync(Result<List<ContactMessageDto>>.Success(new List<ContactMessageDto>()));

        var resp = await AdminClient().GetAsync("/api/contactmessages");

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAll_WhenServiceFails_Returns500()
    {
        _factory.MockContactMessageService
            .Setup(s => s.GetAllAsync(It.IsAny<int?>()))
            .ReturnsAsync(Result<List<ContactMessageDto>>.Failure("DB error"));

        var resp = await AdminClient().GetAsync("/api/contactmessages");

        resp.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
    }

    // ── GetById (admin) ───────────────────────────────────────────────────────

    [Fact]
    public async Task GetById_WhenFound_ReturnsOk()
    {
        var dto = new ContactMessageDto { Id = "msg1", Name = "Test" };
        _factory.MockContactMessageService
            .Setup(s => s.GetByIdAsync("msg1"))
            .ReturnsAsync(Result<ContactMessageDto>.Success(dto));

        var resp = await AdminClient().GetAsync("/api/contactmessages/msg1");

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetById_WhenNotFound_ReturnsNotFound()
    {
        _factory.MockContactMessageService
            .Setup(s => s.GetByIdAsync("none"))
            .ReturnsAsync(Result<ContactMessageDto>.Failure("Not found"));

        var resp = await AdminClient().GetAsync("/api/contactmessages/none");

        resp.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── GetPending (admin) ────────────────────────────────────────────────────

    [Fact]
    public async Task GetPending_ReturnsOk()
    {
        _factory.MockContactMessageService
            .Setup(s => s.GetPendingMessagesAsync())
            .ReturnsAsync(Result<List<ContactMessageDto>>.Success(new List<ContactMessageDto>()));

        var resp = await AdminClient().GetAsync("/api/contactmessages/pending");

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetPending_WhenFails_Returns500()
    {
        _factory.MockContactMessageService
            .Setup(s => s.GetPendingMessagesAsync())
            .ReturnsAsync(Result<List<ContactMessageDto>>.Failure("Error"));

        var resp = await AdminClient().GetAsync("/api/contactmessages/pending");

        resp.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
    }

    // ── GetStats (admin) ──────────────────────────────────────────────────────

    [Fact]
    public async Task GetStats_ReturnsOk()
    {
        var stats = new ContactMessageStatsDto { TotalMessages = 5, NewMessages = 2 };
        _factory.MockContactMessageService
            .Setup(s => s.GetStatsAsync())
            .ReturnsAsync(Result<ContactMessageStatsDto>.Success(stats));

        var resp = await AdminClient().GetAsync("/api/contactmessages/stats");

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetStats_WhenFails_Returns500()
    {
        _factory.MockContactMessageService
            .Setup(s => s.GetStatsAsync())
            .ReturnsAsync(Result<ContactMessageStatsDto>.Failure("Error"));

        var resp = await AdminClient().GetAsync("/api/contactmessages/stats");

        resp.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
    }

    // ── UpdateStatus (admin) ──────────────────────────────────────────────────

    [Fact]
    public async Task UpdateStatus_WhenSuccess_ReturnsOk()
    {
        var updated = new ContactMessageDto { Id = "msg1", Status = 1 };
        _factory.MockContactMessageService
            .Setup(s => s.UpdateStatusAsync("msg1", It.IsAny<UpdateContactMessageStatusDto>(), It.IsAny<string>()))
            .ReturnsAsync(Result<ContactMessageDto>.Success(updated));

        var body = new UpdateContactMessageStatusDto { Status = 1 };
        var resp = await AdminClient().PatchAsJsonAsync("/api/contactmessages/msg1/status", body);

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task UpdateStatus_WhenFails_ReturnsBadRequest()
    {
        _factory.MockContactMessageService
            .Setup(s => s.UpdateStatusAsync("msg1", It.IsAny<UpdateContactMessageStatusDto>(), It.IsAny<string>()))
            .ReturnsAsync(Result<ContactMessageDto>.Failure("Invalid transition"));

        var body = new UpdateContactMessageStatusDto { Status = 3 };
        var resp = await AdminClient().PatchAsJsonAsync("/api/contactmessages/msg1/status", body);

        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── Delete (admin) ────────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_WhenSuccess_ReturnsOk()
    {
        _factory.MockContactMessageService
            .Setup(s => s.DeleteAsync("msg1"))
            .ReturnsAsync(Result<bool>.Success(true));

        var resp = await AdminClient().DeleteAsync("/api/contactmessages/msg1");

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Delete_WhenNotFound_ReturnsNotFound()
    {
        _factory.MockContactMessageService
            .Setup(s => s.DeleteAsync("none"))
            .ReturnsAsync(Result<bool>.Failure("Not found"));

        var resp = await AdminClient().DeleteAsync("/api/contactmessages/none");

        resp.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
