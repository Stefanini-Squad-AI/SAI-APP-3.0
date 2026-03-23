using TuCreditoOnline.Domain.Entities;

namespace TuCreditoOnline.Tests.UnitTests.Domain.Entities;

public class CreditRequestTests
{
    [Fact]
    public void TermMonths_ShouldEqualTermYearsMultipliedByTwelve()
    {
        var request = new CreditRequest { TermYears = 5 };

        request.TermMonths.Should().Be(60);
    }
}
