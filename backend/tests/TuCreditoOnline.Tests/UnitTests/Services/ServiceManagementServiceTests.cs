using TuCreditoOnline.Application.DTOs;
using TuCreditoOnline.Domain.Entities;
using TuCreditoOnline.Infrastructure.Repositories;
using TuCreditoOnline.Infrastructure.Services;

namespace TuCreditoOnline.Tests.UnitTests.Services;

public class ServiceManagementServiceTests
{
    private readonly Mock<ServiceRepository> _mockRepo;
    private readonly ServiceManagementService _service;

    public ServiceManagementServiceTests()
    {
        _mockRepo = new Mock<ServiceRepository>();
        _service = new ServiceManagementService(_mockRepo.Object);
    }

    private static Service MakeService(string id = "s1", string title = "Service A", bool isActive = true, int order = 1) =>
        new()
        {
            Id = id,
            Title = title,
            Description = "Test description",
            Icon = "test-icon",
            DisplayOrder = order,
            IsActive = isActive,
            CreatedAt = DateTime.UtcNow
        };

    // ── GetAllAsync ───────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAllAsync_WithoutFilter_ShouldReturnAllServices()
    {
        var services = new List<Service>
        {
            MakeService("s1", "Service A", true, 1),
            MakeService("s2", "Service B", false, 2)
        };
        _mockRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(services);

        var result = await _service.GetAllAsync();

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetAllAsync_WithActiveFilter_ShouldReturnOnlyActive()
    {
        var services = new List<Service>
        {
            MakeService("s1", "Service A", true, 1),
            MakeService("s2", "Service B", false, 2)
        };
        _mockRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(services);

        var result = await _service.GetAllAsync(isActive: true);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().HaveCount(1);
        result.Data[0].Title.Should().Be("Service A");
    }

    [Fact]
    public async Task GetAllAsync_ShouldReturnServicesSortedByDisplayOrder()
    {
        var services = new List<Service>
        {
            MakeService("s3", "Service C", true, 3),
            MakeService("s1", "Service A", true, 1),
            MakeService("s2", "Service B", true, 2)
        };
        _mockRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(services);

        var result = await _service.GetAllAsync();

        result.IsSuccess.Should().BeTrue();
        result.Data[0].DisplayOrder.Should().Be(1);
        result.Data[1].DisplayOrder.Should().Be(2);
        result.Data[2].DisplayOrder.Should().Be(3);
    }

    [Fact]
    public async Task GetAllAsync_WhenExceptionThrown_ShouldReturnFailure()
    {
        _mockRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>())).ThrowsAsync(new Exception("DB error"));

        var result = await _service.GetAllAsync();

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Failed to fetch services");
    }

    // ── GetByIdAsync ──────────────────────────────────────────────────────────

    [Fact]
    public async Task GetByIdAsync_WithValidId_ShouldReturnService()
    {
        _mockRepo.Setup(x => x.GetByIdAsync("s1", It.IsAny<CancellationToken>())).ReturnsAsync(MakeService());

        var result = await _service.GetByIdAsync("s1");

        result.IsSuccess.Should().BeTrue();
        result.Data.Title.Should().Be("Service A");
        result.Data.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task GetByIdAsync_WithInvalidId_ShouldReturnFailure()
    {
        _mockRepo.Setup(x => x.GetByIdAsync("bad", It.IsAny<CancellationToken>())).ReturnsAsync((Service?)null);

        var result = await _service.GetByIdAsync("bad");

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("not found");
    }

    // ── CreateAsync ───────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateAsync_WithValidData_ShouldCreateService()
    {
        var dto = new CreateServiceDto
        {
            Title = "New Service",
            Description = "A brand new service",
            Icon = "new-icon",
            DisplayOrder = 5,
            IsActive = true
        };
        _mockRepo.Setup(x => x.AddAsync(It.IsAny<Service>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync((Service s, CancellationToken _) => s);

        var result = await _service.CreateAsync(dto);

        result.IsSuccess.Should().BeTrue();
        result.Data.Title.Should().Be("New Service");
        result.Data.DisplayOrder.Should().Be(5);
        _mockRepo.Verify(x => x.AddAsync(It.IsAny<Service>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_WhenExceptionThrown_ShouldReturnFailure()
    {
        _mockRepo.Setup(x => x.AddAsync(It.IsAny<Service>(), It.IsAny<CancellationToken>()))
                 .ThrowsAsync(new Exception("DB error"));

        var result = await _service.CreateAsync(new CreateServiceDto { Title = "Test" });

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Failed to create service");
    }

    // ── UpdateAsync ───────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateAsync_WithValidId_ShouldUpdateService()
    {
        var existing = MakeService("s1", "Old Title", true, 1);
        var dto = new UpdateServiceDto
        {
            Title = "Updated Title",
            Description = "Updated description",
            Icon = "updated-icon",
            DisplayOrder = 10,
            IsActive = false
        };
        _mockRepo.Setup(x => x.GetByIdAsync("s1", It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        _mockRepo.Setup(x => x.UpdateAsync(It.IsAny<Service>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _service.UpdateAsync("s1", dto);

        result.IsSuccess.Should().BeTrue();
        result.Data.Title.Should().Be("Updated Title");
        result.Data.IsActive.Should().BeFalse();
        result.Data.DisplayOrder.Should().Be(10);
        _mockRepo.Verify(x => x.UpdateAsync(It.IsAny<Service>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_WithInvalidId_ShouldReturnFailure()
    {
        _mockRepo.Setup(x => x.GetByIdAsync("bad", It.IsAny<CancellationToken>())).ReturnsAsync((Service?)null);

        var result = await _service.UpdateAsync("bad", new UpdateServiceDto { Title = "Test" });

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("not found");
    }

    // ── DeleteAsync ───────────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteAsync_WithValidId_ShouldSucceed()
    {
        _mockRepo.Setup(x => x.GetByIdAsync("s1", It.IsAny<CancellationToken>())).ReturnsAsync(MakeService());
        _mockRepo.Setup(x => x.DeleteAsync("s1", It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _service.DeleteAsync("s1");

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().BeTrue();
        _mockRepo.Verify(x => x.DeleteAsync("s1", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_WithInvalidId_ShouldReturnFailure()
    {
        _mockRepo.Setup(x => x.GetByIdAsync("bad", It.IsAny<CancellationToken>())).ReturnsAsync((Service?)null);

        var result = await _service.DeleteAsync("bad");

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("not found");
    }
}
