using SportsManager.Controllers;
using SportsManager.ViewModels;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels.Controllers
{
    public class SeasonStatisticsViewModel : AccountViewModel
    {
        public SeasonStatisticsViewModel(DBController c, long accountId, long seasonId, long leagueId, long divisionId)
            : base(c, accountId)
        {
            if (accountId == 0)
            {
                var l = c.Db.LeagueSeasons.Find(leagueId);
                accountId = l.League.Id;
            }

            SeasonId = seasonId;

        }

        public long SeasonId { get; private set; }

        public IEnumerable<SelectListItem> GetSeasons()
        {
            var seasons = Controller.Db.Seasons.Where(s => s.AccountId == AccountId);
            long currentSeason = CurrentSeasonId;

            List<SelectListItem> seasonListItems = new List<SelectListItem>();
            seasonListItems.Add(new SelectListItem() { Text = "Current Season", Value = currentSeason.ToString(), Selected = currentSeason == SeasonId });
            seasonListItems.Add(new SelectListItem() { Text = "All Seasons", Value = "0", Selected = SeasonId == 0 });

            seasonListItems.AddRange((from s in seasons
                                      select new SelectListItem() { Text = s.Name, Value = s.Id.ToString(), Selected = (s.Id == SeasonId && s.Id != currentSeason) }));

            return seasonListItems;
        }
    }
}