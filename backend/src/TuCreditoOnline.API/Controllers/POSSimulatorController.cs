using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuCreditoOnline.Application.DTOs;

namespace TuCreditoOnline.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class POSSimulatorController : ControllerBase
{
    private readonly ILogger<POSSimulatorController> _logger;

    public POSSimulatorController(ILogger<POSSimulatorController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Calculate POS simulator with payment equivalents
    /// </summary>
    [HttpPost("calculate")]
    [AllowAnonymous]
    public IActionResult Calculate([FromBody] POSSimulationRequest request)
    {
        try
        {
            _logger.LogInformation(
                "POS Simulation requested: Product={ProductId}, Amount={Amount}, TermMonths={Term}, CustomerType={Type}",
                request.ProductId,
                request.Amount,
                request.TermMonths,
                request.CustomerType
            );

            // Validate request
            if (request.Amount <= 0)
                return BadRequest(new { message = "Amount must be greater than 0" });

            if (request.TermMonths <= 0 || request.TermMonths > 60)
                return BadRequest(new { message = "Term must be between 1 and 60 months" });

            // Calculate simulation
            var result = CalculateSimulation(request);

            _logger.LogInformation(
                "POS Simulation calculated successfully: MonthlyPayment={Payment}, TotalCost={Total}",
                result.MonthlyPayment,
                result.TotalCost
            );

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating POS simulation");
            return StatusCode(500, new { message = "Error calculating simulation" });
        }
    }

    private POSSimulationResult CalculateSimulation(POSSimulationRequest request)
    {
        // Default interest rates and fees based on customer type
        var interestRate = request.CustomerType == "business" ? 18.5m : 21.8m;
        var commission = request.Amount * 0.02m; // 2% commission
        var insurance = request.Amount * 0.015m; // 1.5% insurance

        // Calculate monthly payment (amortization formula)
        var monthlyRate = interestRate / 100m / 12m;
        var monthlyPayment = (request.Amount * monthlyRate * (decimal)Math.Pow((double)(1 + monthlyRate), request.TermMonths))
            / ((decimal)Math.Pow((double)(1 + monthlyRate), request.TermMonths) - 1);

        var totalPayment = monthlyPayment * request.TermMonths;
        var totalInterest = totalPayment - request.Amount;
        var totalCost = totalPayment + commission + insurance;

        // Online payment equivalent
        var onlinePaymentEquivalent = request.Amount * 1.025m; // 2.5% premium for online
        var onlinePaymentAvailable = true;

        // POS payment equivalent
        var posPaymentEquivalent = request.Amount * 1.035m; // 3.5% premium for POS
        var posPaymentAvailable = request.CustomerType == "individual"; // Only individuals can use POS
        var posInstallments = Math.Min(request.TermMonths, 12); // Max 12 installments for POS

        return new POSSimulationResult
        {
            Amount = request.Amount,
            TermMonths = request.TermMonths,
            InterestRate = (double)interestRate,
            Commission = commission,
            Insurance = insurance,
            MonthlyPayment = monthlyPayment,
            TotalCost = totalCost,
            TotalInterest = totalInterest,
            OnlinePaymentAvailable = onlinePaymentAvailable,
            OnlinePaymentEquivalent = onlinePaymentEquivalent,
            POSPaymentAvailable = posPaymentAvailable,
            POSPaymentEquivalent = posPaymentEquivalent,
            POSInstallments = posInstallments,
            CalculatedAt = DateTime.UtcNow
        };
    }
}

public class POSSimulationRequest
{
    public string ProductId { get; set; }
    public decimal Amount { get; set; }
    public int TermMonths { get; set; }
    public string CustomerType { get; set; } = "individual"; // individual or business
}

public class POSSimulationResult
{
    public decimal Amount { get; set; }
    public int TermMonths { get; set; }
    public double InterestRate { get; set; }
    public decimal Commission { get; set; }
    public decimal Insurance { get; set; }
    public decimal MonthlyPayment { get; set; }
    public decimal TotalCost { get; set; }
    public decimal TotalInterest { get; set; }
    public bool OnlinePaymentAvailable { get; set; }
    public decimal OnlinePaymentEquivalent { get; set; }
    public bool POSPaymentAvailable { get; set; }
    public decimal POSPaymentEquivalent { get; set; }
    public int POSInstallments { get; set; }
    public DateTime CalculatedAt { get; set; }
}
