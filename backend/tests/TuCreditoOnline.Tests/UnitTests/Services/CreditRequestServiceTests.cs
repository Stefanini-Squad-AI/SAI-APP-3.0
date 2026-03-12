using Xunit;
using Moq;
using FluentAssertions;
using TuCreditoOnline.Infrastructure.Services;
using TuCreditoOnline.Infrastructure.Repositories;
using TuCreditoOnline.Domain.Entities;
using TuCreditoOnline.Application.DTOs;
using System.Linq.Expressions;
using TuCreditoOnline.Infrastructure.Persistence;

namespace TuCreditoOnline.Tests.UnitTests.Services;

public class CreditRequestServiceTests
{
    private readonly Mock<CreditRequestRepository> _mockRepository;
    private readonly CreditRequestService _service;

    public CreditRequestServiceTests()
    {
        _mockRepository = new Mock<CreditRequestRepository>();
        _service = new CreditRequestService(_mockRepository.Object);
    }

    [Fact]
    public async Task CreateCreditRequestAsync_WithValidData_ShouldSucceed()
    {
        // Arrange
        var dto = new CreateCreditRequestDto
        {
            FullName = "Juan Pérez",
            Email = "juan@example.com",
            Phone = "5551234567",
            RequestedAmount = 50000,
            TermYears = 3,
            EmploymentStatus = "Empleado",
            MonthlySalary = 15000,
            YearsOfEmployment = 5,
            CreditType = "Personal",
            UseOfMoney = "Gastos personales",
            InterestRate = 18,
            MonthlyPayment = 1807.80m,
            TotalPayment = 65080.80m,
            TotalInterest = 15080.80m
        };

        _mockRepository
            .Setup(x => x.AddAsync(It.IsAny<CreditRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((CreditRequest cr, CancellationToken ct) => cr);

        // Act
        var result = await _service.CreateCreditRequestAsync(dto);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data.FullName.Should().Be(dto.FullName);
        result.Data.Email.Should().Be(dto.Email);
        result.Data.Status.Should().Be("Pending");
        
        _mockRepository.Verify(x => x.AddAsync(It.IsAny<CreditRequest>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData("", "juan@example.com", "5551234567", 50000, "Full name")]
    [InlineData("Juan Pérez", "", "5551234567", 50000, "Email")]
    [InlineData("Juan Pérez", "juan@example.com", "", 50000, "Phone")]
    [InlineData("Juan Pérez", "juan@example.com", "5551234567", 0, "Requested amount")]
    [InlineData("Juan Pérez", "juan@example.com", "5551234567", -1000, "Requested amount")]
    public async Task CreateCreditRequestAsync_WithInvalidData_ShouldFail(
        string fullName, string email, string phone, decimal amount, string expectedError)
    {
        // Arrange
        var dto = new CreateCreditRequestDto
        {
            FullName = fullName,
            Email = email,
            Phone = phone,
            RequestedAmount = amount,
            TermYears = 3,
            EmploymentStatus = "Empleado",
            MonthlySalary = 15000,
            YearsOfEmployment = 5
        };

        // Act
        var result = await _service.CreateCreditRequestAsync(dto);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain(expectedError);
        
        _mockRepository.Verify(x => x.AddAsync(It.IsAny<CreditRequest>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task GetCreditRequestByIdAsync_WithValidId_ShouldReturnRequest()
    {
        // Arrange
        var requestId = "request-id-123";
        var creditRequest = new CreditRequest
        {
            Id = requestId,
            FullName = "Juan Pérez",
            Email = "juan@example.com",
            Status = "Pending",
            RequestedAmount = 50000
        };

        _mockRepository
            .Setup(x => x.GetByIdAsync(requestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(creditRequest);

        // Act
        var result = await _service.GetCreditRequestByIdAsync(requestId);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data.Id.Should().Be(requestId);
        result.Data.FullName.Should().Be("Juan Pérez");
    }

    [Fact]
    public async Task GetCreditRequestByIdAsync_WithInvalidId_ShouldFail()
    {
        // Arrange
        var requestId = "invalid-id";

        _mockRepository
            .Setup(x => x.GetByIdAsync(requestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((CreditRequest?)null);

        // Act
        var result = await _service.GetCreditRequestByIdAsync(requestId);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("not found");
    }

    [Fact]
    public async Task UpdateCreditRequestStatusAsync_WithValidData_ShouldSucceed()
    {
        // Arrange
        var requestId = "request-id-123";
        var creditRequest = new CreditRequest
        {
            Id = requestId,
            FullName = "Juan Pérez",
            Status = "Pending",
            RequestedAmount = 50000,
            TermYears = 3
        };

        var updateDto = new UpdateCreditRequestStatusDto
        {
            Status = "Approved",
            ApprovedAmount = 50000,
            ApprovedTermMonths = 36,
            Remarks = "Approved based on credit score"
        };

        _mockRepository
            .Setup(x => x.GetByIdAsync(requestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(creditRequest);

        _mockRepository
            .Setup(x => x.UpdateAsync(It.IsAny<CreditRequest>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.UpdateCreditRequestStatusAsync(requestId, updateDto);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data.Status.Should().Be("Approved");
        result.Data.ApprovedAmount.Should().Be(50000);
        result.Data.ApprovedTermMonths.Should().Be(36);
        
        _mockRepository.Verify(x => x.UpdateAsync(It.IsAny<CreditRequest>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateCreditRequestStatusAsync_WithNonPendingRequest_ShouldAllowUpdate()
    {
        // Arrange
        var requestId = "request-id-123";
        var creditRequest = new CreditRequest
        {
            Id = requestId,
            Status = "Approved", // Already approved
            RequestedAmount = 50000,
            TermYears = 3
        };

        var updateDto = new UpdateCreditRequestStatusDto
        {
            Status = "Rejected",
            Remarks = "Changed decision"
        };

        _mockRepository
            .Setup(x => x.GetByIdAsync(requestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(creditRequest);

        _mockRepository
            .Setup(x => x.UpdateAsync(It.IsAny<CreditRequest>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.UpdateCreditRequestStatusAsync(requestId, updateDto);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Status.Should().Be("Rejected");
        
        _mockRepository.Verify(x => x.UpdateAsync(It.IsAny<CreditRequest>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetCreditRequestsByStatusAsync_ShouldReturnFilteredRequests()
    {
        // Arrange
        var status = "Pending";
        var requests = new List<CreditRequest>
        {
            new CreditRequest { Id = "1", Status = "Pending", FullName = "User 1" },
            new CreditRequest { Id = "2", Status = "Pending", FullName = "User 2" }
        };

        _mockRepository
            .Setup(x => x.FindAsync(It.IsAny<Expression<Func<CreditRequest, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(requests);

        // Act
        var result = await _service.GetCreditRequestsByStatusAsync(status);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().HaveCount(2);
        result.Data.All(r => r.Status == status).Should().BeTrue();
    }

    [Fact]
    public async Task GetCreditRequestsByStatusAsync_WithAllStatus_ShouldReturnAllRequests()
    {
        // Arrange
        var requests = new List<CreditRequest>
        {
            new CreditRequest { Id = "1", Status = "Pending" },
            new CreditRequest { Id = "2", Status = "Approved" },
            new CreditRequest { Id = "3", Status = "Rejected" }
        };

        _mockRepository
            .Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(requests);

        // Act
        var result = await _service.GetCreditRequestsByStatusAsync("All");

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().HaveCount(3);
    }
}
