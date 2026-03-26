using System.Linq.Expressions;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using TuCreditoOnline.Application.DTOs;
using TuCreditoOnline.Domain.Entities;
using TuCreditoOnline.Infrastructure.Repositories;
using TuCreditoOnline.Infrastructure.Services;
using Xunit;

namespace TuCreditoOnline.Tests.IntegrationTests.Services;

/// <summary>
/// Integration-layer tests for ContactMessageService and CreditRequestService.
/// Tests run real service implementations with mocked repositories.
/// </summary>
public class MessageCreditServicesIntegrationTests
{
    // ── ContactMessageService ─────────────────────────────────────────────────

    private readonly Mock<ContactMessageRepository> _msgRepo = new();
    private readonly Mock<ILogger<ContactMessageService>> _msgLog = new();
    private readonly ContactMessageService _msgSvc;

    // ── CreditRequestService ──────────────────────────────────────────────────

    private readonly Mock<CreditRequestRepository> _crRepo = new();
    private readonly CreditRequestService _crSvc;

    public MessageCreditServicesIntegrationTests()
    {
        _msgSvc = new ContactMessageService(_msgRepo.Object, _msgLog.Object);
        _crSvc = new CreditRequestService(_crRepo.Object);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static ContactMessage MakeMsg(string id = "m1") =>
        new() { Id = id, Name = "Test", Email = "t@t.com", Subject = "Hi",
                Message = "Body", Status = ContactMessageStatus.New, CreatedAt = DateTime.UtcNow };

    private static CreditRequest MakeCR(string id = "cr1", string status = "Pending") =>
        new() { Id = id, FullName = "John", Email = "j@j.com",
                IdentificationNumber = "123", Phone = "555", Address = "Addr",
                RequestedAmount = 10000m, Status = status, CreatedAt = DateTime.UtcNow };

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║  ContactMessageService                                                 ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    [Fact]
    public async Task Msg_GetAll_WithoutFilter_ReturnsAll()
    {
        _msgRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<ContactMessage> { MakeMsg("1"), MakeMsg("2") });

        var result = await _msgSvc.GetAllAsync();

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().HaveCount(2);
    }

    [Fact]
    public async Task Msg_GetAll_WithStatusFilter_CallsGetByStatus()
    {
        _msgRepo.Setup(r => r.GetByStatusAsync(ContactMessageStatus.New))
                .ReturnsAsync(new List<ContactMessage> { MakeMsg() });

        var result = await _msgSvc.GetAllAsync(status: 0); // 0 = New

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().HaveCount(1);
    }

    [Fact]
    public async Task Msg_GetAll_WhenException_ReturnsFailure()
    {
        _msgRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ThrowsAsync(new Exception("DB error"));

        var result = await _msgSvc.GetAllAsync();

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Msg_GetById_WhenFound_ReturnsDto()
    {
        _msgRepo.Setup(r => r.GetByIdAsync("m1", It.IsAny<CancellationToken>())).ReturnsAsync(MakeMsg());

        var result = await _msgSvc.GetByIdAsync("m1");

        result.IsSuccess.Should().BeTrue();
        result.Data.Name.Should().Be("Test");
    }

    [Fact]
    public async Task Msg_GetById_WhenNotFound_ReturnsFailure()
    {
        _msgRepo.Setup(r => r.GetByIdAsync("x", It.IsAny<CancellationToken>())).ReturnsAsync((ContactMessage?)null);

        var result = await _msgSvc.GetByIdAsync("x");

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Msg_GetPending_ReturnsPendingMessages()
    {
        _msgRepo.Setup(r => r.GetPendingMessagesAsync())
                .ReturnsAsync(new List<ContactMessage> { MakeMsg() });

        var result = await _msgSvc.GetPendingMessagesAsync();

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().HaveCount(1);
    }

    [Fact]
    public async Task Msg_GetPending_WhenException_ReturnsFailure()
    {
        _msgRepo.Setup(r => r.GetPendingMessagesAsync()).ThrowsAsync(new Exception("DB error"));

        var result = await _msgSvc.GetPendingMessagesAsync();

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Msg_GetStats_ReturnsCorrectCounts()
    {
        var counts = new Dictionary<ContactMessageStatus, int>
        {
            [ContactMessageStatus.New] = 3,
            [ContactMessageStatus.InProgress] = 1,
            [ContactMessageStatus.Replied] = 2,
            [ContactMessageStatus.Closed] = 4,
        };
        _msgRepo.Setup(r => r.GetStatusCountsAsync()).ReturnsAsync(counts);
        _msgRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<ContactMessage> { MakeMsg() });

        var result = await _msgSvc.GetStatsAsync();

        result.IsSuccess.Should().BeTrue();
        result.Data.TotalMessages.Should().Be(1);
        result.Data.NewMessages.Should().Be(3);
    }

    [Fact]
    public async Task Msg_GetStats_WhenException_ReturnsFailure()
    {
        _msgRepo.Setup(r => r.GetStatusCountsAsync()).ThrowsAsync(new Exception("DB error"));

        var result = await _msgSvc.GetStatsAsync();

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Msg_UpdateStatus_NewToInProgress_Succeeds()
    {
        var msg = MakeMsg();
        _msgRepo.Setup(r => r.GetByIdAsync("m1", It.IsAny<CancellationToken>())).ReturnsAsync(msg);
        _msgRepo.Setup(r => r.UpdateAsync(It.IsAny<ContactMessage>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _msgSvc.UpdateStatusAsync("m1", new UpdateContactMessageStatusDto { Status = 1 }, "admin@test.com");

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task Msg_UpdateStatus_WhenNotFound_ReturnsFailure()
    {
        _msgRepo.Setup(r => r.GetByIdAsync("x", It.IsAny<CancellationToken>())).ReturnsAsync((ContactMessage?)null);

        var result = await _msgSvc.UpdateStatusAsync("x", new UpdateContactMessageStatusDto { Status = 1 }, "admin@test.com");

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Msg_UpdateStatus_ToReplied_SetRespondedAt()
    {
        var msg = MakeMsg();
        msg.Status = ContactMessageStatus.InProgress;
        _msgRepo.Setup(r => r.GetByIdAsync("m1", It.IsAny<CancellationToken>())).ReturnsAsync(msg);
        _msgRepo.Setup(r => r.UpdateAsync(It.IsAny<ContactMessage>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _msgSvc.UpdateStatusAsync("m1", new UpdateContactMessageStatusDto { Status = 2 }, "admin@test.com");

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task Msg_UpdateStatus_ToClosed_SetClosedAt()
    {
        var msg = MakeMsg();
        msg.Status = ContactMessageStatus.Replied;
        _msgRepo.Setup(r => r.GetByIdAsync("m1", It.IsAny<CancellationToken>())).ReturnsAsync(msg);
        _msgRepo.Setup(r => r.UpdateAsync(It.IsAny<ContactMessage>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _msgSvc.UpdateStatusAsync("m1", new UpdateContactMessageStatusDto { Status = 3 }, "admin@test.com");

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task Msg_Delete_WhenFound_Succeeds()
    {
        _msgRepo.Setup(r => r.GetByIdAsync("m1", It.IsAny<CancellationToken>())).ReturnsAsync(MakeMsg());
        _msgRepo.Setup(r => r.DeleteAsync("m1", It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _msgSvc.DeleteAsync("m1");

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task Msg_Delete_WhenNotFound_ReturnsFailure()
    {
        _msgRepo.Setup(r => r.GetByIdAsync("x", It.IsAny<CancellationToken>())).ReturnsAsync((ContactMessage?)null);

        var result = await _msgSvc.DeleteAsync("x");

        result.IsSuccess.Should().BeFalse();
    }

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║  CreditRequestService                                                  ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    [Fact]
    public async Task CR_GetAll_ReturnsAllRequests()
    {
        _crRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
               .ReturnsAsync(new List<CreditRequest> { MakeCR("1"), MakeCR("2") });

        var result = await _crSvc.GetAllCreditRequestsAsync();

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task CR_GetAll_WhenException_ReturnsFailure()
    {
        _crRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ThrowsAsync(new Exception("DB error"));

        var result = await _crSvc.GetAllCreditRequestsAsync();

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task CR_GetById_WhenFound_ReturnsCreditRequest()
    {
        _crRepo.Setup(r => r.GetByIdAsync("cr1", It.IsAny<CancellationToken>())).ReturnsAsync(MakeCR());

        var result = await _crSvc.GetCreditRequestByIdAsync("cr1");

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task CR_GetById_WhenNotFound_ReturnsFailure()
    {
        _crRepo.Setup(r => r.GetByIdAsync("x", It.IsAny<CancellationToken>())).ReturnsAsync((CreditRequest?)null);

        var result = await _crSvc.GetCreditRequestByIdAsync("x");

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task CR_GetById_WhenException_ReturnsFailure()
    {
        _crRepo.Setup(r => r.GetByIdAsync("cr1", It.IsAny<CancellationToken>())).ThrowsAsync(new Exception("DB error"));

        var result = await _crSvc.GetCreditRequestByIdAsync("cr1");

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task CR_GetByStatus_ReturnsFilteredRequests()
    {
        _crRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<CreditRequest, bool>>>(), It.IsAny<CancellationToken>()))
               .ReturnsAsync(new List<CreditRequest> { MakeCR("1", "Pending") });

        var result = await _crSvc.GetCreditRequestsByStatusAsync("Pending");

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task CR_GetByStatus_AllStatus_ReturnsAll()
    {
        _crRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
               .ReturnsAsync(new List<CreditRequest> { MakeCR("1"), MakeCR("2") });

        var result = await _crSvc.GetCreditRequestsByStatusAsync("All");

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task CR_GetByStatus_WhenException_ReturnsFailure()
    {
        _crRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<CreditRequest, bool>>>(), It.IsAny<CancellationToken>()))
               .ThrowsAsync(new Exception("DB error"));

        var result = await _crSvc.GetCreditRequestsByStatusAsync("Pending");

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task CR_UpdateStatus_Approved_SetsApprovedDate()
    {
        _crRepo.Setup(r => r.GetByIdAsync("cr1", It.IsAny<CancellationToken>())).ReturnsAsync(MakeCR());
        _crRepo.Setup(r => r.UpdateAsync(It.IsAny<CreditRequest>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _crSvc.UpdateCreditRequestStatusAsync("cr1", new UpdateCreditRequestStatusDto
        {
            Status = "Approved", ApprovedAmount = 10000m, ApprovedTermMonths = 24
        });

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task CR_UpdateStatus_Rejected_SetsRejectedDate()
    {
        _crRepo.Setup(r => r.GetByIdAsync("cr1", It.IsAny<CancellationToken>())).ReturnsAsync(MakeCR());
        _crRepo.Setup(r => r.UpdateAsync(It.IsAny<CreditRequest>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _crSvc.UpdateCreditRequestStatusAsync("cr1", new UpdateCreditRequestStatusDto
        {
            Status = "Rejected", Remarks = "Not eligible"
        });

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task CR_UpdateStatus_WhenNotFound_ReturnsFailure()
    {
        _crRepo.Setup(r => r.GetByIdAsync("x", It.IsAny<CancellationToken>())).ReturnsAsync((CreditRequest?)null);

        var result = await _crSvc.UpdateCreditRequestStatusAsync("x", new UpdateCreditRequestStatusDto { Status = "Approved" });

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task CR_UpdateStatus_WithInvalidStatus_ReturnsFailure()
    {
        _crRepo.Setup(r => r.GetByIdAsync("cr1", It.IsAny<CancellationToken>())).ReturnsAsync(MakeCR());

        var result = await _crSvc.UpdateCreditRequestStatusAsync("cr1", new UpdateCreditRequestStatusDto { Status = "BadStatus" });

        result.IsSuccess.Should().BeFalse();
    }
}
