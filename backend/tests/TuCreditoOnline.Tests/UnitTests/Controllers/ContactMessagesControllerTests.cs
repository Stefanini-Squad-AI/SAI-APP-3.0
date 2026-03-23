using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Security.Claims;
using TuCreditoOnline.API.Controllers;
using TuCreditoOnline.Application.Common.Models;
using TuCreditoOnline.Application.DTOs;
using TuCreditoOnline.Domain.Entities;
using TuCreditoOnline.Infrastructure.Repositories;
using TuCreditoOnline.Infrastructure.Services;

namespace TuCreditoOnline.Tests.UnitTests.Controllers;

public class ContactMessagesControllerTests
{
    private readonly Mock<ContactMessageService> _mockService;
    private readonly ContactMessagesController _controller;

    public ContactMessagesControllerTests()
    {
        _mockService = new Mock<ContactMessageService>(
            (ContactMessageRepository)null!,
            (ILogger<ContactMessageService>)null!);
        var mockLogger = new Mock<ILogger<ContactMessagesController>>();
        _controller = new ContactMessagesController(_mockService.Object, mockLogger.Object);

        // Set up a default authenticated admin user for tests that need User claims
        var identity = new ClaimsIdentity(
            new[] { new Claim(ClaimTypes.Email, "admin@test.com") }, "test");
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
    }

    private static ContactMessageDto MakeDto(string id = "m1") => new()
    {
        Id = id, Name = "User", Email = "u@a.com", Subject = "Test", Message = "Hello",
        Status = 0, StatusText = "New"
    };

    // ── Create ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_WhenModelStateInvalid_ShouldReturnBadRequest()
    {
        _controller.ModelState.AddModelError("Email", "Email is required");

        var result = await _controller.Create(new CreateContactMessageDto());

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Create_WhenSuccess_ShouldReturnOk()
    {
        var dto = new CreateContactMessageDto { Name = "U", Email = "u@a.com", Subject = "S", Message = "M" };
        _mockService.Setup(x => x.CreateAsync(dto)).ReturnsAsync(Result.Success(MakeDto()));

        var result = await _controller.Create(dto);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task Create_WhenFailure_ShouldReturn500()
    {
        var dto = new CreateContactMessageDto { Name = "U", Email = "u@a.com", Subject = "S", Message = "M" };
        _mockService.Setup(x => x.CreateAsync(dto)).ReturnsAsync(Result.Failure<ContactMessageDto>("DB error"));

        var result = await _controller.Create(dto);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(500);
    }

    // ── GetAll ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAll_WhenSuccess_ShouldReturnOk()
    {
        _mockService.Setup(x => x.GetAllAsync(null))
                    .ReturnsAsync(Result.Success(new List<ContactMessageDto> { MakeDto() }));

        var result = await _controller.GetAll();

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetAll_WhenFailure_ShouldReturn500()
    {
        _mockService.Setup(x => x.GetAllAsync(It.IsAny<int?>()))
                    .ReturnsAsync(Result.Failure<List<ContactMessageDto>>("Error"));

        var result = await _controller.GetAll();

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(500);
    }

    // ── GetById ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetById_WhenFound_ShouldReturnOk()
    {
        _mockService.Setup(x => x.GetByIdAsync("m1")).ReturnsAsync(Result.Success(MakeDto()));

        var result = await _controller.GetById("m1");

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetById_WhenNotFound_ShouldReturnNotFound()
    {
        _mockService.Setup(x => x.GetByIdAsync("bad"))
                    .ReturnsAsync(Result.Failure<ContactMessageDto>("Message not found"));

        var result = await _controller.GetById("bad");

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    // ── GetPending ────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetPending_WhenSuccess_ShouldReturnOk()
    {
        _mockService.Setup(x => x.GetPendingMessagesAsync())
                    .ReturnsAsync(Result.Success(new List<ContactMessageDto> { MakeDto() }));

        var result = await _controller.GetPending();

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetPending_WhenFailure_ShouldReturn500()
    {
        _mockService.Setup(x => x.GetPendingMessagesAsync())
                    .ReturnsAsync(Result.Failure<List<ContactMessageDto>>("Error"));

        var result = await _controller.GetPending();

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(500);
    }

    // ── GetStats ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetStats_WhenSuccess_ShouldReturnOk()
    {
        _mockService.Setup(x => x.GetStatsAsync())
                    .ReturnsAsync(Result.Success(new ContactMessageStatsDto { TotalMessages = 5 }));

        var result = await _controller.GetStats();

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetStats_WhenFailure_ShouldReturn500()
    {
        _mockService.Setup(x => x.GetStatsAsync())
                    .ReturnsAsync(Result.Failure<ContactMessageStatsDto>("Error"));

        var result = await _controller.GetStats();

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(500);
    }

    // ── UpdateStatus ──────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateStatus_WhenModelStateInvalid_ShouldReturnBadRequest()
    {
        _controller.ModelState.AddModelError("Status", "Status is required");

        var result = await _controller.UpdateStatus("m1", new UpdateContactMessageStatusDto());

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task UpdateStatus_WhenSuccess_ShouldReturnOk()
    {
        var dto = new UpdateContactMessageStatusDto { Status = 1 };
        var updated = MakeDto();
        updated.Status = 1;
        _mockService.Setup(x => x.UpdateStatusAsync("m1", dto, "admin@test.com"))
                    .ReturnsAsync(Result.Success(updated));

        var result = await _controller.UpdateStatus("m1", dto);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task UpdateStatus_WhenFailure_ShouldReturnBadRequest()
    {
        var dto = new UpdateContactMessageStatusDto { Status = 0 };
        _mockService.Setup(x => x.UpdateStatusAsync(It.IsAny<string>(), dto, It.IsAny<string>()))
                    .ReturnsAsync(Result.Failure<ContactMessageDto>("Invalid status transition"));

        var result = await _controller.UpdateStatus("m1", dto);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_WhenSuccess_ShouldReturnOk()
    {
        _mockService.Setup(x => x.DeleteAsync("m1")).ReturnsAsync(Result.Success(true));

        var result = await _controller.Delete("m1");

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task Delete_WhenNotFound_ShouldReturnNotFound()
    {
        _mockService.Setup(x => x.DeleteAsync("bad"))
                    .ReturnsAsync(Result.Failure<bool>("Message not found"));

        var result = await _controller.Delete("bad");

        result.Should().BeOfType<NotFoundObjectResult>();
    }
}
