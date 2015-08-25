using ModelObjects;
using SportsManager.Controllers;
using SportsManager.ViewModels;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels
{
    public class BuildStandingsHelper
    {
        private long m_prevDivision;
        private int m_divisionWins;
        private int m_divisionLosses;

        private Dictionary<long, List<TeamStandingViewModel>> m_divisionStandings = new Dictionary<long, List<TeamStandingViewModel>>();

        private DB m_db;

        public BuildStandingsHelper(DB db)
        {
            m_db = db;
        }
        public double GamesBack
        {
            get;
            private set;
        }

        public IQueryable<LeagueSeason> Leagues(long seasonId)
        {
            GamesBack = 0.0;

            m_prevDivision = 0;
            m_divisionWins = 0;
            m_divisionLosses = 0;

            return m_db.LeagueSeasons.Where(ls => ls.SeasonId == seasonId);
        }

        public IQueryable<DivisionSeason> GetDivisions(long leagueId)
        {
            m_prevDivision = 0;

            m_divisionStandings.Clear();

            var divisions = (from ds in m_db.DivisionSeasons
                            join dd in m_db.DivisionDefs on ds.DivisionId equals dd.Id
                            where ds.LeagueSeasonId == leagueId
                            orderby ds.Priority ascending, dd.Name ascending
                            select ds);

            foreach (var division in divisions)
                m_divisionStandings.Add(division.Id, new List<TeamStandingViewModel>());

            var teamStandings = GetLeagueStandings(leagueId);
            foreach (var teamStanding in teamStandings)
            {
                m_divisionStandings[teamStanding.DivisionId].Add(teamStanding);
            }

            return divisions;
        }

        public List<TeamStandingViewModel> GetDivisionStandings(long divisionId)
        {
            return m_divisionStandings[divisionId];
        }

        public void ProcessTeamStanding(TeamStandingViewModel t)
        {
            if (m_prevDivision != t.DivisionId)
            {
                GamesBack = 0.0;

                m_divisionWins = t.Wins;
                m_divisionLosses = t.Losses;
                m_prevDivision = t.DivisionId;
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

        private List<TeamStandingViewModel> GetLeagueStandings(long leagueId)
        {
            var rsTeams = m_db.TeamsSeasons.Where(ts => ts.LeagueSeasonId == leagueId);

            var teams = new Dictionary<long, TeamStandingViewModel>();

            foreach (var t in rsTeams)
            {
                if (t.DivisionSeasonId > 0)
                    teams.Add(t.Id, new TeamStandingViewModel(t.Id, t.DivisionSeasonId, t.Name));
            }

            var completedGames = (from ls in m_db.LeagueSchedules
                                  where ls.LeagueId == leagueId &&
                                  (ls.GameStatus == 1 || ls.GameStatus == 4 || ls.GameStatus == 5)
                                  orderby ls.GameDate
                                  select ls);

            foreach (var g in completedGames)
            {
                // only count regular season games
                if (g.GameType == 0)
                {
                    // one team has been removed from the season, this is a strange case
                    // especially if the team has completed games.
                    if (!teams.ContainsKey(g.HTeamId) || !teams.ContainsKey(g.VTeamId))
                        continue;

                    var homeTeam = (TeamStandingViewModel)teams[g.HTeamId];
                    var awayTeam = (TeamStandingViewModel)teams[g.VTeamId];

                    homeTeam.AddGameResult(true, awayTeam, g.HScore, g.VScore, g.GameStatus);
                    awayTeam.AddGameResult(false, homeTeam, g.HScore, g.VScore, g.GameStatus);
                }
            }

            var s = new List<TeamStandingViewModel>(teams.Values);
            s.Sort();

            return s;
        }

    }

    public class StandingsViewModel : AccountViewModel
    {
        private BuildStandingsHelper m_standingsHelper;

        public StandingsViewModel(DBController c, long accountId)
            : base(c, accountId)
        {
            m_standingsHelper = new BuildStandingsHelper(c.Db);

            SeasonId = c.GetCurrentSeasonId(accountId);
            SeasonName = c.Db.Seasons.Find(SeasonId)?.Name;
        }

        public StandingsViewModel(DBController c, long accountId, long seasonId)
            : base(c, accountId)
        {
            SeasonId = seasonId;
            SeasonName = c.Db.Seasons.Find(SeasonId)?.Name;
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
            var seasons = Controller.Db.Seasons.Where(s => s.AccountId == AccountId);
            long currentSeason = Controller.GetCurrentSeasonId(AccountId);

            List<SelectListItem> seasonListItems = new List<SelectListItem>();
            seasonListItems.Add(new SelectListItem() { Text = "Current Season", Value = currentSeason.ToString(), Selected = currentSeason == SeasonId });

            seasonListItems.AddRange((from s in seasons
                                      select new SelectListItem()
                                      {
                                          Text = s.Name,
                                          Value = s.Id.ToString(),
                                          Selected = (s.Id == SeasonId && s.Id != currentSeason)
                                      }));

            return seasonListItems;
        }

        public IQueryable<LeagueSeason> Leagues
        {
            get
            {
                return m_standingsHelper.Leagues(SeasonId);
            }
        }

        public IQueryable<DivisionSeason> GetDivisions(long leagueId)
        {
            return m_standingsHelper.GetDivisions(leagueId);
        }

        public List<TeamStandingViewModel> GetDivisionStandings(long divisionId)
        {
            return m_standingsHelper.GetDivisionStandings(divisionId);
        }

        public void ProcessTeamStanding(TeamStandingViewModel t)
        {
            m_standingsHelper.ProcessTeamStanding(t);
        }
    }
}