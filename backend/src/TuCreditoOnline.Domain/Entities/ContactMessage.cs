using TuCreditoOnline.Domain.Common;

namespace TuCreditoOnline.Domain.Entities;

/// <summary>
/// Represents a contact message submitted by a user
/// </summary>
public class ContactMessage : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public ContactMessageStatus Status { get; set; } = ContactMessageStatus.New;
    public DateTime? RespondedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public string? AdminNotes { get; set; }
    public string? RespondedBy { get; set; } // Email of the admin who replied
    public string? ClosedBy { get; set; }    // Email of the admin who closed it
}

/// <summary>
/// Sequential lifecycle states for a contact message
/// </summary>
public enum ContactMessageStatus
{
    New = 0,        // Initial state — new unread message
    InProgress = 1, // Admin is actively processing
    Replied = 2,    // A reply was sent to the customer
    Closed = 3      // Conversation closed/resolved
}
