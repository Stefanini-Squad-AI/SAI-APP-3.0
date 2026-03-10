namespace TuCreditoOnline.Application.DTOs;

public class UpdateCreditRequestStatusDto
{
    public string Status { get; set; } = string.Empty;
    public string? Remarks { get; set; }
    public decimal? ApprovedAmount { get; set; }
    public int? ApprovedTermMonths { get; set; }
    
    // Alias kept for backwards compatibility with tests
    public string NewStatus
    {
        get => Status;
        set => Status = value;
    }
}
