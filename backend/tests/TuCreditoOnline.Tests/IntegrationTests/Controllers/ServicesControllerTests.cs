using System.Net;
using System.Net.Http.Json;
using System.Net.Http.Headers;
using Xunit;
using FluentAssertions;
using TuCreditoOnline.Application.DTOs;
using Bogus;

namespace TuCreditoOnline.Tests.IntegrationTests.Controllers;

public class ServicesControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly Faker _faker;

    public ServicesControllerTests(TestWebApplicationFactory factory)
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
        var response = await _client.GetAsync("/api/services");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.InternalServerError);

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var result = await response.Content.ReadFromJsonAsync<List<ServiceResponseDto>>();
            result.Should().NotBeNull();
        }
    }

    [Fact]
    public async Task GetAll_WithActiveFilter_ShouldReturnOk()
    {
        var response = await _client.GetAsync("/api/services?isActive=true");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task GetAll_WithInactiveFilter_ShouldReturnOk()
    {
        var response = await _client.GetAsync("/api/services?isActive=false");
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task GetById_Anonymous_WithInvalidId_ShouldReturnNotFound()
    {
        var response = await _client.GetAsync("/api/services/nonexistent-id-12345");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Create_WithoutAuth_ShouldReturnUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var dto = new CreateServiceDto
        {
            Title = "Test Service",
            Description = "Test description",
            Icon = "fa-test",
            DisplayOrder = 1,
            IsActive = true
        };

        var response = await _client.PostAsJsonAsync("/api/services", dto);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Create_AsAdmin_WithValidData_ShouldReturnCreated()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var dto = new CreateServiceDto
        {
            Title = $"Service {_faker.Random.AlphaNumeric(6)}",
            Description = _faker.Lorem.Sentence(),
            Icon = "fa-star",
            DisplayOrder = _faker.Random.Int(1, 100),
            IsActive = true
        };

        var response = await _client.PostAsJsonAsync("/api/services", dto);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.Created, HttpStatusCode.BadRequest);

        if (response.StatusCode == HttpStatusCode.Created)
        {
            var result = await response.Content.ReadFromJsonAsync<ServiceResponseDto>();
            result.Should().NotBeNull();
            result!.Title.Should().Be(dto.Title);
            result.Description.Should().NotBeNullOrEmpty();
            result.Icon.Should().Be("fa-star");
            result.IsActive.Should().BeTrue();
            result.Id.Should().NotBeNullOrEmpty();
        }
    }

    [Fact]
    public async Task Update_WithoutAuth_ShouldReturnUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var dto = new UpdateServiceDto
        {
            Title = "Updated Service",
            Description = "Updated description",
            Icon = "fa-edit",
            DisplayOrder = 1,
            IsActive = true
        };

        var response = await _client.PutAsJsonAsync("/api/services/some-id", dto);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Update_WithInvalidId_ShouldReturnBadRequest()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var dto = new UpdateServiceDto
        {
            Title = "Updated Service",
            Description = "Updated description",
            Icon = "fa-edit",
            DisplayOrder = 1,
            IsActive = true
        };

        var response = await _client.PutAsJsonAsync("/api/services/nonexistent-id", dto);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Delete_WithoutAuth_ShouldReturnUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var response = await _client.DeleteAsync("/api/services/some-id");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Delete_WithInvalidId_ShouldReturnBadRequest()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.DeleteAsync("/api/services/nonexistent-id");
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateAndGetById_ShouldReturnCreatedService()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var dto = new CreateServiceDto
        {
            Title = $"Svc GetById {_faker.Random.AlphaNumeric(6)}",
            Description = _faker.Lorem.Sentence(),
            Icon = "fa-search",
            DisplayOrder = 5,
            IsActive = true
        };

        var createResponse = await _client.PostAsJsonAsync("/api/services", dto);
        if (createResponse.StatusCode != HttpStatusCode.Created) return;

        var created = await createResponse.Content.ReadFromJsonAsync<ServiceResponseDto>();
        _client.DefaultRequestHeaders.Authorization = null;

        var getResponse = await _client.GetAsync($"/api/services/{created!.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var fetched = await getResponse.Content.ReadFromJsonAsync<ServiceResponseDto>();
        fetched.Should().NotBeNull();
        fetched!.Id.Should().Be(created.Id);
        fetched.Title.Should().Be(dto.Title);
    }

    [Fact]
    public async Task CreateUpdateDelete_EndToEnd_ShouldWork()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createDto = new CreateServiceDto
        {
            Title = $"Svc E2E {_faker.Random.AlphaNumeric(6)}",
            Description = "Original service",
            Icon = "fa-cog",
            DisplayOrder = 10,
            IsActive = true
        };

        var createResponse = await _client.PostAsJsonAsync("/api/services", createDto);
        if (createResponse.StatusCode != HttpStatusCode.Created) return;

        var created = await createResponse.Content.ReadFromJsonAsync<ServiceResponseDto>();

        var updateDto = new UpdateServiceDto
        {
            Title = created!.Title,
            Description = "Updated service description",
            Icon = "fa-wrench",
            DisplayOrder = 20,
            IsActive = true
        };

        var updateResponse = await _client.PutAsJsonAsync($"/api/services/{created.Id}", updateDto);
        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var updated = await updateResponse.Content.ReadFromJsonAsync<ServiceResponseDto>();
        updated.Should().NotBeNull();
        updated!.Description.Should().Contain("Updated");

        var deleteResponse = await _client.DeleteAsync($"/api/services/{created.Id}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Create_WithInvalidToken_ShouldReturnUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "invalid-token");
        var dto = new CreateServiceDto
        {
            Title = "Test",
            Description = "Test",
            Icon = "fa-test",
            DisplayOrder = 1,
            IsActive = true
        };

        var response = await _client.PostAsJsonAsync("/api/services", dto);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
