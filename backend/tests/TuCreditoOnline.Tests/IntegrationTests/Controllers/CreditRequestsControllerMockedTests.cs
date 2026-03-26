using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using Moq;
using TuCreditoOnline.Application.Common.Models;
using TuCreditoOnline.Application.DTOs;
using TuCreditoOnline.Domain.Entities;
using Xunit;

namespace TuCreditoOnline.Tests.IntegrationTests.Controllers;

[Collection("MockedIntegration")]
public class CreditRequestsControllerMockedTests : IClassFixture<MockedWebApplicationFactory>
{
    private readonly MockedWebApplicationFactory _factory;

    public CreditRequestsControllerMockedTests(MockedWebApplicationFactory factory)
        => _factory = factory;

    private HttpClient AdminClient()
    {
        var c = _factory.CreateClient();
        c.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestAuthHandler.AdminToken);
        return c;
    }

    private static CreateCreditRequestDto ValidCreateDto() => new()
    {
        FullName = "John Doe",
        IdentificationNumber = "123456",
        Email = "john@example.com",
        Phone = "555-1234",
        Address = "123 Main St",
        EmploymentStatus = "Employed",
        MonthlySalary = 3000,
        YearsOfEmployment = 2,
        CreditType = "Personal",
        UseOfMoney = "Home improvement",
        RequestedAmount = 10000,
        TermYears = 2,
        InterestRate = 12,
        MonthlyPayment = 470,
        TotalPayment = 11280,
        TotalInterest = 1280,
    };

    private static CreditRequest MakeCreditRequest(string id = "req1") =>
        new() { Id = id, FullName = "John Doe", Email = "john@example.com", Status = "Pending" };

    // ── CreateCreditRequest (public) ──────────────────────────────────────────

    [Fact]
    public async Task CreateCreditRequest_WhenSuccess_ReturnsCreated()
    {
        var dto = new CreditRequestResponseDto { Id = "req1", Status = "Pending" };
        _factory.MockCreditRequestService
            .Setup(s => s.CreateCreditRequestAsync(It.IsAny<CreateCreditRequestDto>()))
            .ReturnsAsync(Result<CreditRequestResponseDto>.Success(dto));

        var resp = await _factory.CreateClient().PostAsJsonAsync("/api/creditrequests", ValidCreateDto());

        resp.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task CreateCreditRequest_WhenFails_ReturnsBadRequest()
    {
        _factory.MockCreditRequestService
            .Setup(s => s.CreateCreditRequestAsync(It.IsAny<CreateCreditRequestDto>()))
            .ReturnsAsync(Result<CreditRequestResponseDto>.Failure("Validation failed"));

        var resp = await _factory.CreateClient().PostAsJsonAsync("/api/creditrequests", ValidCreateDto());

        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── GetAllCreditRequests (admin) ──────────────────────────────────────────

    [Fact]
    public async Task GetAllCreditRequests_ReturnsOk()
    {
        _factory.MockCreditRequestService
            .Setup(s => s.GetAllCreditRequestsAsync())
            .ReturnsAsync(Result<IEnumerable<CreditRequest>>.Success(
                new List<CreditRequest> { MakeCreditRequest() }));

        var resp = await AdminClient().GetAsync("/api/creditrequests");

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAllCreditRequests_WhenFails_Returns500()
    {
        _factory.MockCreditRequestService
            .Setup(s => s.GetAllCreditRequestsAsync())
            .ReturnsAsync(Result<IEnumerable<CreditRequest>>.Failure("DB error"));

        var resp = await AdminClient().GetAsync("/api/creditrequests");

        resp.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
    }

    // ── GetCreditRequestById (admin) ──────────────────────────────────────────

    [Fact]
    public async Task GetCreditRequestById_WhenFound_ReturnsOk()
    {
        _factory.MockCreditRequestService
            .Setup(s => s.GetCreditRequestByIdAsync("req1"))
            .ReturnsAsync(Result<CreditRequest>.Success(MakeCreditRequest("req1")));

        var resp = await AdminClient().GetAsync("/api/creditrequests/req1");

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetCreditRequestById_WhenNotFound_ReturnsNotFound()
    {
        _factory.MockCreditRequestService
            .Setup(s => s.GetCreditRequestByIdAsync("none"))
            .ReturnsAsync(Result<CreditRequest>.Failure("Not found"));

        var resp = await AdminClient().GetAsync("/api/creditrequests/none");

        resp.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── GetCreditRequestsByStatus (admin) ─────────────────────────────────────

    [Fact]
    public async Task GetCreditRequestsByStatus_ReturnsOk()
    {
        _factory.MockCreditRequestService
            .Setup(s => s.GetCreditRequestsByStatusAsync("Pending"))
            .ReturnsAsync(Result<IEnumerable<CreditRequest>>.Success(
                new List<CreditRequest> { MakeCreditRequest() }));

        var resp = await AdminClient().GetAsync("/api/creditrequests/status/Pending");

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetCreditRequestsByStatus_WhenFails_Returns500()
    {
        _factory.MockCreditRequestService
            .Setup(s => s.GetCreditRequestsByStatusAsync(It.IsAny<string>()))
            .ReturnsAsync(Result<IEnumerable<CreditRequest>>.Failure("Error"));

        var resp = await AdminClient().GetAsync("/api/creditrequests/status/Unknown");

        resp.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
    }

    // ── UpdateCreditRequestStatus (admin) ─────────────────────────────────────

    [Fact]
    public async Task UpdateCreditRequestStatus_WhenSuccess_ReturnsOk()
    {
        _factory.MockCreditRequestService
            .Setup(s => s.UpdateCreditRequestStatusAsync("req1", It.IsAny<UpdateCreditRequestStatusDto>()))
            .ReturnsAsync(Result<CreditRequest>.Success(MakeCreditRequest("req1")));

        var body = new UpdateCreditRequestStatusDto { Status = "Approved" };
        var resp = await AdminClient().PatchAsJsonAsync("/api/creditrequests/req1/status", body);

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task UpdateCreditRequestStatus_WhenFails_ReturnsBadRequest()
    {
        _factory.MockCreditRequestService
            .Setup(s => s.UpdateCreditRequestStatusAsync("req1", It.IsAny<UpdateCreditRequestStatusDto>()))
            .ReturnsAsync(Result<CreditRequest>.Failure("Invalid status"));

        var body = new UpdateCreditRequestStatusDto { Status = "Bad" };
        var resp = await AdminClient().PatchAsJsonAsync("/api/creditrequests/req1/status", body);

        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── ApproveCreditRequest (admin) ──────────────────────────────────────────

    [Fact]
    public async Task ApproveCreditRequest_WhenSuccess_ReturnsOk()
    {
        _factory.MockCreditRequestService
            .Setup(s => s.UpdateCreditRequestStatusAsync("req1", It.Is<UpdateCreditRequestStatusDto>(d => d.Status == "Approved")))
            .ReturnsAsync(Result<CreditRequest>.Success(MakeCreditRequest("req1")));

        var resp = await AdminClient().PostAsJsonAsync("/api/creditrequests/req1/approve",
            new UpdateCreditRequestStatusDto());

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ApproveCreditRequest_WhenFails_ReturnsBadRequest()
    {
        _factory.MockCreditRequestService
            .Setup(s => s.UpdateCreditRequestStatusAsync("req1", It.IsAny<UpdateCreditRequestStatusDto>()))
            .ReturnsAsync(Result<CreditRequest>.Failure("Already approved"));

        var resp = await AdminClient().PostAsJsonAsync("/api/creditrequests/req1/approve",
            new UpdateCreditRequestStatusDto());

        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── RejectCreditRequest (admin) ───────────────────────────────────────────

    [Fact]
    public async Task RejectCreditRequest_WhenSuccess_ReturnsOk()
    {
        _factory.MockCreditRequestService
            .Setup(s => s.UpdateCreditRequestStatusAsync("req1", It.Is<UpdateCreditRequestStatusDto>(d => d.Status == "Rejected")))
            .ReturnsAsync(Result<CreditRequest>.Success(MakeCreditRequest("req1")));

        var resp = await AdminClient().PostAsJsonAsync("/api/creditrequests/req1/reject",
            new UpdateCreditRequestStatusDto());

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task RejectCreditRequest_WhenFails_ReturnsBadRequest()
    {
        _factory.MockCreditRequestService
            .Setup(s => s.UpdateCreditRequestStatusAsync("req1", It.IsAny<UpdateCreditRequestStatusDto>()))
            .ReturnsAsync(Result<CreditRequest>.Failure("Already closed"));

        var resp = await AdminClient().PostAsJsonAsync("/api/creditrequests/req1/reject",
            new UpdateCreditRequestStatusDto());

        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
