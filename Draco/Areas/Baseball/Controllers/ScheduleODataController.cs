using AutoMapper.QueryableExtensions;
using ModelObjects;
using SportsManager.ViewModels.API;
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
        public IQueryable<GameViewModel> Get(long accountId)
        {
            long curSeason = m_db.CurrentSeasons.Where(cs => cs.AccountId == accountId).Select(cs => cs.SeasonId).SingleOrDefault();

            return m_db.LeagueSchedules.Where(ls => ls.LeagueSeason.SeasonId == curSeason).Project<Game>().To<GameViewModel>();
        }
    }

}
