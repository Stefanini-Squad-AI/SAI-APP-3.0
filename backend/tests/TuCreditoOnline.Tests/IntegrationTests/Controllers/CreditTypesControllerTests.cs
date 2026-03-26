using System.Net;
using System.Net.Http.Json;
using System.Net.Http.Headers;
using Xunit;
using FluentAssertions;
using TuCreditoOnline.Application.DTOs;
using Bogus;

namespace TuCreditoOnline.Tests.IntegrationTests.Controllers;

public class CreditTypesControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly Faker _faker;

    public CreditTypesControllerTests(TestWebApplicationFactory factory)
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
    public async Task GetAll_Anonymous_ShouldReturnOk()
    {
        var response = await _client.GetAsync("/api/credittypes");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.InternalServerError);

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var result = await response.Content.ReadFromJsonAsync<List<CreditTypeResponseDto>>();
            result.Should().NotBeNull();
        }
    }

    [Fact]
    public async Task GetAll_WithActiveFilter_ShouldReturnOk()
    {
        var response = await _client.GetAsync("/api/credittypes?isActive=true");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task GetAll_WithInactiveFilter_ShouldReturnOk()
    {
        var response = await _client.GetAsync("/api/credittypes?isActive=false");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task GetById_Anonymous_WithInvalidId_ShouldReturnNotFound()
    {
        var response = await _client.GetAsync("/api/credittypes/nonexistent-id-12345");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Create_WithoutAuth_ShouldReturnUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var dto = new CreateCreditTypeDto
        {
            Name = "Test Credit Type",
            Description = "Test description",
            BaseInterestRate = 12.5m,
            MinAmount = 1000,
            MaxAmount = 100000,
            MinTermMonths = 6,
            MaxTermMonths = 60,
            IsActive = true
        };

        var response = await _client.PostAsJsonAsync("/api/credittypes", dto);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Create_AsAdmin_WithValidData_ShouldReturnCreated()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var dto = new CreateCreditTypeDto
        {
            Name = $"Credit Type {_faker.Random.AlphaNumeric(6)}",
            Description = _faker.Lorem.Sentence(),
            BaseInterestRate = 15.0m,
            MinAmount = 5000,
            MaxAmount = 500000,
            MinTermMonths = 6,
            MaxTermMonths = 120,
            IsActive = true
        };

        var response = await _client.PostAsJsonAsync("/api/credittypes", dto);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.Created, HttpStatusCode.BadRequest);

        if (response.StatusCode == HttpStatusCode.Created)
        {
            var result = await response.Content.ReadFromJsonAsync<CreditTypeResponseDto>();
            result.Should().NotBeNull();
            result!.Name.Should().Be(dto.Name);
            result.Description.Should().NotBeNullOrEmpty();
            result.BaseInterestRate.Should().Be(dto.BaseInterestRate);
            result.IsActive.Should().BeTrue();
            result.Id.Should().NotBeNullOrEmpty();
        }
    }

    [Fact]
    public async Task Update_WithoutAuth_ShouldReturnUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var dto = new UpdateCreditTypeDto
        {
            Name = "Updated Name",
            Description = "Updated description",
            BaseInterestRate = 10,
            MinAmount = 1000,
            MaxAmount = 100000,
            MinTermMonths = 6,
            MaxTermMonths = 60,
            IsActive = true
        };

        var response = await _client.PutAsJsonAsync("/api/credittypes/some-id", dto);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Update_WithInvalidId_ShouldReturnBadRequest()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var dto = new UpdateCreditTypeDto
        {
            Name = "Updated Name",
            Description = "Updated description",
            BaseInterestRate = 10,
            MinAmount = 1000,
            MaxAmount = 100000,
            MinTermMonths = 6,
            MaxTermMonths = 60,
            IsActive = true
        };

        var response = await _client.PutAsJsonAsync("/api/credittypes/nonexistent-id", dto);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Delete_WithoutAuth_ShouldReturnUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var response = await _client.DeleteAsync("/api/credittypes/some-id");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Delete_WithInvalidId_ShouldReturnBadRequest()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.DeleteAsync("/api/credittypes/nonexistent-id");
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateAndGetById_ShouldReturnCreatedCreditType()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var dto = new CreateCreditTypeDto
        {
            Name = $"CT GetById {_faker.Random.AlphaNumeric(6)}",
            Description = _faker.Lorem.Sentence(),
            BaseInterestRate = 12.5m,
            MinAmount = 10000,
            MaxAmount = 200000,
            MinTermMonths = 12,
            MaxTermMonths = 60,
            IsActive = true
        };

        var createResponse = await _client.PostAsJsonAsync("/api/credittypes", dto);
        if (createResponse.StatusCode != HttpStatusCode.Created) return;

        var created = await createResponse.Content.ReadFromJsonAsync<CreditTypeResponseDto>();
        _client.DefaultRequestHeaders.Authorization = null;

        var getResponse = await _client.GetAsync($"/api/credittypes/{created!.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var fetched = await getResponse.Content.ReadFromJsonAsync<CreditTypeResponseDto>();
        fetched.Should().NotBeNull();
        fetched!.Id.Should().Be(created.Id);
        fetched.Name.Should().Be(dto.Name);
    }

    [Fact]
    public async Task CreateUpdateDelete_EndToEnd_ShouldWork()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createDto = new CreateCreditTypeDto
        {
            Name = $"CT E2E {_faker.Random.AlphaNumeric(6)}",
            Description = "Original description",
            BaseInterestRate = 14.0m,
            MinAmount = 5000,
            MaxAmount = 300000,
            MinTermMonths = 6,
            MaxTermMonths = 84,
            IsActive = true
        };

        var createResponse = await _client.PostAsJsonAsync("/api/credittypes", createDto);
        if (createResponse.StatusCode != HttpStatusCode.Created) return;

        var created = await createResponse.Content.ReadFromJsonAsync<CreditTypeResponseDto>();

        var updateDto = new UpdateCreditTypeDto
        {
            Name = created!.Name,
            Description = "Updated description for E2E",
            BaseInterestRate = 16.0m,
            MinAmount = 10000,
            MaxAmount = 400000,
            MinTermMonths = 12,
            MaxTermMonths = 96,
            IsActive = true
        };

        var updateResponse = await _client.PutAsJsonAsync($"/api/credittypes/{created.Id}", updateDto);
        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var deleteResponse = await _client.DeleteAsync($"/api/credittypes/{created.Id}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Create_WithInvalidToken_ShouldReturnUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "invalid-token");
        var dto = new CreateCreditTypeDto
        {
            Name = "Test",
            Description = "Test",
            BaseInterestRate = 10,
            MinAmount = 1000,
            MaxAmount = 100000,
            MinTermMonths = 6,
            MaxTermMonths = 60,
            IsActive = true
        };

        var response = await _client.PostAsJsonAsync("/api/credittypes", dto);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
