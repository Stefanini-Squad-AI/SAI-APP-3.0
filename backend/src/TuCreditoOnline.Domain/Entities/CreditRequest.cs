using TuCreditoOnline.Domain.Common;

namespace TuCreditoOnline.Domain.Entities;

public class CreditRequest : BaseEntity
{
    // Personal Information
    public string FullName { get; set; } = string.Empty;
    public string IdentificationNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;

    // Financial Information
    public string EmploymentStatus { get; set; } = string.Empty; // e.g. "Employed", "Self-Employed"
    public decimal MonthlySalary { get; set; }
    public int YearsOfEmployment { get; set; }

    // Credit Details
    public string CreditType { get; set; } = string.Empty; // matches credit type name from the database
    public string UseOfMoney { get; set; } = string.Empty;
    public decimal RequestedAmount { get; set; }
    public int TermYears { get; set; }
    // Convenience property for comparing against CreditType.MaxTermMonths / MinTermMonths
    public int TermMonths => TermYears * 12;
    public decimal InterestRate { get; set; }
    public decimal MonthlyPayment { get; set; }
    public decimal TotalPayment { get; set; }
    public decimal TotalInterest { get; set; }

    // Metadata
    public string Status { get; set; } = "Pending"; // "Pending", "Approved", "Rejected"
    public DateTime RequestDate { get; set; } = DateTime.UtcNow;
    public DateTime? ApprovedDate { get; set; }
    public DateTime? RejectedDate { get; set; }
    public decimal? ApprovedAmount { get; set; }
    public int? ApprovedTermMonths { get; set; }
    public string? Remarks { get; set; }
}
