using TuCreditoOnline.Domain.Common;

namespace TuCreditoOnline.Domain.Entities;

public class CreditType : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal BaseInterestRate { get; set; }
    public decimal MinAmount { get; set; }
    public decimal MaxAmount { get; set; }
    public int MaxTermMonths { get; set; }
    public int MinTermMonths { get; set; } = 1;
    public bool IsActive { get; set; } = true;
}
