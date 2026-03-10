using TuCreditoOnline.Application.Common.Models;
using TuCreditoOnline.Application.DTOs;
using TuCreditoOnline.Domain.Entities;
using TuCreditoOnline.Infrastructure.Repositories;

namespace TuCreditoOnline.Infrastructure.Services;

public class UserManagementService
{
    private readonly UserRepository _userRepository;

    public UserManagementService(UserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<Result<UserListDto>> GetAllUsersAsync(int page = 1, int pageSize = 10, string? searchTerm = null)
    {
        try
        {
            var allUsers = await _userRepository.GetAllAsync();

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                searchTerm = searchTerm.ToLower();
                allUsers = allUsers.Where(u =>
                    u.Email.ToLower().Contains(searchTerm) ||
                    u.FullName.ToLower().Contains(searchTerm)
                ).ToList();
            }

            var totalCount = allUsers.Count();
            var users = allUsers
                .OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new UserResponseDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    FullName = u.FullName,
                    Role = u.Role,
                    IsActive = u.IsActive,
                    CreatedAt = u.CreatedAt,
                    LastLogin = u.LastLogin
                })
                .ToList();

            var result = new UserListDto
            {
                Users = users,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };

            return Result.Success(result);
        }
        catch (Exception ex)
        {
            return Result.Failure<UserListDto>($"Failed to fetch users: {ex.Message}");
        }
    }

    public async Task<Result<UserResponseDto>> GetUserByIdAsync(string id)
    {
        try
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
                return Result.Failure<UserResponseDto>("User not found");

            var response = new UserResponseDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                LastLogin = user.LastLogin
            };

            return Result.Success(response);
        }
        catch (Exception ex)
        {
            return Result.Failure<UserResponseDto>($"Failed to fetch user: {ex.Message}");
        }
    }

    public async Task<Result<UserResponseDto>> CreateUserAsync(CreateUserDto dto)
    {
        try
        {
            var existingUser = await _userRepository.FindAsync(u => u.Email == dto.Email);
            if (existingUser.Any())
                return Result.Failure<UserResponseDto>("Email is already registered");

            // "Analista" is a valid domain role alongside "Admin" and "User"
            var validRoles = new[] { "Admin", "User", "Analista" };
            if (!validRoles.Contains(dto.Role))
                return Result.Failure<UserResponseDto>("Invalid role");

            var user = new User
            {
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                FullName = dto.FullName,
                Role = dto.Role,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _userRepository.AddAsync(user);

            var response = new UserResponseDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                LastLogin = user.LastLogin
            };

            return Result.Success(response);
        }
        catch (Exception ex)
        {
            return Result.Failure<UserResponseDto>($"Failed to create user: {ex.Message}");
        }
    }

    public async Task<Result<UserResponseDto>> UpdateUserAsync(string id, UpdateUserDto dto)
    {
        try
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
                return Result.Failure<UserResponseDto>("User not found");

            var validRoles = new[] { "Admin", "User", "Analista" };
            if (!validRoles.Contains(dto.Role))
                return Result.Failure<UserResponseDto>("Invalid role");

            user.FullName = dto.FullName;
            user.Role = dto.Role;
            user.IsActive = dto.IsActive;
            user.UpdatedAt = DateTime.UtcNow;

            await _userRepository.UpdateAsync(user);

            var response = new UserResponseDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                LastLogin = user.LastLogin
            };

            return Result.Success(response);
        }
        catch (Exception ex)
        {
            return Result.Failure<UserResponseDto>($"Failed to update user: {ex.Message}");
        }
    }

    public async Task<Result<bool>> DeleteUserAsync(string id)
    {
        try
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
                return Result.Failure<bool>("User not found");

            await _userRepository.DeleteAsync(id);
            return Result.Success(true);
        }
        catch (Exception ex)
        {
            return Result.Failure<bool>($"Failed to delete user: {ex.Message}");
        }
    }

    public async Task<Result<bool>> ChangePasswordAsync(ChangePasswordDto dto)
    {
        try
        {
            var user = await _userRepository.GetByIdAsync(dto.UserId);
            if (user == null)
                return Result.Failure<bool>("User not found");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            await _userRepository.UpdateAsync(user);
            return Result.Success(true);
        }
        catch (Exception ex)
        {
            return Result.Failure<bool>($"Failed to change password: {ex.Message}");
        }
    }
}
