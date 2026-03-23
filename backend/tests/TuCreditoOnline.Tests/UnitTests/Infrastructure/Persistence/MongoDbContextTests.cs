using Microsoft.Extensions.Options;
using TuCreditoOnline.Domain.Entities;
using TuCreditoOnline.Infrastructure.Persistence;

namespace TuCreditoOnline.Tests.UnitTests.Infrastructure.Persistence;

public class MongoDbContextTests
{
    [Fact]
    public void GetMongoSettings_ShouldReturnInjectedSettings()
    {
        var settings = new MongoDbSettings
        {
            ConnectionString = "mongodb://127.0.0.1:27017",
            DatabaseName = "unit_test_db"
        };

        var context = new MongoDbContext(Options.Create(settings));

        context.GetMongoSettings().Should().BeSameAs(settings);
    }

    [Fact]
    public void Database_ShouldExposeConfiguredDatabaseName()
    {
        var settings = new MongoDbSettings
        {
            ConnectionString = "mongodb://127.0.0.1:27017",
            DatabaseName = "unit_test_db"
        };

        var context = new MongoDbContext(Options.Create(settings));

        context.Database.DatabaseNamespace.DatabaseName.Should().Be("unit_test_db");
    }

    [Fact]
    public void GetCollection_ShouldReturnNonNullCollection()
    {
        var settings = new MongoDbSettings
        {
            ConnectionString = "mongodb://127.0.0.1:27017",
            DatabaseName = "unit_test_db"
        };

        var context = new MongoDbContext(Options.Create(settings));

        var collection = context.GetCollection<User>("users");

        collection.Should().NotBeNull();
        collection.CollectionNamespace.CollectionName.Should().Be("users");
    }
}
