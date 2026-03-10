namespace TuCreditoOnline.Application.DTOs;

public class CreateCreditRequestDto
{
    // Personal Information
    public string FullName { get; set; } = string.Empty;
    public string IdentificationNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;

    // Financial Information
    public string EmploymentStatus { get; set; } = string.Empty;
    public decimal MonthlySalary { get; set; }
    public int YearsOfEmployment { get; set; }

    // Credit Details
    public string CreditType { get; set; } = string.Empty;
    public string UseOfMoney { get; set; } = string.Empty;
    public decimal RequestedAmount { get; set; }
    public int TermYears { get; set; }
    public decimal InterestRate { get; set; }
    public decimal MonthlyPayment { get; set; }
    public decimal TotalPayment { get; set; }
    public decimal TotalInterest { get; set; }
}

public class CreditRequestResponseDto
{
    public string Id { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal RequestedAmount { get; set; }
    public decimal MonthlyPayment { get; set; }
    public DateTime RequestDate { get; set; }
}
