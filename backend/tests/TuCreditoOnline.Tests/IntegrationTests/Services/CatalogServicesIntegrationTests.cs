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
/// Integration-layer tests for CreditTypeService and ServiceManagementService.
/// These run the real service implementations against mocked repositories,
/// covering CRUD paths that are not exercised by the HTTP-level mocked tests.
/// </summary>
public class CatalogServicesIntegrationTests
{
    // ── CreditTypeService ─────────────────────────────────────────────────────

    private readonly Mock<CreditTypeRepository> _ctRepo = new();
    private readonly CreditTypeService _ctSvc;

    private readonly Mock<ServiceRepository> _svcRepo = new();
    private readonly ServiceManagementService _svcMgmt;

    public CatalogServicesIntegrationTests()
    {
        _ctSvc = new CreditTypeService(_ctRepo.Object);
        _svcMgmt = new ServiceManagementService(_svcRepo.Object);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static CreditType MakeCreditType(string id = "ct1", string name = "Personal", bool active = true) =>
        new() { Id = id, Name = name, Description = "Test", BaseInterestRate = 15m,
                MinAmount = 1000m, MaxAmount = 100000m, MaxTermMonths = 60,
                MinTermMonths = 6, IsActive = active, CreatedAt = DateTime.UtcNow };

    private static TuCreditoOnline.Domain.Entities.Service MakeSvc(string id = "s1", bool active = true) =>
        new() { Id = id, Title = "Loans", Description = "Test",
                Icon = "icon.svg", DisplayOrder = 1, IsActive = active, CreatedAt = DateTime.UtcNow };

    // ── CreditTypeService: GetAllAsync ────────────────────────────────────────

    [Fact]
    public async Task CreditType_GetAll_ReturnsAllTypes()
    {
        _ctRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
               .ReturnsAsync(new List<CreditType> { MakeCreditType("1", "A", true), MakeCreditType("2", "B", false) });

        var result = await _ctSvc.GetAllAsync();

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().HaveCount(2);
    }

    [Fact]
    public async Task CreditType_GetAll_WithActiveFilter_ReturnsOnlyActive()
    {
        _ctRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
               .ReturnsAsync(new List<CreditType> { MakeCreditType("1", "A", true), MakeCreditType("2", "B", false) });

        var result = await _ctSvc.GetAllAsync(isActive: true);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().HaveCount(1);
    }

    [Fact]
    public async Task CreditType_GetAll_WhenException_ReturnsFailure()
    {
        _ctRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ThrowsAsync(new Exception("DB error"));

        var result = await _ctSvc.GetAllAsync();

        result.IsSuccess.Should().BeFalse();
    }

    // ── CreditTypeService: GetByIdAsync ───────────────────────────────────────

    [Fact]
    public async Task CreditType_GetById_WhenFound_ReturnsDto()
    {
        _ctRepo.Setup(r => r.GetByIdAsync("ct1", It.IsAny<CancellationToken>())).ReturnsAsync(MakeCreditType());

        var result = await _ctSvc.GetByIdAsync("ct1");

        result.IsSuccess.Should().BeTrue();
        result.Data.Name.Should().Be("Personal");
    }

    [Fact]
    public async Task CreditType_GetById_WhenNotFound_ReturnsFailure()
    {
        _ctRepo.Setup(r => r.GetByIdAsync("x", It.IsAny<CancellationToken>())).ReturnsAsync((CreditType?)null);

        var result = await _ctSvc.GetByIdAsync("x");

        result.IsSuccess.Should().BeFalse();
    }

    // ── CreditTypeService: CreateAsync ────────────────────────────────────────

    [Fact]
    public async Task CreditType_Create_WithValidData_ReturnsCreatedDto()
    {
        _ctRepo.Setup(r => r.AddAsync(It.IsAny<CreditType>(), It.IsAny<CancellationToken>()))
               .ReturnsAsync((CreditType ct, CancellationToken _) => ct);

        var dto = new CreateCreditTypeDto
        {
            Name = "Empresarial", Description = "Desc", BaseInterestRate = 12m,
            MinAmount = 10000m, MaxAmount = 500000m, MaxTermMonths = 120, MinTermMonths = 12, IsActive = true
        };

        var result = await _ctSvc.CreateAsync(dto);

        result.IsSuccess.Should().BeTrue();
        result.Data.Name.Should().Be("Empresarial");
    }

    [Fact]
    public async Task CreditType_Create_WhenException_ReturnsFailure()
    {
        _ctRepo.Setup(r => r.AddAsync(It.IsAny<CreditType>(), It.IsAny<CancellationToken>()))
               .ThrowsAsync(new Exception("DB error"));

        var result = await _ctSvc.CreateAsync(new CreateCreditTypeDto { Name = "X" });

        result.IsSuccess.Should().BeFalse();
    }

    // ── CreditTypeService: UpdateAsync ────────────────────────────────────────

    [Fact]
    public async Task CreditType_Update_WhenFound_ReturnsUpdatedDto()
    {
        _ctRepo.Setup(r => r.GetByIdAsync("ct1", It.IsAny<CancellationToken>())).ReturnsAsync(MakeCreditType());
        _ctRepo.Setup(r => r.UpdateAsync(It.IsAny<CreditType>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var dto = new UpdateCreditTypeDto
        {
            Name = "Updated", Description = "Desc2", BaseInterestRate = 20m,
            MinAmount = 5000m, MaxAmount = 200000m, MaxTermMonths = 72, MinTermMonths = 12, IsActive = true
        };

        var result = await _ctSvc.UpdateAsync("ct1", dto);

        result.IsSuccess.Should().BeTrue();
        result.Data.Name.Should().Be("Updated");
    }

    [Fact]
    public async Task CreditType_Update_WhenNotFound_ReturnsFailure()
    {
        _ctRepo.Setup(r => r.GetByIdAsync("x", It.IsAny<CancellationToken>())).ReturnsAsync((CreditType?)null);

        var result = await _ctSvc.UpdateAsync("x", new UpdateCreditTypeDto { Name = "X" });

        result.IsSuccess.Should().BeFalse();
    }

    // ── CreditTypeService: DeleteAsync ────────────────────────────────────────

    [Fact]
    public async Task CreditType_Delete_WhenFound_Succeeds()
    {
        _ctRepo.Setup(r => r.GetByIdAsync("ct1", It.IsAny<CancellationToken>())).ReturnsAsync(MakeCreditType());
        _ctRepo.Setup(r => r.DeleteAsync("ct1", It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _ctSvc.DeleteAsync("ct1");

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task CreditType_Delete_WhenNotFound_ReturnsFailure()
    {
        _ctRepo.Setup(r => r.GetByIdAsync("x", It.IsAny<CancellationToken>())).ReturnsAsync((CreditType?)null);

        var result = await _ctSvc.DeleteAsync("x");

        result.IsSuccess.Should().BeFalse();
    }

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║  ServiceManagementService                                              ║
    // ╚════════════════════════════════════════════════════════════════════════╝

    [Fact]
    public async Task Svc_GetAll_ReturnsAllServices()
    {
        _svcRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<TuCreditoOnline.Domain.Entities.Service> { MakeSvc("1", true), MakeSvc("2", false) });

        var result = await _svcMgmt.GetAllAsync();

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().HaveCount(2);
    }

    [Fact]
    public async Task Svc_GetAll_WithActiveFilter_ReturnsOnlyActive()
    {
        _svcRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<TuCreditoOnline.Domain.Entities.Service> { MakeSvc("1", true), MakeSvc("2", false) });

        var result = await _svcMgmt.GetAllAsync(isActive: true);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().HaveCount(1);
    }

    [Fact]
    public async Task Svc_GetAll_WhenException_ReturnsFailure()
    {
        _svcRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ThrowsAsync(new Exception("error"));

        var result = await _svcMgmt.GetAllAsync();

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Svc_GetById_WhenFound_ReturnsDto()
    {
        _svcRepo.Setup(r => r.GetByIdAsync("s1", It.IsAny<CancellationToken>())).ReturnsAsync(MakeSvc());

        var result = await _svcMgmt.GetByIdAsync("s1");

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task Svc_GetById_WhenNotFound_ReturnsFailure()
    {
        _svcRepo.Setup(r => r.GetByIdAsync("x", It.IsAny<CancellationToken>())).ReturnsAsync((TuCreditoOnline.Domain.Entities.Service?)null);

        var result = await _svcMgmt.GetByIdAsync("x");

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Svc_Create_WithValidData_ReturnsCreatedDto()
    {
        _svcRepo.Setup(r => r.AddAsync(It.IsAny<TuCreditoOnline.Domain.Entities.Service>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((TuCreditoOnline.Domain.Entities.Service svc, CancellationToken _) => svc);

        var dto = new CreateServiceDto
        {
            Title = "New Service", Description = "Desc", Icon = "icon.svg", DisplayOrder = 2, IsActive = true
        };

        var result = await _svcMgmt.CreateAsync(dto);

        result.IsSuccess.Should().BeTrue();
        result.Data.Title.Should().Be("New Service");
    }

    [Fact]
    public async Task Svc_Create_WhenException_ReturnsFailure()
    {
        _svcRepo.Setup(r => r.AddAsync(It.IsAny<TuCreditoOnline.Domain.Entities.Service>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(new Exception("DB error"));

        var result = await _svcMgmt.CreateAsync(new CreateServiceDto { Title = "X" });

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Svc_Update_WhenFound_ReturnsUpdatedDto()
    {
        _svcRepo.Setup(r => r.GetByIdAsync("s1", It.IsAny<CancellationToken>())).ReturnsAsync(MakeSvc());
        _svcRepo.Setup(r => r.UpdateAsync(It.IsAny<TuCreditoOnline.Domain.Entities.Service>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _svcMgmt.UpdateAsync("s1", new UpdateServiceDto { Title = "Updated", IsActive = true, DisplayOrder = 3 });

        result.IsSuccess.Should().BeTrue();
        result.Data.Title.Should().Be("Updated");
    }

    [Fact]
    public async Task Svc_Update_WhenNotFound_ReturnsFailure()
    {
        _svcRepo.Setup(r => r.GetByIdAsync("x", It.IsAny<CancellationToken>())).ReturnsAsync((TuCreditoOnline.Domain.Entities.Service?)null);

        var result = await _svcMgmt.UpdateAsync("x", new UpdateServiceDto { Title = "X" });

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Svc_Delete_WhenFound_Succeeds()
    {
        _svcRepo.Setup(r => r.GetByIdAsync("s1", It.IsAny<CancellationToken>())).ReturnsAsync(MakeSvc());
        _svcRepo.Setup(r => r.DeleteAsync("s1", It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _svcMgmt.DeleteAsync("s1");

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task Svc_Delete_WhenNotFound_ReturnsFailure()
    {
        _svcRepo.Setup(r => r.GetByIdAsync("x", It.IsAny<CancellationToken>())).ReturnsAsync((TuCreditoOnline.Domain.Entities.Service?)null);

        var result = await _svcMgmt.DeleteAsync("x");

        result.IsSuccess.Should().BeFalse();
    }
}
