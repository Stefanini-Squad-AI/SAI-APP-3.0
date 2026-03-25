using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

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
    /// Calculate POS simulation with amortization and payment method options.
    /// Public endpoint for static SPA deployment (e.g. Surge).
    /// </summary>
    [HttpPost("calculate")]
    [AllowAnonymous]
    public IActionResult Calculate([FromBody] POSSimulationRequest request)
    {
        _logger.LogInformation("POS Simulation request: Amount={Amount}, Term={Term}, Type={Type}", 
            request.Amount, request.TermMonths, request.CustomerType);

        // Validation
        if (request.Amount <= 0)
            return BadRequest(new { message = "Amount must be greater than 0" });

        if (request.TermMonths < 1 || request.TermMonths > 60)
            return BadRequest(new { message = "Term must be between 1 and 60 months" });

        try
        {
            var result = CalculateSimulation(request);
            _logger.LogInformation("POS Simulation completed: Monthly={Monthly}, Total={Total}", 
                result.MonthlyPayment, result.TotalCost);
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
        // Determine annual interest rate
        decimal annualRate = request.CustomerType?.ToLower() == "business" ? 0.185m : 0.218m;
        decimal monthlyRate = annualRate / 12;

        // Calculate monthly payment using standard amortization formula
        decimal monthlyPayment;
        if (monthlyRate == 0)
        {
            monthlyPayment = request.Amount / request.TermMonths;
        }
        else
        {
            var pow = (decimal)Math.Pow((double)(1 + monthlyRate), request.TermMonths);
            monthlyPayment = request.Amount * (monthlyRate * pow) / (pow - 1);
        }

        decimal totalPayment = monthlyPayment * request.TermMonths;
        decimal totalInterest = totalPayment - request.Amount;
        decimal commission = request.Amount * 0.02m;
        decimal insurance = request.Amount * 0.015m;
        decimal totalCost = totalPayment + commission + insurance;

        // Payment method surcharges
        decimal onlinePaymentEquivalent = request.Amount * 1.025m;
        bool posAvailable = request.CustomerType?.ToLower() != "business";
        decimal? posPaymentEquivalent = posAvailable ? request.Amount * 1.035m : null;
        int? posInstallments = posAvailable ? Math.Min(request.TermMonths, 12) : null;

        return new POSSimulationResult
        {
            Amount = request.Amount,
            TermMonths = request.TermMonths,
            InterestRate = (double)annualRate * 100,
            Commission = commission,
            Insurance = insurance,
            MonthlyPayment = (double)monthlyPayment,
            TotalCost = (double)totalCost,
            TotalInterest = (double)totalInterest,
            OnlinePaymentAvailable = true,
            OnlinePaymentEquivalent = (double)onlinePaymentEquivalent,
            POSPaymentAvailable = posAvailable,
            POSPaymentEquivalent = posPaymentEquivalent.HasValue ? (double)posPaymentEquivalent.Value : null,
            POSInstallments = posInstallments,
            CalculatedAt = DateTime.UtcNow,
        };
    }
}

/// <summary>
/// Request DTO for POS simulation calculation
/// </summary>
public class POSSimulationRequest
{
    [Required]
    public string? ProductId { get; set; }

    [Required]
    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }

    [Required]
    [Range(1, 60)]
    public int TermMonths { get; set; }

    public string? CustomerType { get; set; } = "individual";
}

/// <summary>
/// Response DTO for POS simulation calculation
/// </summary>
public class POSSimulationResult
{
    public decimal Amount { get; set; }
    public int TermMonths { get; set; }
    public double InterestRate { get; set; }
    public decimal Commission { get; set; }
    public decimal Insurance { get; set; }
    public double MonthlyPayment { get; set; }
    public double TotalCost { get; set; }
    public double TotalInterest { get; set; }
    public bool OnlinePaymentAvailable { get; set; }
    public double OnlinePaymentEquivalent { get; set; }
    public bool POSPaymentAvailable { get; set; }
    public double? POSPaymentEquivalent { get; set; }
    public int? POSInstallments { get; set; }
    public DateTime CalculatedAt { get; set; }
}
