using ModelObjects;
using SportsManager.Controllers;
using SportsManager.ViewModels;
using System.Linq;

namespace SportsManager.Baseball.ViewModels.Controllers
{
    public class LeadersViewModel : AccountViewModel
    {
        public LeadersViewModel(DBController c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            TeamSeasonId = teamSeasonId;
        }

        public LeadersViewModel(DBController c, long accountId)
            : base(c, accountId)
        {
            var seasonId = c.GetCurrentSeasonId(accountId);
            Leagues = c.Db.LeagueSeasons.Where(ls => ls.SeasonId == seasonId);
        }

        public long TeamSeasonId { get; private set; }
        public IQueryable<LeagueSeason> Leagues { get; private set; }
    }
}
