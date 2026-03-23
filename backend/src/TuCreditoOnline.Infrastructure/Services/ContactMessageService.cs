using Microsoft.Extensions.Logging;
using TuCreditoOnline.Application.Common.Models;
using TuCreditoOnline.Application.DTOs;
using TuCreditoOnline.Domain.Entities;
using TuCreditoOnline.Infrastructure.Repositories;

namespace TuCreditoOnline.Infrastructure.Services;

public class ContactMessageService
{
    private readonly ContactMessageRepository _contactMessageRepository;
    private readonly ILogger<ContactMessageService> _logger;

    public ContactMessageService(
        ContactMessageRepository contactMessageRepository,
        ILogger<ContactMessageService> logger)
    {
        _contactMessageRepository = contactMessageRepository;
        _logger = logger;
    }

    /// <summary>
    /// Creates a new contact message
    /// </summary>
    public virtual async Task<Result<ContactMessageDto>> CreateAsync(CreateContactMessageDto dto)
    {
        try
        {
            var message = new ContactMessage
            {
                Name = dto.Name.Trim(),
                Email = dto.Email.Trim().ToLower(),
                Subject = dto.Subject.Trim(),
                Message = dto.Message.Trim(),
                Status = ContactMessageStatus.New,
                CreatedAt = DateTime.UtcNow
            };

            await _contactMessageRepository.AddAsync(message);

            _logger.LogInformation("New contact message created: {MessageId} from {Email}",
                message.Id, message.Email);

            return Result.Success(MapToDto(message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating contact message");
            return Result.Failure<ContactMessageDto>($"Failed to create message: {ex.Message}");
        }
    }

    /// <summary>
    /// Returns all messages, optionally filtered by status
    /// </summary>
    public virtual async Task<Result<List<ContactMessageDto>>> GetAllAsync(int? status = null)
    {
        try
        {
            List<ContactMessage> messages;

            if (status.HasValue && Enum.IsDefined(typeof(ContactMessageStatus), status.Value))
            {
                var messagesEnum = await _contactMessageRepository.GetByStatusAsync((ContactMessageStatus)status.Value);
                messages = messagesEnum.ToList();
            }
            else
            {
                var messagesEnum = await _contactMessageRepository.GetAllAsync();
                messages = messagesEnum.ToList();
            }

            var response = messages
                .OrderByDescending(m => m.CreatedAt)
                .Select(MapToDto)
                .ToList();

            return Result.Success(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching contact messages");
            return Result.Failure<List<ContactMessageDto>>($"Failed to fetch messages: {ex.Message}");
        }
    }

    /// <summary>
    /// Returns a single message by ID
    /// </summary>
    public virtual async Task<Result<ContactMessageDto>> GetByIdAsync(string id)
    {
        try
        {
            var message = await _contactMessageRepository.GetByIdAsync(id);
            if (message == null)
                return Result.Failure<ContactMessageDto>("Message not found");

            return Result.Success(MapToDto(message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching message {MessageId}", id);
            return Result.Failure<ContactMessageDto>($"Failed to fetch message: {ex.Message}");
        }
    }

    /// <summary>
    /// Updates the status of a message
    /// </summary>
    public virtual async Task<Result<ContactMessageDto>> UpdateStatusAsync(
        string id,
        UpdateContactMessageStatusDto dto,
        string adminEmail)
    {
        try
        {
            var message = await _contactMessageRepository.GetByIdAsync(id);
            if (message == null)
                return Result.Failure<ContactMessageDto>("Message not found");

            if (!IsValidStatusTransition(message.Status, (ContactMessageStatus)dto.Status))
            {
                return Result.Failure<ContactMessageDto>(
                    $"Invalid status transition: {message.Status} -> {(ContactMessageStatus)dto.Status}");
            }

            var oldStatus = message.Status;
            message.Status = (ContactMessageStatus)dto.Status;
            message.UpdatedAt = DateTime.UtcNow;

            if (!string.IsNullOrWhiteSpace(dto.AdminNotes))
                message.AdminNotes = dto.AdminNotes.Trim();

            switch (message.Status)
            {
                case ContactMessageStatus.Replied:
                    if (!message.RespondedAt.HasValue)
                    {
                        message.RespondedAt = DateTime.UtcNow;
                        message.RespondedBy = adminEmail;
                    }
                    break;

                case ContactMessageStatus.Closed:
                    if (!message.ClosedAt.HasValue)
                    {
                        message.ClosedAt = DateTime.UtcNow;
                        message.ClosedBy = adminEmail;
                    }
                    break;
            }

            await _contactMessageRepository.UpdateAsync(message);

            _logger.LogInformation(
                "Message {MessageId} status updated: {OldStatus} -> {NewStatus} by {Admin}",
                message.Id, oldStatus, message.Status, adminEmail);

            return Result.Success(MapToDto(message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating status for message {MessageId}", id);
            return Result.Failure<ContactMessageDto>($"Failed to update status: {ex.Message}");
        }
    }

    /// <summary>
    /// Returns pending messages (New or InProgress)
    /// </summary>
    public virtual async Task<Result<List<ContactMessageDto>>> GetPendingMessagesAsync()
    {
        try
        {
            var messages = await _contactMessageRepository.GetPendingMessagesAsync();
            var response = messages.Select(MapToDto).ToList();
            return Result.Success(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching pending messages");
            return Result.Failure<List<ContactMessageDto>>($"Failed to fetch pending messages: {ex.Message}");
        }
    }

    /// <summary>
    /// Returns message statistics
    /// </summary>
    public virtual async Task<Result<ContactMessageStatsDto>> GetStatsAsync()
    {
        try
        {
            var allMessages = await _contactMessageRepository.GetAllAsync();
            var statusCounts = await _contactMessageRepository.GetStatusCountsAsync();

            var respondedMessages = allMessages
                .Where(m => m.RespondedAt.HasValue)
                .ToList();

            double avgResponseTime = 0;
            if (respondedMessages.Count > 0)
            {
                avgResponseTime = respondedMessages
                    .Select(m => (m.RespondedAt!.Value - m.CreatedAt).TotalHours)
                    .Average();
            }

            var stats = new ContactMessageStatsDto
            {
                TotalMessages = allMessages.Count(),
                NewMessages = statusCounts.GetValueOrDefault(ContactMessageStatus.New, 0),
                InProgressMessages = statusCounts.GetValueOrDefault(ContactMessageStatus.InProgress, 0),
                RespondedMessages = statusCounts.GetValueOrDefault(ContactMessageStatus.Replied, 0),
                ClosedMessages = statusCounts.GetValueOrDefault(ContactMessageStatus.Closed, 0),
                AverageResponseTimeHours = Math.Round(avgResponseTime, 2)
            };

            return Result.Success(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching message statistics");
            return Result.Failure<ContactMessageStatsDto>($"Failed to fetch statistics: {ex.Message}");
        }
    }

    /// <summary>
    /// Soft-deletes a message by ID
    /// </summary>
    public virtual async Task<Result<bool>> DeleteAsync(string id)
    {
        try
        {
            var message = await _contactMessageRepository.GetByIdAsync(id);
            if (message == null)
                return Result.Failure<bool>("Message not found");

            await _contactMessageRepository.DeleteAsync(id);
            _logger.LogInformation("Message {MessageId} deleted", id);

            return Result.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting message {MessageId}", id);
            return Result.Failure<bool>($"Failed to delete message: {ex.Message}");
        }
    }

    private static ContactMessageDto MapToDto(ContactMessage message)
    {
        return new ContactMessageDto
        {
            Id = message.Id,
            Name = message.Name,
            Email = message.Email,
            Subject = message.Subject,
            Message = message.Message,
            Status = (int)message.Status,
            StatusText = GetStatusText(message.Status),
            CreatedAt = message.CreatedAt,
            RespondedAt = message.RespondedAt,
            ClosedAt = message.ClosedAt,
            AdminNotes = message.AdminNotes,
            RespondedBy = message.RespondedBy,
            ClosedBy = message.ClosedBy
        };
    }

    private static string GetStatusText(ContactMessageStatus status)
    {
        return status switch
        {
            ContactMessageStatus.New => "New",
            ContactMessageStatus.InProgress => "In Progress",
            ContactMessageStatus.Replied => "Replied",
            ContactMessageStatus.Closed => "Closed",
            _ => "Unknown"
        };
    }

    private static bool IsValidStatusTransition(ContactMessageStatus current, ContactMessageStatus next)
    {
        // Status can only move forward — cannot revert to New
        return next switch
        {
            ContactMessageStatus.New => false,
            ContactMessageStatus.InProgress => current == ContactMessageStatus.New,
            ContactMessageStatus.Replied => current == ContactMessageStatus.InProgress ||
                                            current == ContactMessageStatus.New,
            ContactMessageStatus.Closed => current == ContactMessageStatus.Replied ||
                                           current == ContactMessageStatus.InProgress,
            _ => false
        };
    }
}
