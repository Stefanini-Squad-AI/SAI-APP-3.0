using TuCreditoOnline.Application.Common.Models;
using TuCreditoOnline.Application.DTOs;
using TuCreditoOnline.Domain.Entities;
using TuCreditoOnline.Infrastructure.Repositories;

namespace TuCreditoOnline.Infrastructure.Services;

public class ServiceManagementService
{
    private readonly ServiceRepository _serviceRepository;

    public ServiceManagementService(ServiceRepository serviceRepository)
    {
        _serviceRepository = serviceRepository;
    }

    public virtual async Task<Result<List<ServiceResponseDto>>> GetAllAsync(bool? isActive = null)
    {
        try
        {
            var services = await _serviceRepository.GetAllAsync();
            
            if (isActive.HasValue)
            {
                services = services.Where(s => s.IsActive == isActive.Value).ToList();
            }

            var response = services.Select(s => new ServiceResponseDto
            {
                Id = s.Id,
                Title = s.Title,
                Description = s.Description,
                Icon = s.Icon,
                DisplayOrder = s.DisplayOrder,
                IsActive = s.IsActive,
                CreatedAt = s.CreatedAt
            }).OrderBy(s => s.DisplayOrder).ToList();

            return Result.Success(response);
        }
        catch (Exception ex)
        {
            return Result.Failure<List<ServiceResponseDto>>($"Failed to fetch services: {ex.Message}");
        }
    }

    public virtual async Task<Result<ServiceResponseDto>> GetByIdAsync(string id)
    {
        try
        {
            var service = await _serviceRepository.GetByIdAsync(id);
            if (service == null)
            {
                return Result.Failure<ServiceResponseDto>("Service not found");
            }

            var response = new ServiceResponseDto
            {
                Id = service.Id,
                Title = service.Title,
                Description = service.Description,
                Icon = service.Icon,
                DisplayOrder = service.DisplayOrder,
                IsActive = service.IsActive,
                CreatedAt = service.CreatedAt
            };

            return Result.Success(response);
        }
        catch (Exception ex)
        {
            return Result.Failure<ServiceResponseDto>($"Failed to fetch service: {ex.Message}");
        }
    }

    public virtual async Task<Result<ServiceResponseDto>> CreateAsync(CreateServiceDto dto)
    {
        try
        {
            var service = new Service
            {
                Title = dto.Title,
                Description = dto.Description,
                Icon = dto.Icon,
                DisplayOrder = dto.DisplayOrder,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _serviceRepository.AddAsync(service);

            var response = new ServiceResponseDto
            {
                Id = service.Id,
                Title = service.Title,
                Description = service.Description,
                Icon = service.Icon,
                DisplayOrder = service.DisplayOrder,
                IsActive = service.IsActive,
                CreatedAt = service.CreatedAt
            };

            return Result.Success(response);
        }
        catch (Exception ex)
        {
            return Result.Failure<ServiceResponseDto>($"Failed to create service: {ex.Message}");
        }
    }

    public virtual async Task<Result<ServiceResponseDto>> UpdateAsync(string id, UpdateServiceDto dto)
    {
        try
        {
            var service = await _serviceRepository.GetByIdAsync(id);
            if (service == null)
            {
                return Result.Failure<ServiceResponseDto>("Service not found");
            }

            service.Title = dto.Title;
            service.Description = dto.Description;
            service.Icon = dto.Icon;
            service.DisplayOrder = dto.DisplayOrder;
            service.IsActive = dto.IsActive;
            service.UpdatedAt = DateTime.UtcNow;

            await _serviceRepository.UpdateAsync(service);

            var response = new ServiceResponseDto
            {
                Id = service.Id,
                Title = service.Title,
                Description = service.Description,
                Icon = service.Icon,
                DisplayOrder = service.DisplayOrder,
                IsActive = service.IsActive,
                CreatedAt = service.CreatedAt
            };

            return Result.Success(response);
        }
        catch (Exception ex)
        {
            return Result.Failure<ServiceResponseDto>($"Failed to update service: {ex.Message}");
        }
    }

    public virtual async Task<Result<bool>> DeleteAsync(string id)
        {
            try
            {
                var service = await _serviceRepository.GetByIdAsync(id);
            if (service == null)
            {
                return Result.Failure<bool>("Service not found");
            }

            await _serviceRepository.DeleteAsync(id);
            return Result.Success(true);
        }
        catch (Exception ex)
        {
            return Result.Failure<bool>($"Failed to delete service: {ex.Message}");
        }
    }
}
