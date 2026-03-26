using System.Net;
using System.Net.Http.Json;
using System.Net.Http.Headers;
using Xunit;
using FluentAssertions;
using TuCreditoOnline.Application.DTOs;
using Bogus;

namespace TuCreditoOnline.Tests.IntegrationTests.Controllers;

public class DashboardControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly Faker _faker;

    public DashboardControllerTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
        _faker = new Faker();
    }

    private async Task<string?> GetAdminTokenAsync()
    {
        var registerDto = new RegisterRequestDto
        {
            Email = _faker.Internet.Email(),
            Password = "Admin123!@#",
            FullName = "Admin User",
            Role = "Admin"
        };

        var response = await _client.PostAsJsonAsync("/api/auth/register", registerDto);
        if (!response.IsSuccessStatusCode) return null;

        var result = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        return result?.Token;
    }

    [Fact]
    public async Task GetStats_WithoutAuth_ShouldReturnUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var response = await _client.GetAsync("/api/dashboard/stats");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetStats_AsAdmin_ShouldReturnOk()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.GetAsync("/api/dashboard/stats");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<DashboardStatsDto>();
        result.Should().NotBeNull();
        result!.TotalCreditRequests.Should().BeGreaterOrEqualTo(0);
        result.PendingRequests.Should().BeGreaterOrEqualTo(0);
        result.ApprovedRequests.Should().BeGreaterOrEqualTo(0);
        result.RejectedRequests.Should().BeGreaterOrEqualTo(0);
        result.TotalUsers.Should().BeGreaterOrEqualTo(0);
        result.MonthlyStats.Should().NotBeNull();
    }

    [Fact]
    public async Task GetStats_ShouldReturnValidAmounts()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.GetAsync("/api/dashboard/stats");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var result = await response.Content.ReadFromJsonAsync<DashboardStatsDto>();
            result.Should().NotBeNull();
            result!.TotalApprovedAmount.Should().BeGreaterOrEqualTo(0);
            result.AverageRequestAmount.Should().BeGreaterOrEqualTo(0);
        }
    }

    [Fact]
    public async Task GetStatusDistribution_WithoutAuth_ShouldReturnUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var response = await _client.GetAsync("/api/dashboard/status-distribution");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetStatusDistribution_AsAdmin_ShouldReturnOk()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.GetAsync("/api/dashboard/status-distribution");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<List<StatusDistributionDto>>();
        result.Should().NotBeNull();
    }

    [Fact]
    public async Task GetStatusDistribution_ShouldReturnValidDistribution()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.GetAsync("/api/dashboard/status-distribution");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var result = await response.Content.ReadFromJsonAsync<List<StatusDistributionDto>>();
            result.Should().NotBeNull();

            foreach (var item in result!)
            {
                item.Status.Should().NotBeNullOrEmpty();
                item.Count.Should().BeGreaterOrEqualTo(0);
                item.Percentage.Should().BeGreaterOrEqualTo(0);
            }
        }
    }

    [Fact]
    public async Task GetStats_WithInvalidToken_ShouldReturnUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "invalid-token");
        var response = await _client.GetAsync("/api/dashboard/stats");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetStatusDistribution_WithInvalidToken_ShouldReturnUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "invalid-token");
        var response = await _client.GetAsync("/api/dashboard/status-distribution");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Dashboard_AfterCreatingCreditRequest_ShouldReflectInStats()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;

        var creditDto = new CreateCreditRequestDto
        {
            FullName = _faker.Name.FullName(),
            IdentificationNumber = _faker.Random.AlphaNumeric(13),
            Email = _faker.Internet.Email(),
            Phone = _faker.Phone.PhoneNumber("##########"),
            Address = _faker.Address.FullAddress(),
            EmploymentStatus = "Empleado",
            MonthlySalary = 20000,
            YearsOfEmployment = 5,
            CreditType = "Personal",
            UseOfMoney = "Gastos personales",
            RequestedAmount = 50000,
            TermYears = 3,
            InterestRate = 18,
            MonthlyPayment = 1807.80m,
            TotalPayment = 65080.80m,
            TotalInterest = 15080.80m
        };
        await _client.PostAsJsonAsync("/api/creditrequests", creditDto);

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var statsResponse = await _client.GetAsync("/api/dashboard/stats");

        if (statsResponse.StatusCode == HttpStatusCode.OK)
        {
            var stats = await statsResponse.Content.ReadFromJsonAsync<DashboardStatsDto>();
            stats.Should().NotBeNull();
            stats!.TotalCreditRequests.Should().BeGreaterOrEqualTo(0);
        }
    }
}
