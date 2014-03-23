using ModelObjects;
using System.Linq;
using System.Web.Http;
using System.Web.Http.OData;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class ScheduleODataController : ODataController
    {
        internal const int PageSize = 30;

        [AcceptVerbs("GET"), HttpGet]
        [Queryable(PageSize = PageSize)]
        public IQueryable<Game> Get(long accountId)
        {
            return DataAccess.Schedule.GetGames(accountId);
        }
    }

}
