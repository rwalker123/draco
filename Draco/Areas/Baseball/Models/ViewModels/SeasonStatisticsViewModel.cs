using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using ModelObjects;
using SportsManager.ViewModels;

namespace SportsManager.Baseball.ViewModels
{
    public class SeasonStatisticsViewModel : AccountViewModel
    {
        public SeasonStatisticsViewModel(Controller c, long accountId, long seasonId, long leagueId, long divisionId)
            : base(c, accountId)
        {
            if (accountId == 0)
            {
                League l = DataAccess.Leagues.GetLeague(leagueId);
                accountId = l.AccountId;
            }

            SeasonId = seasonId;

        }

        public long SeasonId { get; private set; }

        public IEnumerable<SelectListItem> GetSeasons()
        {
            ICollection<Season> seasons = DataAccess.Seasons.GetSeasons(AccountId);
            long currentSeason = DataAccess.Seasons.GetCurrentSeason(AccountId);

            List<SelectListItem> seasonListItems = new List<SelectListItem>();
            seasonListItems.Add(new SelectListItem() { Text = "Current Season", Value = currentSeason.ToString(), Selected = currentSeason == SeasonId });
            seasonListItems.Add(new SelectListItem() { Text = "All Seasons", Value = "0", Selected = SeasonId == 0 });

            seasonListItems.AddRange((from s in seasons
                                      select new SelectListItem() { Text = s.Name, Value = s.Id.ToString(), Selected = (s.Id == SeasonId && s.Id != currentSeason) }));

            return seasonListItems;
        }
    }
}