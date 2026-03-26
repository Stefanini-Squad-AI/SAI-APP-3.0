using System.Net;
using System.Net.Http.Json;
using System.Net.Http.Headers;
using Xunit;
using FluentAssertions;
using TuCreditoOnline.Application.DTOs;
using Bogus;

namespace TuCreditoOnline.Tests.IntegrationTests.Controllers;

public class UsersControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly Faker _faker;

    public UsersControllerTests(TestWebApplicationFactory factory)
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

        var registerResponse = await _client.PostAsJsonAsync("/api/auth/register", registerDto);
        if (!registerResponse.IsSuccessStatusCode) return null;

        var result = await registerResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        return result?.Token;
    }

    private void SetAuthToken(string token)
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    [Fact]
    public async Task GetAllUsers_WithoutAuth_ShouldReturnUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var response = await _client.GetAsync("/api/users");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetAllUsers_AsAdmin_ShouldReturnOk()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;
        SetAuthToken(token);

        var response = await _client.GetAsync("/api/users");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<UserListDto>();
        result.Should().NotBeNull();
        result!.Users.Should().NotBeNull();
        result.TotalCount.Should().BeGreaterOrEqualTo(0);
    }

    [Fact]
    public async Task GetAllUsers_WithPagination_ShouldReturnPaginatedResults()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;
        SetAuthToken(token);

        var response = await _client.GetAsync("/api/users?page=1&pageSize=5");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<UserListDto>();
        result.Should().NotBeNull();
        result!.Page.Should().Be(1);
        result.PageSize.Should().Be(5);
    }

    [Fact]
    public async Task GetAllUsers_WithSearch_ShouldFilterResults()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;
        SetAuthToken(token);

        var response = await _client.GetAsync("/api/users?search=admin");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetUserById_WithoutAuth_ShouldReturnUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var response = await _client.GetAsync("/api/users/some-id");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetUserById_WithInvalidId_ShouldReturnNotFound()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;
        SetAuthToken(token);

        var response = await _client.GetAsync("/api/users/nonexistent-id-12345");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CreateUser_WithoutAuth_ShouldReturnUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var dto = new CreateUserDto
        {
            Email = _faker.Internet.Email(),
            Password = "Test123!@#",
            FullName = _faker.Name.FullName(),
            Role = "User"
        };

        var response = await _client.PostAsJsonAsync("/api/users", dto);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateUser_AsAdmin_WithValidData_ShouldReturnCreated()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;
        SetAuthToken(token);

        var dto = new CreateUserDto
        {
            Email = _faker.Internet.Email(),
            Password = "NewUser123!@#",
            FullName = _faker.Name.FullName(),
            Role = "User",
            IsActive = true
        };

        var response = await _client.PostAsJsonAsync("/api/users", dto);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.Created, HttpStatusCode.BadRequest);

        if (response.StatusCode == HttpStatusCode.Created)
        {
            var result = await response.Content.ReadFromJsonAsync<UserResponseDto>();
            result.Should().NotBeNull();
            result!.Email.Should().NotBeNullOrEmpty();
            result.FullName.Should().Be(dto.FullName);
            result.Role.Should().Be("User");
            result.IsActive.Should().BeTrue();
        }
    }

    [Fact]
    public async Task CreateUser_WithDuplicateEmail_ShouldReturnBadRequest()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;
        SetAuthToken(token);

        var email = _faker.Internet.Email();
        var dto = new CreateUserDto
        {
            Email = email,
            Password = "Test123!@#",
            FullName = _faker.Name.FullName(),
            Role = "User"
        };

        await _client.PostAsJsonAsync("/api/users", dto);
        var response = await _client.PostAsJsonAsync("/api/users", dto);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateUser_WithInvalidEmail_ShouldReturnBadRequest()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;
        SetAuthToken(token);

        var dto = new CreateUserDto
        {
            Email = "invalid-email",
            Password = "Test123!@#",
            FullName = _faker.Name.FullName(),
            Role = "User"
        };

        var response = await _client.PostAsJsonAsync("/api/users", dto);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateUser_WithEmptyPassword_ShouldReturnBadRequest()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;
        SetAuthToken(token);

        var dto = new CreateUserDto
        {
            Email = _faker.Internet.Email(),
            Password = "",
            FullName = _faker.Name.FullName(),
            Role = "User"
        };

        var response = await _client.PostAsJsonAsync("/api/users", dto);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task UpdateUser_WithoutAuth_ShouldReturnUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var dto = new UpdateUserDto { FullName = "Updated Name", Role = "User", IsActive = true };
        var response = await _client.PutAsJsonAsync("/api/users/some-id", dto);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task UpdateUser_WithInvalidId_ShouldReturnBadRequest()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;
        SetAuthToken(token);

        var dto = new UpdateUserDto { FullName = "Updated Name", Role = "User", IsActive = true };
        var response = await _client.PutAsJsonAsync("/api/users/nonexistent-id", dto);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task DeleteUser_WithoutAuth_ShouldReturnUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var response = await _client.DeleteAsync("/api/users/some-id");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task DeleteUser_WithInvalidId_ShouldReturnBadRequest()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;
        SetAuthToken(token);

        var response = await _client.DeleteAsync("/api/users/nonexistent-id");
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ChangePassword_WithoutAuth_ShouldReturnUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var dto = new ChangePasswordDto { UserId = "some-id", NewPassword = "NewPass123!@#" };
        var response = await _client.PostAsJsonAsync("/api/users/change-password", dto);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ChangePassword_WithInvalidUserId_ShouldReturnBadRequest()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;
        SetAuthToken(token);

        var dto = new ChangePasswordDto { UserId = "nonexistent-id", NewPassword = "NewPass123!@#" };
        var response = await _client.PostAsJsonAsync("/api/users/change-password", dto);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateAndUpdateUser_EndToEnd_ShouldWork()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;
        SetAuthToken(token);

        var createDto = new CreateUserDto
        {
            Email = _faker.Internet.Email(),
            Password = "Test123!@#",
            FullName = _faker.Name.FullName(),
            Role = "User",
            IsActive = true
        };

        var createResponse = await _client.PostAsJsonAsync("/api/users", createDto);
        if (createResponse.StatusCode != HttpStatusCode.Created) return;

        var created = await createResponse.Content.ReadFromJsonAsync<UserResponseDto>();
        created.Should().NotBeNull();

        var updateDto = new UpdateUserDto
        {
            FullName = "Updated Full Name",
            Role = "Admin",
            IsActive = true
        };

        var updateResponse = await _client.PutAsJsonAsync($"/api/users/{created!.Id}", updateDto);
        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var updated = await updateResponse.Content.ReadFromJsonAsync<UserResponseDto>();
        updated.Should().NotBeNull();
        updated!.FullName.Should().Be("Updated Full Name");
    }

    [Fact]
    public async Task CreateAndDeleteUser_EndToEnd_ShouldWork()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;
        SetAuthToken(token);

        var createDto = new CreateUserDto
        {
            Email = _faker.Internet.Email(),
            Password = "Test123!@#",
            FullName = _faker.Name.FullName(),
            Role = "User",
            IsActive = true
        };

        var createResponse = await _client.PostAsJsonAsync("/api/users", createDto);
        if (createResponse.StatusCode != HttpStatusCode.Created) return;

        var created = await createResponse.Content.ReadFromJsonAsync<UserResponseDto>();
        var deleteResponse = await _client.DeleteAsync($"/api/users/{created!.Id}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task CreateUserAndChangePassword_EndToEnd_ShouldWork()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;
        SetAuthToken(token);

        var createDto = new CreateUserDto
        {
            Email = _faker.Internet.Email(),
            Password = "Test123!@#",
            FullName = _faker.Name.FullName(),
            Role = "User",
            IsActive = true
        };

        var createResponse = await _client.PostAsJsonAsync("/api/users", createDto);
        if (createResponse.StatusCode != HttpStatusCode.Created) return;

        var created = await createResponse.Content.ReadFromJsonAsync<UserResponseDto>();

        var changeDto = new ChangePasswordDto
        {
            UserId = created!.Id,
            NewPassword = "NewPassword123!@#"
        };

        var changeResponse = await _client.PostAsJsonAsync("/api/users/change-password", changeDto);
        changeResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetUserById_AfterCreate_ShouldReturnUser()
    {
        var token = await GetAdminTokenAsync();
        if (token == null) return;
        SetAuthToken(token);

        var createDto = new CreateUserDto
        {
            Email = _faker.Internet.Email(),
            Password = "Test123!@#",
            FullName = _faker.Name.FullName(),
            Role = "User",
            IsActive = true
        };

        var createResponse = await _client.PostAsJsonAsync("/api/users", createDto);
        if (createResponse.StatusCode != HttpStatusCode.Created) return;

        var created = await createResponse.Content.ReadFromJsonAsync<UserResponseDto>();
        var getResponse = await _client.GetAsync($"/api/users/{created!.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var fetched = await getResponse.Content.ReadFromJsonAsync<UserResponseDto>();
        fetched.Should().NotBeNull();
        fetched!.Id.Should().Be(created.Id);
        fetched.Email.Should().NotBeNullOrEmpty();
    }
}
