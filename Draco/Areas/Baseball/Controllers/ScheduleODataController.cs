using ModelObjects;
using System.Linq;
using System.Web.Http;
using System.Web.Http.OData;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class ScheduleODataController : ODataController
    {
        internal const int PageSize = 30;

        private DB m_db;

        public ScheduleODataController(DB db)
        {
            m_db = db;
        }

        [AcceptVerbs("GET"), HttpGet]
        [EnableQuery(PageSize = PageSize)]
        public IQueryable<Game> Get(long accountId)
        {
            System.Diagnostics.Debug.Assert(false, "need to check if returning a view model here runs before the odata query");

            long curSeason = m_db.CurrentSeasons.Where(cs => cs.AccountId == accountId).Select(cs => cs.SeasonId).SingleOrDefault();

            var games = (from ls in m_db.LeagueSchedules
                    join l in m_db.LeagueSeasons on ls.LeagueId equals l.Id
                    join s in m_db.Seasons on l.SeasonId equals s.Id
                    where s.Id == curSeason
                    select ls);

            return games;
        }
    }

}
