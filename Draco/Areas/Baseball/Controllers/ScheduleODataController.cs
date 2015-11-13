using ModelObjects;
using SportsManager.Baseball.ViewModels.API;
using System.Linq;
using System.Web.Http;
using System.Web.Http.OData;

namespace SportsManager.Baseball.Controllers
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
        public IQueryable<GameViewModel> Get(long accountId) //, ODataQueryOptions<Game> query)
        {
            long curSeason = m_db.CurrentSeasons.Where(cs => cs.AccountId == accountId).Select(cs => cs.SeasonId).SingleOrDefault();
            //var games = query.ApplyTo(m_db.LeagueSchedules.Where(ls => ls.LeagueSeason.SeasonId == curSeason));
            //var vm = Mapper.Map<IQueryable, IQueryable<GameViewModel>>(games);
            //return vm;
            return m_db.LeagueSchedules.Where(ls => ls.LeagueSeason.SeasonId == curSeason)
                .Select(ls => new GameViewModel()
                {
                    Id = ls.Id,
                    AwayScore = ls.VScore,
                    HomeScore = ls.HScore,
                    AwayTeamId = ls.VTeamId,
                    HomeTeamId = ls.HTeamId,
                    FieldId = ls.FieldId,
                    Comment = ls.Comment,
                    FieldName = ls.AvailableField.Name,
                    GameDate = ls.GameDate,
                    GameStatus = ls.GameStatus,
                    GameType = ls.GameType,
                    Umpire1 = ls.Umpire1,
                    Umpire2 = ls.Umpire2,
                    Umpire3 = ls.Umpire3,
                    Umpire4 = ls.Umpire4,
                    LeagueId = ls.LeagueId,
                    LeagueName = ls.LeagueSeason.League.Name,
                    HomePlayersPresent = ls.PlayerRecaps.Where(pr => pr.TeamId == ls.HTeamId).Select(pr => pr.PlayerId),
                    AwayPlayersPresent = ls.PlayerRecaps.Where(pr => pr.TeamId == ls.VTeamId).Select(pr => pr.PlayerId),
                    HomeTeamName = ls.LeagueSeason.TeamsSeasons.Where(ts => ts.Id == ls.HTeamId).Select(ts => ts.Name).FirstOrDefault(),
                    AwayTeamName = ls.LeagueSeason.TeamsSeasons.Where(ts => ts.Id == ls.VTeamId).Select(ts => ts.Name).FirstOrDefault(),
                    HasGameRecap = ls.GameRecaps.Any()
                });
        }
    }

}
