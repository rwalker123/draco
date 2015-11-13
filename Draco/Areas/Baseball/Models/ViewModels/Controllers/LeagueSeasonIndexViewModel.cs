using SportsManager.Controllers;
using SportsManager.ViewModels;

namespace SportsManager.Baseball.ViewModels.Controllers
{
    public class LeagueSeasonIndexViewModel : AccountViewModel
    {
        public LeagueSeasonIndexViewModel(DBController c, long accountId)
            : base(c, accountId)
        {
            var season = c.GetCurrentSeason(accountId);
            HasSeason = (season != null);

            if (HasSeason)
            {
                SeasonName = season.Name;
            }
        }

        public bool HasSeason
        {
            get;
            private set;
        }

        public string SeasonName
        {
            get;
            private set;
        }
    }
}