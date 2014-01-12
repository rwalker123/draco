using ModelObjects;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels
{
    public class StandingsViewModel
    {
        public StandingsViewModel(long accountId)
        {
            AccountId = accountId;
            SeasonId = DataAccess.Seasons.GetCurrentSeason(accountId);
            SeasonName = DataAccess.Seasons.GetSeasonName(SeasonId);
            AccountName = DataAccess.Accounts.GetAccountName(AccountId);

        }

        public StandingsViewModel(long accountId, long seasonId)
        {
            AccountId = accountId;
            SeasonId = seasonId;
            SeasonName = DataAccess.Seasons.GetSeasonName(SeasonId);
            AccountName = DataAccess.Accounts.GetAccountName(AccountId);
        }

        public long AccountId
        {
            get;
            private set;
        }

        public long SeasonId
        {
            get;
            private set;
        }

        public string SeasonName
        {
            get;
            private set;
        }

        public string AccountName
        {
            get;
            private set;
        }

        private bool m_firstDivisionTeam;
        private int m_divisionWins;
        private int m_divisionLosses;

        public double GamesBack
        {
            get;
            private set;
        }

        public IEnumerable<SelectListItem> GetSeasons()
        {
            ICollection<Season> seasons = DataAccess.Seasons.GetSeasons(AccountId);
            long currentSeason = DataAccess.Seasons.GetCurrentSeason(AccountId);

            List<SelectListItem> seasonListItems = new List<SelectListItem>();
            seasonListItems.Add(new SelectListItem() { Text = "Current Season", Value = currentSeason.ToString(), Selected = currentSeason == SeasonId });

            seasonListItems.AddRange((from s in seasons
                                      select new SelectListItem() { Text = s.Name, Value = s.Id.ToString(), Selected = (s.Id == SeasonId && s.Id != currentSeason) }));

            return seasonListItems;
        }

        public IEnumerable<League> Leagues
        {
            get
            {
                GamesBack = 0.0;

                m_firstDivisionTeam = true;
                m_divisionWins = 0;
                m_divisionLosses = 0;

                return DataAccess.Leagues.GetLeagues(SeasonId);
            }
        }

        private Dictionary<long, List<TeamStanding>> m_divisionStandings = new Dictionary<long, List<TeamStanding>>();

        public IQueryable<Division> GetDivisions(long leagueId)
        {
            m_firstDivisionTeam = true;

            IQueryable<Division> divisions = DataAccess.Divisions.GetDivisions(leagueId);

            foreach (Division division in divisions)
                m_divisionStandings.Add(division.Id, new List<TeamStanding>());

            List<TeamStanding> teamStandings = DataAccess.LeagueStandings.GetLeagueStandings(leagueId);
            foreach (TeamStanding teamStanding in teamStandings)
            {
                m_divisionStandings[teamStanding.DivisionId].Add(teamStanding);
            }

            return divisions;
        }

        public List<TeamStanding> GetDivisionStandings(long divisionId)
        {
            return m_divisionStandings[divisionId];
        }

        public void ProcessTeamStanding(TeamStanding t)
        {
            if (m_firstDivisionTeam)
            {
                GamesBack = 0.0;

                m_divisionWins = t.Wins;
                m_divisionLosses = t.Losses;
                m_firstDivisionTeam = false;
            }
            else
            {
                GamesBack = ((t.Wins - m_divisionWins) * .5) - ((t.Losses - m_divisionLosses) * .5);
                if (GamesBack < 0.0)
                {
                    GamesBack *= -1;
                }
            }
        }
    }
}