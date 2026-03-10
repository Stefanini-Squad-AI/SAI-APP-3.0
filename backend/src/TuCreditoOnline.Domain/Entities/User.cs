using TuCreditoOnline.Domain.Common;

namespace TuCreditoOnline.Domain.Entities;

public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = "Admin"; // Admin, Reviewer, etc.
    public bool IsActive { get; set; } = true;
    public DateTime LastLogin { get; set; }
}
