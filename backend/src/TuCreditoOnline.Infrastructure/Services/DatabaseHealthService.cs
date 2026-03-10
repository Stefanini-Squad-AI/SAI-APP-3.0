using MongoDB.Bson;
using MongoDB.Driver;
using TuCreditoOnline.Infrastructure.Persistence;

namespace TuCreditoOnline.Infrastructure.Services;

public interface IDatabaseHealthService
{
    Task<DatabaseHealthResult> CheckHealthAsync(CancellationToken cancellationToken = default);
}

public class DatabaseHealthService : IDatabaseHealthService
{
    private readonly MongoDbContext _context;

    public DatabaseHealthService(MongoDbContext context)
    {
        _context = context;
    }

    public async Task<DatabaseHealthResult> CheckHealthAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var startTime = DateTime.UtcNow;
            
            // Ping database to check connection
            var command = new BsonDocument { { "ping", 1 } };
            await _context.Database.RunCommandAsync<BsonDocument>(command, cancellationToken: cancellationToken);
            
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            
            // Get database name
            var databaseName = _context.Database.DatabaseNamespace.DatabaseName;
            
            // Get collections count
            var collections = await _context.Database.ListCollectionNamesAsync(cancellationToken: cancellationToken);
            var collectionsList = await collections.ToListAsync(cancellationToken);
            
            return new DatabaseHealthResult
            {
                IsHealthy = true,
                Message = "Database connection is healthy",
                DatabaseName = databaseName,
                ResponseTimeMs = responseTime,
                CollectionsCount = collectionsList.Count,
                Timestamp = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            return new DatabaseHealthResult
            {
                IsHealthy = false,
                Message = $"Database connection failed: {ex.Message}",
                Timestamp = DateTime.UtcNow
            };
        }
    }
}

public class DatabaseHealthResult
{
    public bool IsHealthy { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? DatabaseName { get; set; }
    public double? ResponseTimeMs { get; set; }
    public int? CollectionsCount { get; set; }
    public DateTime Timestamp { get; set; }
}
