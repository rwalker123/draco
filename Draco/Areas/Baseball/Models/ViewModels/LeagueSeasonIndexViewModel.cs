using SportsManager.ViewModels;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels
{
    public class LeagueSeasonIndexViewModel : AccountViewModel
    {
        public LeagueSeasonIndexViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
            var season = DataAccess.Seasons.GetSeason(CurrentSeasonId);
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