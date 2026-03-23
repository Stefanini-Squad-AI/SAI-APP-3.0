using TuCreditoOnline.Application.Common.Models;
using TuCreditoOnline.Application.DTOs;
using TuCreditoOnline.Infrastructure.Repositories;

namespace TuCreditoOnline.Infrastructure.Services;

public class DashboardService
{
    private readonly CreditRequestRepository _creditRequestRepository;
    private readonly UserRepository _userRepository;

    public DashboardService(CreditRequestRepository creditRequestRepository, UserRepository userRepository)
    {
        _creditRequestRepository = creditRequestRepository;
        _userRepository = userRepository;
    }

    public virtual async Task<Result<DashboardStatsDto>> GetDashboardStatsAsync()
    {
        try
        {
            var allRequests = await _creditRequestRepository.GetAllAsync();
            var allUsers = await _userRepository.GetAllAsync();

            var now = DateTime.UtcNow;
            var firstDayOfMonth = new DateTime(now.Year, now.Month, 1);

            var stats = new DashboardStatsDto
            {
                TotalCreditRequests = allRequests.Count(),
                PendingRequests = allRequests.Count(r => r.Status == "Pending"),
                ApprovedRequests = allRequests.Count(r => r.Status == "Approved"),
                RejectedRequests = allRequests.Count(r => r.Status == "Rejected"),
                UnderReviewRequests = allRequests.Count(r => r.Status == "UnderReview"),
                TotalUsers = allUsers.Count(),
                NewUsersThisMonth = allUsers.Count(u => u.CreatedAt >= firstDayOfMonth),
                TotalApprovedAmount = allRequests.Where(r => r.Status == "Approved").Sum(r => r.RequestedAmount),
                AverageRequestAmount = allRequests.Any() ? allRequests.Average(r => r.RequestedAmount) : 0
            };

            // Get last 6 months stats
            stats.MonthlyStats = GetMonthlyStats(allRequests, 6);

            return Result.Success(stats);
        }
        catch (Exception ex)
        {
            return Result.Failure<DashboardStatsDto>($"Failed to fetch dashboard statistics: {ex.Message}");
        }
    }

    public virtual async Task<Result<List<StatusDistributionDto>>> GetStatusDistributionAsync()
    {
        try
        {
            var allRequests = await _creditRequestRepository.GetAllAsync();
            var total = allRequests.Count();

            if (total == 0)
            {
                return Result.Success(new List<StatusDistributionDto>());
            }

            var distribution = allRequests
                .GroupBy(r => r.Status)
                .Select(g => new StatusDistributionDto
                {
                    Status = g.Key,
                    Count = g.Count(),
                    Percentage = Math.Round((decimal)g.Count() / total * 100, 2)
                })
                .OrderByDescending(d => d.Count)
                .ToList();

            return Result.Success(distribution);
        }
        catch (Exception ex)
        {
            return Result.Failure<List<StatusDistributionDto>>($"Failed to fetch status distribution: {ex.Message}");
        }
    }

    private static List<MonthlyStatsDto> GetMonthlyStats(IEnumerable<Domain.Entities.CreditRequest> requests, int monthsBack)
    {
        var monthlyStats = new List<MonthlyStatsDto>();
        var now = DateTime.UtcNow;

        for (int i = monthsBack - 1; i >= 0; i--)
        {
            var targetMonth = now.AddMonths(-i);
            var monthStart = new DateTime(targetMonth.Year, targetMonth.Month, 1);
            var monthEnd = monthStart.AddMonths(1);

            var monthRequests = requests.Where(r => r.CreatedAt >= monthStart && r.CreatedAt < monthEnd).ToList();

            monthlyStats.Add(new MonthlyStatsDto
            {
                Month = targetMonth.ToString("MMM yyyy"),
                TotalRequests = monthRequests.Count,
                Approved = monthRequests.Count(r => r.Status == "Approved"),
                Rejected = monthRequests.Count(r => r.Status == "Rejected")
            });
        }

        return monthlyStats;
    }
}
