using TuCreditoOnline.Application.Common.Models;
using TuCreditoOnline.Application.DTOs;
using TuCreditoOnline.Domain.Entities;
using TuCreditoOnline.Infrastructure.Repositories;
using TuCreditoOnline.Infrastructure.Security;

namespace TuCreditoOnline.Infrastructure.Services;

public class CreditRequestService
{
    private readonly CreditRequestRepository _repository;

    public CreditRequestService(CreditRequestRepository repository)
    {
        _repository = repository;
    }

    public async Task<Result<CreditRequestResponseDto>> CreateCreditRequestAsync(CreateCreditRequestDto dto)
    {
        try
        {
            var nameValidation = DtoValidator.ValidateRequiredString(dto.FullName, "Full name", 200);
            if (!nameValidation.IsSuccess)
                return Result.Failure<CreditRequestResponseDto>(nameValidation.Message);

            var emailValidation = DtoValidator.ValidateEmail(dto.Email);
            if (!emailValidation.IsSuccess)
                return Result.Failure<CreditRequestResponseDto>(emailValidation.Message);

            var phoneValidation = DtoValidator.ValidatePhoneNumber(dto.Phone);
            if (!phoneValidation.IsSuccess)
                return Result.Failure<CreditRequestResponseDto>(phoneValidation.Message);

            var amountValidation = DtoValidator.ValidatePositiveDecimal(dto.RequestedAmount, "Requested amount", 1000, 10000000);
            if (!amountValidation.IsSuccess)
                return Result.Failure<CreditRequestResponseDto>(amountValidation.Message);

            var termValidation = DtoValidator.ValidatePositiveInt(dto.TermYears, "Term", 1, 30);
            if (!termValidation.IsSuccess)
                return Result.Failure<CreditRequestResponseDto>(termValidation.Message);

            var salaryValidation = DtoValidator.ValidatePositiveDecimal(dto.MonthlySalary, "Monthly salary", 1, 10000000);
            if (!salaryValidation.IsSuccess)
                return Result.Failure<CreditRequestResponseDto>(salaryValidation.Message);

            var identificationNumber = InputSanitizer.SanitizeAlphanumeric(dto.IdentificationNumber);
            var address = InputSanitizer.SanitizeString(dto.Address);
            var employmentStatus = InputSanitizer.SanitizeString(dto.EmploymentStatus);
            var creditType = InputSanitizer.SanitizeString(dto.CreditType);
            var useOfMoney = InputSanitizer.SanitizeString(dto.UseOfMoney);

            var creditRequest = new CreditRequest
            {
                Id = Guid.NewGuid().ToString(),
                FullName = nameValidation.Data,
                IdentificationNumber = identificationNumber,
                Email = emailValidation.Data,
                Phone = phoneValidation.Data,
                Address = address,
                EmploymentStatus = employmentStatus,
                MonthlySalary = salaryValidation.Data,
                YearsOfEmployment = dto.YearsOfEmployment,
                CreditType = creditType,
                UseOfMoney = useOfMoney,
                RequestedAmount = amountValidation.Data,
                TermYears = termValidation.Data,
                InterestRate = dto.InterestRate,
                MonthlyPayment = dto.MonthlyPayment,
                TotalPayment = dto.TotalPayment,
                TotalInterest = dto.TotalInterest,
                Status = "Pending",
                RequestDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _repository.AddAsync(creditRequest);

            var response = new CreditRequestResponseDto
            {
                Id = creditRequest.Id,
                FullName = creditRequest.FullName,
                Email = creditRequest.Email,
                Status = creditRequest.Status,
                RequestedAmount = creditRequest.RequestedAmount,
                MonthlyPayment = creditRequest.MonthlyPayment,
                RequestDate = creditRequest.RequestDate
            };

            return Result.Success(response);
        }
        catch (Exception ex)
        {
            return Result.Failure<CreditRequestResponseDto>($"Failed to create credit request: {ex.Message}");
        }
    }

    public async Task<Result<IEnumerable<CreditRequest>>> GetAllCreditRequestsAsync()
    {
        try
        {
            var requests = await _repository.GetAllAsync();
            return Result.Success(requests);
        }
        catch (Exception ex)
        {
            return Result.Failure<IEnumerable<CreditRequest>>($"Failed to fetch credit requests: {ex.Message}");
        }
    }

    public async Task<Result<CreditRequest>> GetCreditRequestByIdAsync(string id)
    {
        try
        {
            var request = await _repository.GetByIdAsync(id);

            if (request == null)
                return Result.Failure<CreditRequest>("Credit request not found");

            return Result.Success(request);
        }
        catch (Exception ex)
        {
            return Result.Failure<CreditRequest>($"Failed to fetch credit request: {ex.Message}");
        }
    }

    public async Task<Result<CreditRequest>> UpdateCreditRequestStatusAsync(string id, UpdateCreditRequestStatusDto dto)
    {
        try
        {
            var request = await _repository.GetByIdAsync(id);

            if (request == null)
                return Result.Failure<CreditRequest>("Credit request not found");

            if (dto.Status != "Approved" && dto.Status != "Rejected" && dto.Status != "Pending")
                return Result.Failure<CreditRequest>("Invalid status. Must be Approved, Rejected, or Pending");

            request.Status = dto.Status;
            request.UpdatedAt = DateTime.UtcNow;

            if (dto.Status == "Approved")
            {
                request.ApprovedDate = DateTime.UtcNow;
                request.ApprovedAmount = dto.ApprovedAmount ?? request.RequestedAmount;
                request.ApprovedTermMonths = dto.ApprovedTermMonths ?? (request.TermYears * 12);
            }
            else if (dto.Status == "Rejected")
            {
                request.RejectedDate = DateTime.UtcNow;
            }

            if (!string.IsNullOrWhiteSpace(dto.Remarks))
                request.Remarks = dto.Remarks;

            await _repository.UpdateAsync(request);

            return Result.Success(request);
        }
        catch (Exception ex)
        {
            return Result.Failure<CreditRequest>($"Failed to update status: {ex.Message}");
        }
    }

    public async Task<Result<IEnumerable<CreditRequest>>> GetCreditRequestsByStatusAsync(string status)
    {
        try
        {
            IEnumerable<CreditRequest> requests;
            if (status.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                requests = await _repository.GetAllAsync();
            }
            else
            {
                requests = await _repository.FindAsync(cr => cr.Status == status);
            }
            return Result.Success(requests);
        }
        catch (Exception ex)
        {
            return Result.Failure<IEnumerable<CreditRequest>>($"Failed to fetch credit requests: {ex.Message}");
        }
    }
}
