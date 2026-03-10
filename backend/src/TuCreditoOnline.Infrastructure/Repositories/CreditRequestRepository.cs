using TuCreditoOnline.Domain.Common;
using TuCreditoOnline.Domain.Entities;
using TuCreditoOnline.Infrastructure.Persistence;

namespace TuCreditoOnline.Infrastructure.Repositories;

public class CreditRequestRepository : MongoRepository<CreditRequest>
{
    public CreditRequestRepository(MongoDbContext context) 
        : base(context, "creditRequests")
    {
    }

    // Parameterless constructor required for mocking in tests
    protected CreditRequestRepository() : base()
    {
    }
}
