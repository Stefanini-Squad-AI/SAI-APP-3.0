using TuCreditoOnline.Domain.Entities;
using TuCreditoOnline.Infrastructure.Persistence;

namespace TuCreditoOnline.Infrastructure.Repositories;

public class ServiceRepository : MongoRepository<Service>
{
    public ServiceRepository(MongoDbContext context) : base(context, "services")
    {
    }
}
