using TuCreditoOnline.Domain.Entities;
using TuCreditoOnline.Infrastructure.Persistence;

namespace TuCreditoOnline.Infrastructure.Repositories;

public class CreditTypeRepository : MongoRepository<CreditType>
{
    public CreditTypeRepository(MongoDbContext context) : base(context, "creditTypes")
    {
    }
}
