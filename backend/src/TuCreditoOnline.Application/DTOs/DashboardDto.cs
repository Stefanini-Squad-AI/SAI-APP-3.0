namespace TuCreditoOnline.Application.DTOs;

public class DashboardStatsDto
{
    public int TotalCreditRequests { get; set; }
    public int PendingRequests { get; set; }
    public int ApprovedRequests { get; set; }
    public int RejectedRequests { get; set; }
    public int UnderReviewRequests { get; set; }
    public int TotalUsers { get; set; }
    public int NewUsersThisMonth { get; set; }
    public decimal TotalApprovedAmount { get; set; }
    public decimal AverageRequestAmount { get; set; }
    public List<MonthlyStatsDto> MonthlyStats { get; set; } = new();
}

public class MonthlyStatsDto
{
    public string Month { get; set; } = string.Empty;
    public int TotalRequests { get; set; }
    public int Approved { get; set; }
    public int Rejected { get; set; }
}

public class StatusDistributionDto
{
    public string Status { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}
