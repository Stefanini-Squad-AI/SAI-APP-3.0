using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Conventions;
using MongoDB.Driver;

namespace TuCreditoOnline.Infrastructure.Persistence;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;
    private readonly MongoDbSettings _settings;

    static MongoDbContext()
    {
        // Configure MongoDB to use camelCase for property names
        var conventionPack = new ConventionPack
        {
            new CamelCaseElementNameConvention()
        };
        ConventionRegistry.Register("camelCase", conventionPack, t => true);
        
        // Configure DateTime serialization to use UTC
        BsonSerializer.RegisterSerializer(typeof(DateTime), new MongoDB.Bson.Serialization.Serializers.DateTimeSerializer(DateTimeKind.Utc));
    }

    public MongoDbContext(IOptions<MongoDbSettings> settings)
    {
        _settings = settings.Value;
        var client = new MongoClient(_settings.ConnectionString);
        _database = client.GetDatabase(_settings.DatabaseName);
    }

    public IMongoDatabase Database => _database;

    public IMongoCollection<T> GetCollection<T>(string name)
    {
        return _database.GetCollection<T>(name);
    }

    public MongoDbSettings GetMongoSettings()
    {
        return _settings;
    }
}

public class MongoDbSettings
{
    public string ConnectionString { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = string.Empty;
}
