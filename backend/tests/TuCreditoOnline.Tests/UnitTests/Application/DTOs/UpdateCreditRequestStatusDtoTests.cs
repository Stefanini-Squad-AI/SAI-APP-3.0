using TuCreditoOnline.Application.DTOs;

namespace TuCreditoOnline.Tests.UnitTests.Application.DTOs;

public class UpdateCreditRequestStatusDtoTests
{
    [Fact]
    public void NewStatus_ShouldAliasStatus()
    {
        var dto = new UpdateCreditRequestStatusDto();

        dto.NewStatus = "Approved";
        dto.Status.Should().Be("Approved");

        dto.Status = "Rejected";
        dto.NewStatus.Should().Be("Rejected");
    }

    [Fact]
    public void Properties_ShouldRoundTrip()
    {
        var dto = new UpdateCreditRequestStatusDto
        {
            Status = "Pending",
            Remarks = "Under review",
            ApprovedAmount = 15000.50m,
            ApprovedTermMonths = 48
        };

        dto.Status.Should().Be("Pending");
        dto.Remarks.Should().Be("Under review");
        dto.ApprovedAmount.Should().Be(15000.50m);
        dto.ApprovedTermMonths.Should().Be(48);
    }
}
