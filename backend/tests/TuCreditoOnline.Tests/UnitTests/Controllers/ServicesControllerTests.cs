using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TuCreditoOnline.API.Controllers;
using TuCreditoOnline.Application.Common.Models;
using TuCreditoOnline.Application.DTOs;
using TuCreditoOnline.Infrastructure.Repositories;
using TuCreditoOnline.Infrastructure.Services;

namespace TuCreditoOnline.Tests.UnitTests.Controllers;

public class ServicesControllerTests
{
    private readonly Mock<ServiceManagementService> _mockService;
    private readonly ServicesController _controller;

    public ServicesControllerTests()
    {
        _mockService = new Mock<ServiceManagementService>((ServiceRepository)null!);
        var mockLogger = new Mock<ILogger<ServicesController>>();
        _controller = new ServicesController(_mockService.Object, mockLogger.Object);
    }

    private static ServiceResponseDto MakeDto(string id = "s1") => new()
    {
        Id = id, Title = "Service A", IsActive = true, DisplayOrder = 1
    };

    // ── GetAll ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAll_WhenSuccess_ShouldReturnOk()
    {
        _mockService.Setup(x => x.GetAllAsync(null))
                    .ReturnsAsync(Result.Success(new List<ServiceResponseDto> { MakeDto() }));

        var result = await _controller.GetAll();

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetAll_WhenFailure_ShouldReturn500()
    {
        _mockService.Setup(x => x.GetAllAsync(It.IsAny<bool?>()))
                    .ReturnsAsync(Result.Failure<List<ServiceResponseDto>>("Error"));

        var result = await _controller.GetAll();

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(500);
    }

    [Fact]
    public async Task GetAll_WithActiveFilter_ShouldPassFilterToService()
    {
        _mockService.Setup(x => x.GetAllAsync(true))
                    .ReturnsAsync(Result.Success(new List<ServiceResponseDto> { MakeDto() }));

        var result = await _controller.GetAll(isActive: true);

        result.Should().BeOfType<OkObjectResult>();
        _mockService.Verify(x => x.GetAllAsync(true), Times.Once);
    }

    // ── GetById ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetById_WhenFound_ShouldReturnOk()
    {
        _mockService.Setup(x => x.GetByIdAsync("s1"))
                    .ReturnsAsync(Result.Success(MakeDto()));

        var result = await _controller.GetById("s1");

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetById_WhenNotFound_ShouldReturnNotFound()
    {
        _mockService.Setup(x => x.GetByIdAsync("bad"))
                    .ReturnsAsync(Result.Failure<ServiceResponseDto>("Service not found"));

        var result = await _controller.GetById("bad");

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    // ── Create ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_WhenSuccess_ShouldReturnCreated()
    {
        var dto = new CreateServiceDto { Title = "New", IsActive = true };
        _mockService.Setup(x => x.CreateAsync(dto))
                    .ReturnsAsync(Result.Success(MakeDto("s2")));

        var result = await _controller.Create(dto);

        result.Should().BeOfType<CreatedAtActionResult>();
    }

    [Fact]
    public async Task Create_WhenFailure_ShouldReturnBadRequest()
    {
        var dto = new CreateServiceDto();
        _mockService.Setup(x => x.CreateAsync(dto))
                    .ReturnsAsync(Result.Failure<ServiceResponseDto>("Failed to create service"));

        var result = await _controller.Create(dto);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ── Update ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Update_WhenSuccess_ShouldReturnOk()
    {
        var dto = new UpdateServiceDto { Title = "Updated", IsActive = false };
        _mockService.Setup(x => x.UpdateAsync("s1", dto))
                    .ReturnsAsync(Result.Success(MakeDto()));

        var result = await _controller.Update("s1", dto);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task Update_WhenNotFound_ShouldReturnBadRequest()
    {
        var dto = new UpdateServiceDto { Title = "Test" };
        _mockService.Setup(x => x.UpdateAsync("bad", dto))
                    .ReturnsAsync(Result.Failure<ServiceResponseDto>("Service not found"));

        var result = await _controller.Update("bad", dto);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_WhenSuccess_ShouldReturnOk()
    {
        _mockService.Setup(x => x.DeleteAsync("s1"))
                    .ReturnsAsync(Result.Success(true));

        var result = await _controller.Delete("s1");

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task Delete_WhenNotFound_ShouldReturnBadRequest()
    {
        _mockService.Setup(x => x.DeleteAsync("bad"))
                    .ReturnsAsync(Result.Failure<bool>("Service not found"));

        var result = await _controller.Delete("bad");

        result.Should().BeOfType<BadRequestObjectResult>();
    }
}
