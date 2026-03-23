using TuCreditoOnline.Domain.Entities;
using TuCreditoOnline.Infrastructure.Persistence;
using MongoDB.Driver;

namespace TuCreditoOnline.Infrastructure.Repositories;

public class ContactMessageRepository : MongoRepository<ContactMessage>
{
    public ContactMessageRepository(MongoDbContext context) : base(context, "contactMessages")
    {
    }

    // Parameterless constructor required for mocking in tests
    protected ContactMessageRepository() : base()
    {
    }

    /// <summary>
    /// Returns messages filtered by status
    /// </summary>
    public virtual async Task<List<ContactMessage>> GetByStatusAsync(ContactMessageStatus status)
    {
        return await _collection
            .Find(m => m.Status == status && !m.IsDeleted)
            .SortByDescending(m => m.CreatedAt)
            .ToListAsync();
    }

    /// <summary>
    /// Returns a count per status for all non-deleted messages
    /// </summary>
    public virtual async Task<Dictionary<ContactMessageStatus, int>> GetStatusCountsAsync()
    {
        var messages = await _collection
            .Find(m => !m.IsDeleted)
            .ToListAsync();

        return messages
            .GroupBy(m => m.Status)
            .ToDictionary(g => g.Key, g => g.Count());
    }

    /// <summary>
    /// Returns messages that are New or InProgress (not yet replied or closed)
    /// </summary>
    public virtual async Task<List<ContactMessage>> GetPendingMessagesAsync()
    {
        return await _collection
            .Find(m => (m.Status == ContactMessageStatus.New || m.Status == ContactMessageStatus.InProgress)
                       && !m.IsDeleted)
            .SortByDescending(m => m.CreatedAt)
            .ToListAsync();
    }
}
