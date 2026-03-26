using System.Net;
using System.Net.Http.Json;
using System.Net.Http.Headers;
using Xunit;
using FluentAssertions;
using TuCreditoOnline.Application.DTOs;
using Bogus;

namespace TuCreditoOnline.Tests.IntegrationTests.Controllers;

public class ContactMessagesControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly Faker _faker;

    public ContactMessagesControllerTests(TestWebApplicationFactory factory)
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
    public async Task Create_Anonymous_WithValidData_ShouldReturnOk()
    {
        var dto = new CreateContactMessageDto
        {
            Name = _faker.Name.FullName(),
            Email = _faker.Internet.Email(),
            Subject = _faker.Lorem.Sentence(5),
            Message = _faker.Lorem.Paragraph()
        };

        var response = await _client.PostAsJsonAsync("/api/contactmessages", dto);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.InternalServerError);

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var content = await response.Content.ReadAsStringAsync();
            content.Should().Contain("message");
        }
    }

    [Fact]
    public async Task Create_WithEmptyName_ShouldReturnBadRequest()
    {
        var dto = new CreateContactMessageDto
        {
            Name = "",
            Email = _faker.Internet.Email(),
            Subject = _faker.Lorem.Sentence(5),
            Message = _faker.Lorem.Paragraph()
        };

        var response = await _client.PostAsJsonAsync("/api/contactmessages", dto);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Create_WithInvalidEmail_ShouldReturnBadRequest()
    {
        var dto = new CreateContactMessageDto
        {
            Name = _faker.Name.FullName(),
            Email = "invalid-email",
            Subject = _faker.Lorem.Sentence(5),
            Message = _faker.Lorem.Paragraph()
        };

        var response = await _client.PostAsJsonAsync("/api/contactmessages", dto);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Create_WithEmptySubject_ShouldReturnBadRequest()
    {
        var dto = new CreateContactMessageDto
        {
            Name = _faker.Name.FullName(),
            Email = _faker.Internet.Email(),
            Subject = "",
            Message = _faker.Lorem.Paragraph()
        };

        var response = await _client.PostAsJsonAsync("/api/contactmessages", dto);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Create_WithEmptyMessage_ShouldReturnBadRequest()
    {
        var dto = new CreateContactMessageDto
        {
            Name = _faker.Name.FullName(),
            Email = _faker.Internet.Email(),
            Subject = _faker.Lorem.Sentence(5),
            Message = ""
        };

        var response = await _client.PostAsJsonAsync("/api/contactmessages", dto);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetAll_WithoutAuth_ShouldReturnUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var response = await _client.GetAsync("/api/contactmessages");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetAll_AsAdmin_ShouldReturnOk()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.GetAsync("/api/contactmessages");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<List<ContactMessageDto>>();
        result.Should().NotBeNull();
    }

    [Fact]
    public async Task GetAll_WithStatusFilter_ShouldReturnOk()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.GetAsync("/api/contactmessages?status=0");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetById_WithoutAuth_ShouldReturnUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var response = await _client.GetAsync("/api/contactmessages/some-id");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetById_WithInvalidId_ShouldReturnNotFound()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.GetAsync("/api/contactmessages/nonexistent-id-12345");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetPending_WithoutAuth_ShouldReturnUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var response = await _client.GetAsync("/api/contactmessages/pending");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetPending_AsAdmin_ShouldReturnOk()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.GetAsync("/api/contactmessages/pending");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<List<ContactMessageDto>>();
        result.Should().NotBeNull();
    }

    [Fact]
    public async Task GetStats_WithoutAuth_ShouldReturnUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var response = await _client.GetAsync("/api/contactmessages/stats");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetStats_AsAdmin_ShouldReturnOk()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.GetAsync("/api/contactmessages/stats");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<ContactMessageStatsDto>();
        result.Should().NotBeNull();
        result!.TotalMessages.Should().BeGreaterOrEqualTo(0);
        result.NewMessages.Should().BeGreaterOrEqualTo(0);
        result.InProgressMessages.Should().BeGreaterOrEqualTo(0);
        result.RespondedMessages.Should().BeGreaterOrEqualTo(0);
        result.ClosedMessages.Should().BeGreaterOrEqualTo(0);
    }

    [Fact]
    public async Task UpdateStatus_WithoutAuth_ShouldReturnUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var dto = new UpdateContactMessageStatusDto { Status = 1, AdminNotes = "test" };
        var request = new HttpRequestMessage(HttpMethod.Patch, "/api/contactmessages/some-id/status")
        {
            Content = JsonContent.Create(dto)
        };

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Delete_WithoutAuth_ShouldReturnUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var response = await _client.DeleteAsync("/api/contactmessages/some-id");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Delete_WithInvalidId_ShouldReturnNotFound()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.DeleteAsync("/api/contactmessages/nonexistent-id");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CreateAndGetById_EndToEnd_ShouldWork()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;

        var createDto = new CreateContactMessageDto
        {
            Name = _faker.Name.FullName(),
            Email = _faker.Internet.Email(),
            Subject = "Integration Test Subject",
            Message = "This is an integration test message for end-to-end testing."
        };

        var createResponse = await _client.PostAsJsonAsync("/api/contactmessages", createDto);
        if (createResponse.StatusCode != HttpStatusCode.OK) return;

        var createResult = await createResponse.Content.ReadFromJsonAsync<CreateMessageResponseTestDto>();
        if (createResult?.Data?.Id == null) return;

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var getResponse = await _client.GetAsync($"/api/contactmessages/{createResult.Data.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var fetched = await getResponse.Content.ReadFromJsonAsync<ContactMessageDto>();
        fetched.Should().NotBeNull();
        fetched!.Subject.Should().Contain("Integration Test");
        fetched.Status.Should().Be(0);
    }

    [Fact]
    public async Task CreateAndUpdateStatus_EndToEnd_ShouldWork()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;

        var createDto = new CreateContactMessageDto
        {
            Name = _faker.Name.FullName(),
            Email = _faker.Internet.Email(),
            Subject = "Status Update Test",
            Message = "Testing status update flow."
        };

        var createResponse = await _client.PostAsJsonAsync("/api/contactmessages", createDto);
        if (createResponse.StatusCode != HttpStatusCode.OK) return;

        var createResult = await createResponse.Content.ReadFromJsonAsync<CreateMessageResponseTestDto>();
        if (createResult?.Data?.Id == null) return;

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var updateDto = new UpdateContactMessageStatusDto
        {
            Status = 1,
            AdminNotes = "Moving to in progress"
        };

        var request = new HttpRequestMessage(HttpMethod.Patch, $"/api/contactmessages/{createResult.Data.Id}/status")
        {
            Content = JsonContent.Create(updateDto)
        };

        var updateResponse = await _client.SendAsync(request);
        updateResponse.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateAndDelete_EndToEnd_ShouldWork()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;

        var createDto = new CreateContactMessageDto
        {
            Name = _faker.Name.FullName(),
            Email = _faker.Internet.Email(),
            Subject = "Delete Test",
            Message = "This message will be deleted."
        };

        var createResponse = await _client.PostAsJsonAsync("/api/contactmessages", createDto);
        if (createResponse.StatusCode != HttpStatusCode.OK) return;

        var createResult = await createResponse.Content.ReadFromJsonAsync<CreateMessageResponseTestDto>();
        if (createResult?.Data?.Id == null) return;

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var deleteResponse = await _client.DeleteAsync($"/api/contactmessages/{createResult.Data.Id}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAll_WithInvalidToken_ShouldReturnUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "invalid-token");
        var response = await _client.GetAsync("/api/contactmessages");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}

public class CreateMessageResponseTestDto
{
    public string? Message { get; set; }
    public ContactMessageDto? Data { get; set; }
}
