using TuCreditoOnline.Application.DTOs;
using TuCreditoOnline.Domain.Entities;
using TuCreditoOnline.Infrastructure.Repositories;
using TuCreditoOnline.Infrastructure.Services;

namespace TuCreditoOnline.Tests.UnitTests.Services;

public class CreditTypeServiceTests
{
    private readonly Mock<CreditTypeRepository> _mockRepo;
    private readonly CreditTypeService _service;

    public CreditTypeServiceTests()
    {
        _mockRepo = new Mock<CreditTypeRepository>();
        _service = new CreditTypeService(_mockRepo.Object);
    }

    private static CreditType MakeCreditType(string id = "ct1", string name = "Personal", bool isActive = true) =>
        new()
        {
            Id = id,
            Name = name,
            Description = "Crédito de prueba",
            BaseInterestRate = 15m,
            MinAmount = 1000m,
            MaxAmount = 100000m,
            MaxTermMonths = 60,
            MinTermMonths = 6,
            IsActive = isActive,
            CreatedAt = DateTime.UtcNow
        };

    // ── GetAllAsync ───────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAllAsync_WithoutFilter_ShouldReturnAllTypes()
    {
        var types = new List<CreditType>
        {
            MakeCreditType("ct1", "Personal", true),
            MakeCreditType("ct2", "Hipotecario", false)
        };
        _mockRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(types);

        var result = await _service.GetAllAsync();

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetAllAsync_WithActiveFilter_ShouldReturnOnlyActive()
    {
        var types = new List<CreditType>
        {
            MakeCreditType("ct1", "Personal", true),
            MakeCreditType("ct2", "Hipotecario", false)
        };
        _mockRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(types);

        var result = await _service.GetAllAsync(isActive: true);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().HaveCount(1);
        result.Data[0].Name.Should().Be("Personal");
    }

    [Fact]
    public async Task GetAllAsync_WithInactiveFilter_ShouldReturnOnlyInactive()
    {
        var types = new List<CreditType>
        {
            MakeCreditType("ct1", "Personal", true),
            MakeCreditType("ct2", "Hipotecario", false)
        };
        _mockRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(types);

        var result = await _service.GetAllAsync(isActive: false);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().HaveCount(1);
        result.Data[0].Name.Should().Be("Hipotecario");
    }

    [Fact]
    public async Task GetAllAsync_ShouldReturnTypesSortedByName()
    {
        var types = new List<CreditType>
        {
            MakeCreditType("ct2", "Zonal"),
            MakeCreditType("ct1", "Auto"),
            MakeCreditType("ct3", "Personal")
        };
        _mockRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(types);

        var result = await _service.GetAllAsync();

        result.IsSuccess.Should().BeTrue();
        result.Data[0].Name.Should().Be("Auto");
        result.Data[1].Name.Should().Be("Personal");
        result.Data[2].Name.Should().Be("Zonal");
    }

    [Fact]
    public async Task GetAllAsync_WhenExceptionThrown_ShouldReturnFailure()
    {
        _mockRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>())).ThrowsAsync(new Exception("DB error"));

        var result = await _service.GetAllAsync();

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Error fetching credit types");
    }

    // ── GetByIdAsync ──────────────────────────────────────────────────────────

    [Fact]
    public async Task GetByIdAsync_WithValidId_ShouldReturnCreditType()
    {
        _mockRepo.Setup(x => x.GetByIdAsync("ct1", It.IsAny<CancellationToken>())).ReturnsAsync(MakeCreditType());

        var result = await _service.GetByIdAsync("ct1");

        result.IsSuccess.Should().BeTrue();
        result.Data.Name.Should().Be("Personal");
        result.Data.BaseInterestRate.Should().Be(15m);
    }

    [Fact]
    public async Task GetByIdAsync_WithInvalidId_ShouldReturnFailure()
    {
        _mockRepo.Setup(x => x.GetByIdAsync("bad", It.IsAny<CancellationToken>())).ReturnsAsync((CreditType?)null);

        var result = await _service.GetByIdAsync("bad");

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("not found");
    }

    // ── CreateAsync ───────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateAsync_WithValidData_ShouldCreateCreditType()
    {
        var dto = new CreateCreditTypeDto
        {
            Name = "Empresarial",
            Description = "Crédito empresarial",
            BaseInterestRate = 12m,
            MinAmount = 10000m,
            MaxAmount = 500000m,
            MaxTermMonths = 120,
            MinTermMonths = 12,
            IsActive = true
        };
        _mockRepo.Setup(x => x.AddAsync(It.IsAny<CreditType>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync((CreditType ct, CancellationToken _) => ct);

        var result = await _service.CreateAsync(dto);

        result.IsSuccess.Should().BeTrue();
        result.Data.Name.Should().Be("Empresarial");
        result.Data.BaseInterestRate.Should().Be(12m);
        result.Data.MaxTermMonths.Should().Be(120);
        _mockRepo.Verify(x => x.AddAsync(It.IsAny<CreditType>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_WhenExceptionThrown_ShouldReturnFailure()
    {
        _mockRepo.Setup(x => x.AddAsync(It.IsAny<CreditType>(), It.IsAny<CancellationToken>()))
                 .ThrowsAsync(new Exception("DB error"));

        var result = await _service.CreateAsync(new CreateCreditTypeDto { Name = "Test" });

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("Error creating credit type");
    }

    // ── UpdateAsync ───────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateAsync_WithValidId_ShouldUpdateCreditType()
    {
        var existing = MakeCreditType("ct1", "Personal");
        var dto = new UpdateCreditTypeDto
        {
            Name = "Personal Plus",
            Description = "Updated description",
            BaseInterestRate = 18m,
            MinAmount = 5000m,
            MaxAmount = 200000m,
            MaxTermMonths = 72,
            MinTermMonths = 12,
            IsActive = true
        };
        _mockRepo.Setup(x => x.GetByIdAsync("ct1", It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        _mockRepo.Setup(x => x.UpdateAsync(It.IsAny<CreditType>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _service.UpdateAsync("ct1", dto);

        result.IsSuccess.Should().BeTrue();
        result.Data.Name.Should().Be("Personal Plus");
        result.Data.BaseInterestRate.Should().Be(18m);
        _mockRepo.Verify(x => x.UpdateAsync(It.IsAny<CreditType>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_WithInvalidId_ShouldReturnFailure()
    {
        _mockRepo.Setup(x => x.GetByIdAsync("bad", It.IsAny<CancellationToken>())).ReturnsAsync((CreditType?)null);

        var result = await _service.UpdateAsync("bad", new UpdateCreditTypeDto { Name = "Test" });

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("not found");
    }

    // ── DeleteAsync ───────────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteAsync_WithValidId_ShouldSucceed()
    {
        _mockRepo.Setup(x => x.GetByIdAsync("ct1", It.IsAny<CancellationToken>())).ReturnsAsync(MakeCreditType());
        _mockRepo.Setup(x => x.DeleteAsync("ct1", It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _service.DeleteAsync("ct1");

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().BeTrue();
        _mockRepo.Verify(x => x.DeleteAsync("ct1", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_WithInvalidId_ShouldReturnFailure()
    {
        _mockRepo.Setup(x => x.GetByIdAsync("bad", It.IsAny<CancellationToken>())).ReturnsAsync((CreditType?)null);

        var result = await _service.DeleteAsync("bad");

        result.IsSuccess.Should().BeFalse();
        result.Message.Should().Contain("not found");
    }
}
