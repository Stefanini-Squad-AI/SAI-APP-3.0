using Microsoft.Extensions.Logging;
using TuCreditoOnline.Application.DTOs;
using TuCreditoOnline.Domain.Entities;
using TuCreditoOnline.Infrastructure.Repositories;
using TuCreditoOnline.Infrastructure.Services;

namespace TuCreditoOnline.Tests.UnitTests.Services;

public class ContactMessageServiceTests
{
    private readonly Mock<ContactMessageRepository> _mockRepo;
    private readonly Mock<ILogger<ContactMessageService>> _mockLogger;
    private readonly ContactMessageService _service;

    public ContactMessageServiceTests()
    {
        _mockRepo = new Mock<ContactMessageRepository>();
        _mockLogger = new Mock<ILogger<ContactMessageService>>();
        _service = new ContactMessageService(_mockRepo.Object, _mockLogger.Object);
    }

    private static ContactMessage MakeMessage(string id = "m1", ContactMessageStatus status = ContactMessageStatus.New) =>
        new()
        {
            Id = id,
            Name = "John Doe",
            Email = "john@example.com",
            Subject = "Test Subject",
            Message = "Test Message",
            Status = status,
            CreatedAt = DateTime.UtcNow
        };

    // ── CreateAsync ───────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateAsync_WithValidData_ShouldReturnNewMessage()
    {
        var dto = new CreateContactMessageDto
        {
            Name = "  Jane Doe  ",
            Email = "JANE@EXAMPLE.COM",
            Subject = "  Hello  ",
            Message = "  Test message  "
        };
        _mockRepo.Setup(x => x.AddAsync(It.IsAny<ContactMessage>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync((ContactMessage m, CancellationToken _) => m);

        var result = await _service.CreateAsync(dto);

        result.IsSuccess.Should().BeTrue();
        result.Data.Name.Should().Be("Jane Doe");
        result.Data.Email.Should().Be("jane@example.com");
        result.Data.Subject.Should().Be("Hello");
        result.Data.Status.Should().Be((int)ContactMessageStatus.New);
        result.Data.StatusText.Should().Be("New");
    }

    [Fact]
    public async Task CreateAsync_WhenExceptionThrown_ShouldReturnFailure()
    {
        _mockRepo.Setup(x => x.AddAsync(It.IsAny<ContactMessage>(), It.IsAny<CancellationToken>()))
                 .ThrowsAsync(new Exception("DB error"));

        var result = await _service.CreateAsync(new CreateContactMessageDto
        {
            Name = "User", Email = "u@a.com", Subject = "S", Message = "M"
        });

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Failed to create message");
    }

    // ── GetAllAsync ───────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAllAsync_WithoutFilter_ShouldReturnAllMessages()
    {
        var messages = new List<ContactMessage>
        {
            MakeMessage("m1", ContactMessageStatus.New),
            MakeMessage("m2", ContactMessageStatus.Replied)
        };
        _mockRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(messages);

        var result = await _service.GetAllAsync();

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetAllAsync_WithValidStatusFilter_ShouldCallGetByStatus()
    {
        var messages = new List<ContactMessage> { MakeMessage("m1", ContactMessageStatus.New) };
        _mockRepo.Setup(x => x.GetByStatusAsync(ContactMessageStatus.New)).ReturnsAsync(messages);

        var result = await _service.GetAllAsync(0);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().HaveCount(1);
        _mockRepo.Verify(x => x.GetByStatusAsync(ContactMessageStatus.New), Times.Once);
    }

    [Fact]
    public async Task GetAllAsync_WithInvalidStatusValue_ShouldReturnAllMessages()
    {
        var messages = new List<ContactMessage> { MakeMessage() };
        _mockRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(messages);

        var result = await _service.GetAllAsync(99);

        result.IsSuccess.Should().BeTrue();
        _mockRepo.Verify(x => x.GetAllAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    // ── GetByIdAsync ──────────────────────────────────────────────────────────

    [Fact]
    public async Task GetByIdAsync_WithValidId_ShouldReturnMessage()
    {
        _mockRepo.Setup(x => x.GetByIdAsync("m1", It.IsAny<CancellationToken>())).ReturnsAsync(MakeMessage("m1"));

        var result = await _service.GetByIdAsync("m1");

        result.IsSuccess.Should().BeTrue();
        result.Data.Id.Should().Be("m1");
        result.Data.Email.Should().Be("john@example.com");
    }

    [Fact]
    public async Task GetByIdAsync_WithInvalidId_ShouldReturnFailure()
    {
        _mockRepo.Setup(x => x.GetByIdAsync("bad", It.IsAny<CancellationToken>())).ReturnsAsync((ContactMessage?)null);

        var result = await _service.GetByIdAsync("bad");

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("not found");
    }

    // ── UpdateStatusAsync ─────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateStatusAsync_NewToInProgress_ShouldSucceed()
    {
        var message = MakeMessage("m1", ContactMessageStatus.New);
        var dto = new UpdateContactMessageStatusDto { Status = (int)ContactMessageStatus.InProgress };
        _mockRepo.Setup(x => x.GetByIdAsync("m1", It.IsAny<CancellationToken>())).ReturnsAsync(message);
        _mockRepo.Setup(x => x.UpdateAsync(It.IsAny<ContactMessage>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _service.UpdateStatusAsync("m1", dto, "admin@a.com");

        result.IsSuccess.Should().BeTrue();
        result.Data.Status.Should().Be((int)ContactMessageStatus.InProgress);
        result.Data.StatusText.Should().Be("In Progress");
    }

    [Fact]
    public async Task UpdateStatusAsync_ToReplied_ShouldSetRespondedAtAndBy()
    {
        var message = MakeMessage("m1", ContactMessageStatus.InProgress);
        var dto = new UpdateContactMessageStatusDto
        {
            Status = (int)ContactMessageStatus.Replied,
            AdminNotes = "Reply sent"
        };
        _mockRepo.Setup(x => x.GetByIdAsync("m1", It.IsAny<CancellationToken>())).ReturnsAsync(message);
        _mockRepo.Setup(x => x.UpdateAsync(It.IsAny<ContactMessage>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _service.UpdateStatusAsync("m1", dto, "admin@a.com");

        result.IsSuccess.Should().BeTrue();
        result.Data.RespondedBy.Should().Be("admin@a.com");
        result.Data.RespondedAt.Should().NotBeNull();
        result.Data.AdminNotes.Should().Be("Reply sent");
    }

    [Fact]
    public async Task UpdateStatusAsync_ToClosed_ShouldSetClosedAtAndBy()
    {
        var message = MakeMessage("m1", ContactMessageStatus.Replied);
        var dto = new UpdateContactMessageStatusDto { Status = (int)ContactMessageStatus.Closed };
        _mockRepo.Setup(x => x.GetByIdAsync("m1", It.IsAny<CancellationToken>())).ReturnsAsync(message);
        _mockRepo.Setup(x => x.UpdateAsync(It.IsAny<ContactMessage>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _service.UpdateStatusAsync("m1", dto, "admin@a.com");

        result.IsSuccess.Should().BeTrue();
        result.Data.ClosedBy.Should().Be("admin@a.com");
        result.Data.ClosedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task UpdateStatusAsync_ToNew_ShouldAlwaysFail()
    {
        var message = MakeMessage("m1", ContactMessageStatus.InProgress);
        var dto = new UpdateContactMessageStatusDto { Status = (int)ContactMessageStatus.New };
        _mockRepo.Setup(x => x.GetByIdAsync("m1", It.IsAny<CancellationToken>())).ReturnsAsync(message);

        var result = await _service.UpdateStatusAsync("m1", dto, "admin@a.com");

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Invalid status transition");
    }

    [Fact]
    public async Task UpdateStatusAsync_ClosedToReplied_ShouldFail()
    {
        var message = MakeMessage("m1", ContactMessageStatus.Closed);
        var dto = new UpdateContactMessageStatusDto { Status = (int)ContactMessageStatus.Replied };
        _mockRepo.Setup(x => x.GetByIdAsync("m1", It.IsAny<CancellationToken>())).ReturnsAsync(message);

        var result = await _service.UpdateStatusAsync("m1", dto, "admin@a.com");

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Invalid status transition");
    }

    [Fact]
    public async Task UpdateStatusAsync_WithNonExistentMessage_ShouldReturnFailure()
    {
        _mockRepo.Setup(x => x.GetByIdAsync("bad", It.IsAny<CancellationToken>())).ReturnsAsync((ContactMessage?)null);

        var result = await _service.UpdateStatusAsync("bad", new UpdateContactMessageStatusDto { Status = 1 }, "admin@a.com");

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("not found");
    }

    // ── GetPendingMessagesAsync ───────────────────────────────────────────────

    [Fact]
    public async Task GetPendingMessagesAsync_ShouldReturnPendingMessages()
    {
        var messages = new List<ContactMessage>
        {
            MakeMessage("m1", ContactMessageStatus.New),
            MakeMessage("m2", ContactMessageStatus.InProgress)
        };
        _mockRepo.Setup(x => x.GetPendingMessagesAsync()).ReturnsAsync(messages);

        var result = await _service.GetPendingMessagesAsync();

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetPendingMessagesAsync_WhenExceptionThrown_ShouldReturnFailure()
    {
        _mockRepo.Setup(x => x.GetPendingMessagesAsync()).ThrowsAsync(new Exception("DB error"));

        var result = await _service.GetPendingMessagesAsync();

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Failed to fetch pending messages");
    }

    // ── GetStatsAsync ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetStatsAsync_ShouldReturnCorrectCounts()
    {
        var messages = new List<ContactMessage>
        {
            MakeMessage("m1", ContactMessageStatus.New),
            new() { Id = "m2", Status = ContactMessageStatus.Replied, Name = "U", Email = "u@a.com",
                    Subject = "S", Message = "M", CreatedAt = DateTime.UtcNow.AddHours(-3),
                    RespondedAt = DateTime.UtcNow }
        };
        var statusCounts = new Dictionary<ContactMessageStatus, int>
        {
            { ContactMessageStatus.New, 1 },
            { ContactMessageStatus.Replied, 1 }
        };
        _mockRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(messages);
        _mockRepo.Setup(x => x.GetStatusCountsAsync()).ReturnsAsync(statusCounts);

        var result = await _service.GetStatsAsync();

        result.IsSuccess.Should().BeTrue();
        result.Data.TotalMessages.Should().Be(2);
        result.Data.NewMessages.Should().Be(1);
        result.Data.RespondedMessages.Should().Be(1);
        result.Data.AverageResponseTimeHours.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task GetStatsAsync_WithNoRespondedMessages_ShouldReturnZeroAverage()
    {
        var messages = new List<ContactMessage> { MakeMessage() };
        _mockRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(messages);
        _mockRepo.Setup(x => x.GetStatusCountsAsync())
                 .ReturnsAsync(new Dictionary<ContactMessageStatus, int> { { ContactMessageStatus.New, 1 } });

        var result = await _service.GetStatsAsync();

        result.IsSuccess.Should().BeTrue();
        result.Data.AverageResponseTimeHours.Should().Be(0);
    }

    // ── DeleteAsync ───────────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteAsync_WithValidId_ShouldSucceed()
    {
        _mockRepo.Setup(x => x.GetByIdAsync("m1", It.IsAny<CancellationToken>())).ReturnsAsync(MakeMessage());
        _mockRepo.Setup(x => x.DeleteAsync("m1", It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _service.DeleteAsync("m1");

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().BeTrue();
        _mockRepo.Verify(x => x.DeleteAsync("m1", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_WithInvalidId_ShouldReturnFailure()
    {
        _mockRepo.Setup(x => x.GetByIdAsync("bad", It.IsAny<CancellationToken>())).ReturnsAsync((ContactMessage?)null);

        var result = await _service.DeleteAsync("bad");

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("not found");
    }
}
