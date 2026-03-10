using System.Linq.Expressions;
using MongoDB.Driver;
using TuCreditoOnline.Domain.Common;

namespace TuCreditoOnline.Infrastructure.Persistence;

public class MongoRepository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly IMongoCollection<T> _collection;

    public MongoRepository(MongoDbContext context, string collectionName)
    {
        _collection = context.GetCollection<T>(collectionName);
    }

    // Parameterless constructor required for mocking in tests
    protected MongoRepository()
    {
        _collection = null!;
    }

    public virtual async Task<T?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        var filter = Builders<T>.Filter.Eq(x => x.Id, id) & 
                     Builders<T>.Filter.Eq(x => x.DeletedAt, null);
        return await _collection.Find(filter).FirstOrDefaultAsync(cancellationToken);
    }

    public virtual async Task<IEnumerable<T>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var filter = Builders<T>.Filter.Eq(x => x.DeletedAt, null);
        return await _collection.Find(filter).ToListAsync(cancellationToken);
    }

    public virtual async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default)
    {
        var filter = Builders<T>.Filter.Where(predicate) & 
                     Builders<T>.Filter.Eq(x => x.DeletedAt, null);
        return await _collection.Find(filter).ToListAsync(cancellationToken);
    }

    public virtual async Task<T> AddAsync(T entity, CancellationToken cancellationToken = default)
    {
        entity.CreatedAt = DateTime.UtcNow;
        await _collection.InsertOneAsync(entity, cancellationToken: cancellationToken);
        return entity;
    }

    public virtual async Task UpdateAsync(T entity, CancellationToken cancellationToken = default)
    {
        entity.UpdatedAt = DateTime.UtcNow;
        var filter = Builders<T>.Filter.Eq(x => x.Id, entity.Id);
        await _collection.ReplaceOneAsync(filter, entity, cancellationToken: cancellationToken);
    }

    public virtual async Task DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        var filter = Builders<T>.Filter.Eq(x => x.Id, id);
        var update = Builders<T>.Update
            .Set(x => x.DeletedAt, DateTime.UtcNow)
            .Set(x => x.UpdatedAt, DateTime.UtcNow);
        await _collection.UpdateOneAsync(filter, update, cancellationToken: cancellationToken);
    }

    public virtual async Task<bool> ExistsAsync(string id, CancellationToken cancellationToken = default)
    {
        var filter = Builders<T>.Filter.Eq(x => x.Id, id) & 
                     Builders<T>.Filter.Eq(x => x.DeletedAt, null);
        return await _collection.Find(filter).AnyAsync(cancellationToken);
    }
}
