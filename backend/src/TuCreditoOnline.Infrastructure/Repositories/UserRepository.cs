using MongoDB.Driver;
using TuCreditoOnline.Domain.Entities;
using TuCreditoOnline.Infrastructure.Persistence;

namespace TuCreditoOnline.Infrastructure.Repositories;

public class UserRepository : MongoRepository<User>
{
    private new readonly IMongoCollection<User> _collection;

    public UserRepository(MongoDbContext context) 
        : base(context, "users")
    {
        _collection = context.GetCollection<User>("users");
    }

    // Parameterless constructor required for mocking in tests
    protected UserRepository() : base()
    {
        _collection = null!;
    }

    public virtual async Task<User?> GetByEmailAsync(string email)
    {
        return await _collection.Find(u => u.Email == email).FirstOrDefaultAsync();
    }

    public virtual async Task<bool> EmailExistsAsync(string email)
    {
        var count = await _collection.CountDocumentsAsync(u => u.Email == email);
        return count > 0;
    }
}
