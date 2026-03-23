using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TuCreditoOnline.API.Controllers;
using TuCreditoOnline.Application.Common.Models;
using TuCreditoOnline.Application.DTOs;
using TuCreditoOnline.Infrastructure.Repositories;
using TuCreditoOnline.Infrastructure.Services;

namespace TuCreditoOnline.Tests.UnitTests.Controllers;

public class CreditTypesControllerTests
{
    private readonly Mock<CreditTypeService> _mockService;
    private readonly CreditTypesController _controller;

    public CreditTypesControllerTests()
    {
        _mockService = new Mock<CreditTypeService>((CreditTypeRepository)null!);
        var mockLogger = new Mock<ILogger<CreditTypesController>>();
        _controller = new CreditTypesController(_mockService.Object, mockLogger.Object);
    }

    private static CreditTypeResponseDto MakeDto(string id = "ct1") => new()
    {
        Id = id, Name = "Personal", BaseInterestRate = 15m, IsActive = true
    };

    // ── GetAll ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAll_WhenSuccess_ShouldReturnOk()
    {
        _mockService.Setup(x => x.GetAllAsync(null))
                    .ReturnsAsync(Result.Success(new List<CreditTypeResponseDto> { MakeDto() }));

        var result = await _controller.GetAll();

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetAll_WhenFailure_ShouldReturn500()
    {
        _mockService.Setup(x => x.GetAllAsync(It.IsAny<bool?>()))
                    .ReturnsAsync(Result.Failure<List<CreditTypeResponseDto>>("Error"));

        var result = await _controller.GetAll();

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(500);
    }

    // ── GetById ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetById_WhenFound_ShouldReturnOk()
    {
        _mockService.Setup(x => x.GetByIdAsync("ct1"))
                    .ReturnsAsync(Result.Success(MakeDto()));

        var result = await _controller.GetById("ct1");

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetById_WhenNotFound_ShouldReturnNotFound()
    {
        _mockService.Setup(x => x.GetByIdAsync("bad"))
                    .ReturnsAsync(Result.Failure<CreditTypeResponseDto>("Credit type not found"));

        var result = await _controller.GetById("bad");

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    // ── Create ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_WhenSuccess_ShouldReturnCreated()
    {
        var dto = new CreateCreditTypeDto { Name = "Empresarial", BaseInterestRate = 12m };
        _mockService.Setup(x => x.CreateAsync(dto))
                    .ReturnsAsync(Result.Success(MakeDto("ct2")));

        var result = await _controller.Create(dto);

        result.Should().BeOfType<CreatedAtActionResult>();
    }

    [Fact]
    public async Task Create_WhenFailure_ShouldReturnBadRequest()
    {
        var dto = new CreateCreditTypeDto();
        _mockService.Setup(x => x.CreateAsync(dto))
                    .ReturnsAsync(Result.Failure<CreditTypeResponseDto>("Validation failed"));

        var result = await _controller.Create(dto);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ── Update ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Update_WhenSuccess_ShouldReturnOk()
    {
        var dto = new UpdateCreditTypeDto { Name = "Updated", BaseInterestRate = 18m };
        _mockService.Setup(x => x.UpdateAsync("ct1", dto))
                    .ReturnsAsync(Result.Success(MakeDto()));

        var result = await _controller.Update("ct1", dto);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task Update_WhenNotFound_ShouldReturnBadRequest()
    {
        var dto = new UpdateCreditTypeDto { Name = "Test" };
        _mockService.Setup(x => x.UpdateAsync("bad", dto))
                    .ReturnsAsync(Result.Failure<CreditTypeResponseDto>("Credit type not found"));

        var result = await _controller.Update("bad", dto);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_WhenSuccess_ShouldReturnOk()
    {
        _mockService.Setup(x => x.DeleteAsync("ct1"))
                    .ReturnsAsync(Result.Success(true));

        var result = await _controller.Delete("ct1");

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task Delete_WhenNotFound_ShouldReturnBadRequest()
    {
        _mockService.Setup(x => x.DeleteAsync("bad"))
                    .ReturnsAsync(Result.Failure<bool>("Credit type not found"));

        var result = await _controller.Delete("bad");

        result.Should().BeOfType<BadRequestObjectResult>();
    }
}
