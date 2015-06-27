using ModelObjects;
using SportsManager.ViewModels;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels
{
    public class BuildStandingsHelper
    {
        private bool m_firstDivisionTeam;
        private int m_divisionWins;
        private int m_divisionLosses;

        private Dictionary<long, List<TeamStanding>> m_divisionStandings = new Dictionary<long, List<TeamStanding>>();

        public double GamesBack
        {
            get;
            private set;
        }

        public IEnumerable<League> Leagues(long seasonId)
        {
            GamesBack = 0.0;

            m_firstDivisionTeam = true;
            m_divisionWins = 0;
            m_divisionLosses = 0;

            return DataAccess.Leagues.GetLeagues(seasonId);
        }

        public IQueryable<Division> GetDivisions(long leagueId)
        {
            m_firstDivisionTeam = true;

            m_divisionStandings.Clear();

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

    public class StandingsViewModel : AccountViewModel
    {
        private BuildStandingsHelper m_standingsHelper = new BuildStandingsHelper();
 
        public StandingsViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
            SeasonId = DataAccess.Seasons.GetCurrentSeason(accountId);
            SeasonName = DataAccess.Seasons.GetSeasonName(SeasonId);

        }

        public StandingsViewModel(Controller c, long accountId, long seasonId)
            : base(c, accountId)
        {
            SeasonId = seasonId;
            SeasonName = DataAccess.Seasons.GetSeasonName(SeasonId);
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

        public double GamesBack
        {
            get { return m_standingsHelper.GamesBack;  }
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
                return m_standingsHelper.Leagues(SeasonId);
            }
        }

        public IQueryable<Division> GetDivisions(long leagueId)
        {
            return m_standingsHelper.GetDivisions(leagueId);
        }

        public List<TeamStanding> GetDivisionStandings(long divisionId)
        {
            return m_standingsHelper.GetDivisionStandings(divisionId);
        }

        public void ProcessTeamStanding(TeamStanding t)
        {
            m_standingsHelper.ProcessTeamStanding(t);
        }
    }
}