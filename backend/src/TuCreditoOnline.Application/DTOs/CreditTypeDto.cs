namespace TuCreditoOnline.Application.DTOs;

public class CreateCreditTypeDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal BaseInterestRate { get; set; }
    public decimal MaxAmount { get; set; }
    public int MaxTermMonths { get; set; }
    public int MinTermMonths { get; set; } = 1;
    public bool IsActive { get; set; } = true;
}

public class UpdateCreditTypeDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal BaseInterestRate { get; set; }
    public decimal MaxAmount { get; set; }
    public int MaxTermMonths { get; set; }
    public int MinTermMonths { get; set; }
    public bool IsActive { get; set; }
}

public class CreditTypeResponseDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal BaseInterestRate { get; set; }
    public decimal MaxAmount { get; set; }
    public int MaxTermMonths { get; set; }
    public int MinTermMonths { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
