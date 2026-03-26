using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TuCreditoOnline.API.Controllers;
using TuCreditoOnline.Application.Common.Models;
using TuCreditoOnline.Application.DTOs;
using TuCreditoOnline.Domain.Entities;
using TuCreditoOnline.Infrastructure.Repositories;
using TuCreditoOnline.Infrastructure.Services;

namespace TuCreditoOnline.Tests.UnitTests.Controllers;

public class CreditRequestsControllerTests
{
    private readonly Mock<CreditRequestService> _mockService;
    private readonly CreditRequestsController _controller;

    public CreditRequestsControllerTests()
    {
        _mockService = new Mock<CreditRequestService>((CreditRequestRepository)null!);
        var mockLogger = new Mock<ILogger<CreditRequestsController>>();
        _controller = new CreditRequestsController(_mockService.Object, mockLogger.Object);
    }

    private static CreditRequestResponseDto MakeResponseDto(string id = "cr1") => new()
    {
        Id = id, FullName = "Juan", Email = "juan@a.com", Status = "Pending",
        RequestedAmount = 50000m, RequestDate = DateTime.UtcNow
    };

    private static CreditRequest MakeEntity(string id = "cr1") => new()
    {
        Id = id, FullName = "Juan", Email = "juan@a.com", Status = "Pending", RequestedAmount = 50000m
    };

    // ── CreateCreditRequest ───────────────────────────────────────────────────

    [Fact]
    public async Task CreateCreditRequest_WhenSuccess_ShouldReturnCreated()
    {
        var dto = new CreateCreditRequestDto
        {
            FullName = "Juan", Email = "juan@a.com", Phone = "5551234567",
            RequestedAmount = 50000m, TermYears = 3, MonthlySalary = 15000m
        };
        _mockService.Setup(x => x.CreateCreditRequestAsync(dto))
                    .ReturnsAsync(Result.Success(MakeResponseDto()));

        var result = await _controller.CreateCreditRequest(dto);

        result.Should().BeOfType<CreatedAtActionResult>();
    }

    [Fact]
    public async Task CreateCreditRequest_WhenValidationFails_ShouldReturnBadRequest()
    {
        var dto = new CreateCreditRequestDto { FullName = "" };
        _mockService.Setup(x => x.CreateCreditRequestAsync(dto))
                    .ReturnsAsync(Result.Failure<CreditRequestResponseDto>("Full name is required"));

        var result = await _controller.CreateCreditRequest(dto);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ── GetAllCreditRequests ──────────────────────────────────────────────────

    [Fact]
    public async Task GetAllCreditRequests_WhenSuccess_ShouldReturnOk()
    {
        var requests = new List<CreditRequest> { MakeEntity() };
        _mockService.Setup(x => x.GetAllCreditRequestsAsync())
                    .ReturnsAsync(Result.Success<IEnumerable<CreditRequest>>(requests));

        var result = await _controller.GetAllCreditRequests();

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetAllCreditRequests_WhenFailure_ShouldReturn500()
    {
        _mockService.Setup(x => x.GetAllCreditRequestsAsync())
                    .ReturnsAsync(Result.Failure<IEnumerable<CreditRequest>>("DB error"));

        var result = await _controller.GetAllCreditRequests();

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(500);
    }

    // ── GetCreditRequestById ──────────────────────────────────────────────────

    [Fact]
    public async Task GetCreditRequestById_WhenFound_ShouldReturnOk()
    {
        _mockService.Setup(x => x.GetCreditRequestByIdAsync("cr1"))
                    .ReturnsAsync(Result.Success(MakeEntity()));

        var result = await _controller.GetCreditRequestById("cr1");

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetCreditRequestById_WhenNotFound_ShouldReturnNotFound()
    {
        _mockService.Setup(x => x.GetCreditRequestByIdAsync("bad"))
                    .ReturnsAsync(Result.Failure<CreditRequest>("Credit request not found"));

        var result = await _controller.GetCreditRequestById("bad");

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    // ── GetCreditRequestsByStatus ─────────────────────────────────────────────

    [Fact]
    public async Task GetCreditRequestsByStatus_WhenSuccess_ShouldReturnOk()
    {
        var requests = new List<CreditRequest> { MakeEntity() };
        _mockService.Setup(x => x.GetCreditRequestsByStatusAsync("Pending"))
                    .ReturnsAsync(Result.Success<IEnumerable<CreditRequest>>(requests));

        var result = await _controller.GetCreditRequestsByStatus("Pending");

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetCreditRequestsByStatus_WhenFailure_ShouldReturn500()
    {
        _mockService.Setup(x => x.GetCreditRequestsByStatusAsync(It.IsAny<string>()))
                    .ReturnsAsync(Result.Failure<IEnumerable<CreditRequest>>("Error"));

        var result = await _controller.GetCreditRequestsByStatus("All");

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(500);
    }

    // ── UpdateCreditRequestStatus ─────────────────────────────────────────────

    [Fact]
    public async Task UpdateCreditRequestStatus_WhenSuccess_ShouldReturnOk()
    {
        var dto = new UpdateCreditRequestStatusDto { Status = "Approved" };
        _mockService.Setup(x => x.UpdateCreditRequestStatusAsync("cr1", dto))
                    .ReturnsAsync(Result.Success(MakeEntity()));

        var result = await _controller.UpdateCreditRequestStatus("cr1", dto);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task UpdateCreditRequestStatus_WhenFailure_ShouldReturnBadRequest()
    {
        var dto = new UpdateCreditRequestStatusDto { Status = "Invalid" };
        _mockService.Setup(x => x.UpdateCreditRequestStatusAsync("cr1", dto))
                    .ReturnsAsync(Result.Failure<CreditRequest>("Invalid status"));

        var result = await _controller.UpdateCreditRequestStatus("cr1", dto);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ── ApproveCreditRequest ──────────────────────────────────────────────────

    [Fact]
    public async Task ApproveCreditRequest_WhenSuccess_ShouldReturnOk()
    {
        _mockService.Setup(x => x.UpdateCreditRequestStatusAsync(
                        "cr1",
                        It.Is<UpdateCreditRequestStatusDto>(d => d.Status == "Approved")))
                    .ReturnsAsync(Result.Success(MakeEntity()));

        var result = await _controller.ApproveCreditRequest("cr1", null);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task ApproveCreditRequest_WhenFailure_ShouldReturnBadRequest()
    {
        _mockService.Setup(x => x.UpdateCreditRequestStatusAsync(It.IsAny<string>(), It.IsAny<UpdateCreditRequestStatusDto>()))
                    .ReturnsAsync(Result.Failure<CreditRequest>("Not found"));

        var result = await _controller.ApproveCreditRequest("bad", null);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ── RejectCreditRequest ───────────────────────────────────────────────────

    [Fact]
    public async Task RejectCreditRequest_WhenSuccess_ShouldReturnOk()
    {
        _mockService.Setup(x => x.UpdateCreditRequestStatusAsync(
                        "cr1",
                        It.Is<UpdateCreditRequestStatusDto>(d => d.Status == "Rejected")))
                    .ReturnsAsync(Result.Success(MakeEntity()));

        var result = await _controller.RejectCreditRequest("cr1", null);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RejectCreditRequest_WhenFailure_ShouldReturnBadRequest()
    {
        _mockService.Setup(x => x.UpdateCreditRequestStatusAsync(It.IsAny<string>(), It.IsAny<UpdateCreditRequestStatusDto>()))
                    .ReturnsAsync(Result.Failure<CreditRequest>("Not found"));

        var result = await _controller.RejectCreditRequest("bad", null);

        result.Should().BeOfType<BadRequestObjectResult>();
    }
}
