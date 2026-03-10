namespace TuCreditoOnline.Application.DTOs;

public class CreateUserDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = "User";
    public bool IsActive { get; set; } = true;
}

public class UpdateUserDto
{
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class ChangePasswordDto
{
    public string UserId { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class UserResponseDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLogin { get; set; }
}

public class UserListDto
{
    public List<UserResponseDto> Users { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
