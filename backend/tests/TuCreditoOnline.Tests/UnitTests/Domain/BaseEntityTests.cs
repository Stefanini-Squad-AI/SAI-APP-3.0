using TuCreditoOnline.Domain.Common;

namespace TuCreditoOnline.Tests.UnitTests.Domain;

public class BaseEntityTests
{
    private sealed class SampleEntity : BaseEntity { }

    [Fact]
    public void IsDeleted_ShouldBeFalse_WhenDeletedAtIsNull()
    {
        var entity = new SampleEntity { DeletedAt = null };

        entity.IsDeleted.Should().BeFalse();
    }

    [Fact]
    public void IsDeleted_ShouldBeTrue_WhenDeletedAtIsSet()
    {
        var entity = new SampleEntity { DeletedAt = DateTime.UtcNow };

        entity.IsDeleted.Should().BeTrue();
    }

    [Fact]
    public void DefaultId_ShouldBeNonEmptyGuidString()
    {
        var entity = new SampleEntity();

        entity.Id.Should().NotBeNullOrWhiteSpace();
        Guid.TryParse(entity.Id, out _).Should().BeTrue();
    }

    [Fact]
    public void CreatedAt_ShouldDefaultToUtcNow()
    {
        var entity = new SampleEntity();

        entity.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));
        entity.CreatedAt.Kind.Should().Be(DateTimeKind.Utc);
    }

    [Fact]
    public void UpdatedAt_CanBeSetAndCleared()
    {
        var entity = new SampleEntity();
        var stamp = new DateTime(2024, 6, 1, 12, 0, 0, DateTimeKind.Utc);

        entity.UpdatedAt = stamp;
        entity.UpdatedAt.Should().Be(stamp);

        entity.UpdatedAt = null;
        entity.UpdatedAt.Should().BeNull();
    }
}
