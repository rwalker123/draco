using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using ModelObjects;

namespace SportsManager.Baseball.ViewModels
{
    public class SeasonStatisticsViewModel
    {
        public SeasonStatisticsViewModel(long accountId, long seasonId, long leagueId, long divisionId)
        {
            if (accountId == 0)
            {
                League l = DataAccess.Leagues.GetLeague(leagueId);
                accountId = l.AccountId;
            }

            AccountId = accountId;
            AccountName = DataAccess.Accounts.GetAccountName(accountId);

            SeasonId = seasonId;
            SeasonName = DataAccess.Seasons.GetSeasonName(seasonId);

            LeagueId = leagueId;
            if (seasonId == 0) // historical stats will use leagueId, not leagueSeasonId
                LeagueName = DataAccess.Leagues.GetLeagueNameFromLeagueId(leagueId);
            else
                LeagueName = DataAccess.Leagues.GetLeagueName(leagueId);

            DivisionId = divisionId;
            if (DivisionId != 0)
                DivisionName = DataAccess.Divisions.GetDivisionName(divisionId);

            UseHistorical = seasonId == 0;
        }

        public long AccountId { get; private set; }
        public long LeagueId { get; private set; }
        public long DivisionId { get; private set; }
        public string AccountName { get; private set; }
        public string LeagueName { get; private set; }
        public string DivisionName { get; private set; }
        public bool UseHistorical { get; private set; }
        public long SeasonId { get; private set; }
        public string SeasonName { get; private set; }

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