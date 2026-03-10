using System.ComponentModel.DataAnnotations;

namespace TuCreditoOnline.Application.DTOs;

/// <summary>
/// DTO for creating a new contact message
/// </summary>
public class CreateContactMessageDto
{
    [Required(ErrorMessage = "Name is required")]
    [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Subject is required")]
    [StringLength(200, ErrorMessage = "Subject cannot exceed 200 characters")]
    public string Subject { get; set; } = string.Empty;

    [Required(ErrorMessage = "Message is required")]
    [StringLength(2000, ErrorMessage = "Message cannot exceed 2000 characters")]
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// DTO for updating a message status
/// </summary>
public class UpdateContactMessageStatusDto
{
    [Required]
    public int Status { get; set; } // 0=New, 1=InProgress, 2=Replied, 3=Closed

    public string? AdminNotes { get; set; }
}

/// <summary>
/// DTO for a contact message response
/// </summary>
public class ContactMessageDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public int Status { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? RespondedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public string? AdminNotes { get; set; }
    public string? RespondedBy { get; set; }
    public string? ClosedBy { get; set; }
}

/// <summary>
/// DTO for message statistics
/// </summary>
public class ContactMessageStatsDto
{
    public int TotalMessages { get; set; }
    public int NewMessages { get; set; }
    public int InProgressMessages { get; set; }
    public int RespondedMessages { get; set; }
    public int ClosedMessages { get; set; }
    public double AverageResponseTimeHours { get; set; }
}
