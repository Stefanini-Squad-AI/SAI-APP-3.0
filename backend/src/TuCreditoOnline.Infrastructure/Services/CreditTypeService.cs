using TuCreditoOnline.Application.Common.Models;
using TuCreditoOnline.Application.DTOs;
using TuCreditoOnline.Domain.Entities;
using TuCreditoOnline.Infrastructure.Repositories;

namespace TuCreditoOnline.Infrastructure.Services;

public class CreditTypeService
{
    private readonly CreditTypeRepository _creditTypeRepository;

    public CreditTypeService(CreditTypeRepository creditTypeRepository)
    {
        _creditTypeRepository = creditTypeRepository;
    }

    public async Task<Result<List<CreditTypeResponseDto>>> GetAllAsync(bool? isActive = null)
    {
        try
        {
            var creditTypes = await _creditTypeRepository.GetAllAsync();
            
            if (isActive.HasValue)
            {
                creditTypes = creditTypes.Where(ct => ct.IsActive == isActive.Value).ToList();
            }

            var response = creditTypes.Select(ct => new CreditTypeResponseDto
            {
                Id = ct.Id,
                Name = ct.Name,
                Description = ct.Description,
                BaseInterestRate = ct.BaseInterestRate,
                MinAmount = ct.MinAmount,
                MaxAmount = ct.MaxAmount,
                MaxTermMonths = ct.MaxTermMonths,
                MinTermMonths = ct.MinTermMonths,
                IsActive = ct.IsActive,
                CreatedAt = ct.CreatedAt
            }).OrderBy(ct => ct.Name).ToList();

            return Result.Success(response);
        }
        catch (Exception ex)
        {
            return Result.Failure<List<CreditTypeResponseDto>>($"Error fetching credit types: {ex.Message}");
        }
    }

    public async Task<Result<CreditTypeResponseDto>> GetByIdAsync(string id)
    {
        try
        {
            var creditType = await _creditTypeRepository.GetByIdAsync(id);
            if (creditType == null)
            {
                return Result.Failure<CreditTypeResponseDto>("Credit type not found");
            }

            var response = new CreditTypeResponseDto
            {
                Id = creditType.Id,
                Name = creditType.Name,
                Description = creditType.Description,
                BaseInterestRate = creditType.BaseInterestRate,
                MinAmount = creditType.MinAmount,
                MaxAmount = creditType.MaxAmount,
                MaxTermMonths = creditType.MaxTermMonths,
                MinTermMonths = creditType.MinTermMonths,
                IsActive = creditType.IsActive,
                CreatedAt = creditType.CreatedAt
            };

            return Result.Success(response);
        }
        catch (Exception ex)
        {
            return Result.Failure<CreditTypeResponseDto>($"Error fetching credit type: {ex.Message}");
        }
    }

    public async Task<Result<CreditTypeResponseDto>> CreateAsync(CreateCreditTypeDto dto)
    {
        try
        {
            var creditType = new CreditType
            {
                Name = dto.Name,
                Description = dto.Description,
                BaseInterestRate = dto.BaseInterestRate,
                MinAmount = dto.MinAmount,
                MaxAmount = dto.MaxAmount,
                MaxTermMonths = dto.MaxTermMonths,
                MinTermMonths = dto.MinTermMonths,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _creditTypeRepository.AddAsync(creditType);

            var response = new CreditTypeResponseDto
            {
                Id = creditType.Id,
                Name = creditType.Name,
                Description = creditType.Description,
                BaseInterestRate = creditType.BaseInterestRate,
                MinAmount = creditType.MinAmount,
                MaxAmount = creditType.MaxAmount,
                MaxTermMonths = creditType.MaxTermMonths,
                MinTermMonths = creditType.MinTermMonths,
                IsActive = creditType.IsActive,
                CreatedAt = creditType.CreatedAt
            };

            return Result.Success(response);
        }
        catch (Exception ex)
        {
            return Result.Failure<CreditTypeResponseDto>($"Error creating credit type: {ex.Message}");
        }
    }

    public async Task<Result<CreditTypeResponseDto>> UpdateAsync(string id, UpdateCreditTypeDto dto)
    {
        try
        {
            var creditType = await _creditTypeRepository.GetByIdAsync(id);
            if (creditType == null)
            {
                return Result.Failure<CreditTypeResponseDto>("Credit type not found");
            }

            creditType.Name = dto.Name;
            creditType.Description = dto.Description;
            creditType.BaseInterestRate = dto.BaseInterestRate;
            creditType.MinAmount = dto.MinAmount;
            creditType.MaxAmount = dto.MaxAmount;
            creditType.MaxTermMonths = dto.MaxTermMonths;
            creditType.MinTermMonths = dto.MinTermMonths;
            creditType.IsActive = dto.IsActive;
            creditType.UpdatedAt = DateTime.UtcNow;

            await _creditTypeRepository.UpdateAsync(creditType);

            var response = new CreditTypeResponseDto
            {
                Id = creditType.Id,
                Name = creditType.Name,
                Description = creditType.Description,
                BaseInterestRate = creditType.BaseInterestRate,
                MinAmount = creditType.MinAmount,
                MaxAmount = creditType.MaxAmount,
                MaxTermMonths = creditType.MaxTermMonths,
                MinTermMonths = creditType.MinTermMonths,
                IsActive = creditType.IsActive,
                CreatedAt = creditType.CreatedAt
            };

            return Result.Success(response);
        }
        catch (Exception ex)
        {
            return Result.Failure<CreditTypeResponseDto>($"Error updating credit type: {ex.Message}");
        }
    }

    public async Task<Result<bool>> DeleteAsync(string id)
    {
        try
        {
            var creditType = await _creditTypeRepository.GetByIdAsync(id);
            if (creditType == null)
            {
                return Result.Failure<bool>("Credit type not found");
            }

            await _creditTypeRepository.DeleteAsync(id);
            return Result.Success(true);
        }
        catch (Exception ex)
        {
            return Result.Failure<bool>($"Error deleting credit type: {ex.Message}");
        }
    }
}
