using ModelObjects;
using SportsManager.Baseball.ViewModels;
using SportsManager.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.OData;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class StatisticsAPIController : ApiController
    {
        private const int m_allTimeMinAB = 150;
        private const int m_minABPerSeason = 30;
        private const int m_allTimeMinIP = 100;
        private const int m_minIPPerSeason = 20;
        private const int m_numLeaders = 5;

        private const int m_defaultPageSize = 30;

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("batleaders")]
        public HttpResponseMessage GetBatLeaders(long accountId, long leagueSeasonId)
        {
            var queryValues = Request.RequestUri.ParseQueryString();

            int minAB = -1;
            String strMinAB = queryValues["calcMinAB"];
            
            if (!String.IsNullOrEmpty(strMinAB))
            {
                minAB = DataAccess.GameStats.CalculateMinAB(leagueSeasonId);
            }

            int numLeaders = m_numLeaders;
            String strNumLeaders = queryValues["numLeaders"];

            if (!String.IsNullOrEmpty(strNumLeaders))
            {
                Int32.TryParse(strNumLeaders, out numLeaders);
            }

            bool allTimeLeaders = false;
            String strAllTimeLeaders = queryValues["allTimeLeaders"];

            if (!String.IsNullOrEmpty(strAllTimeLeaders))
            {
                bool.TryParse(strAllTimeLeaders, out allTimeLeaders);
            }

            int divisionId = 0;
            String strDivisionId = queryValues["divisionId"];

            if (!String.IsNullOrEmpty(strDivisionId))
            {
                int.TryParse(strDivisionId, out divisionId);
            }

            String statCategory = queryValues["category"] ?? "AVG";
            var leaders = DataAccess.GameStats.GetBatLeagueLeaders(leagueSeasonId, divisionId, statCategory, numLeaders, minAB, allTimeLeaders);
            return Request.CreateResponse<List<ModelObjects.LeagueLeaderStat>>(HttpStatusCode.OK, leaders);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("seasonbatstats")]
        public HttpResponseMessage GetSeasonBatStats(long accountId, long id)
        {
            return GetPlayersBatStats(accountId, id, false);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("alltimebatstats")]
        public HttpResponseMessage GetAlTimeBatStats(long accountId, long id)
        {
            return GetPlayersBatStats(accountId, id, true);
        }

        private HttpResponseMessage GetPlayersBatStats(long accountId, long id, bool allTime)
        {
            var queryValues = Request.RequestUri.ParseQueryString();

            string sortField = queryValues["sortField"] ?? "AVG";
            string sortOrder = queryValues["sortOrder"] ?? "descending";
            string qvDivisionId = queryValues["divisionId"] ?? "0";
            long divisionId = 0;
            if (qvDivisionId != null)
            {
                long.TryParse(qvDivisionId, out divisionId);
            }

            int pageSize = m_defaultPageSize;
            if (queryValues["pageSize"] != null)
                int.TryParse(queryValues["pageSize"], out pageSize);

            int pageNo = 1;
            if (queryValues["pageNo"] != null)
                int.TryParse(queryValues["pageNo"], out pageNo);

            pageNo--;

            IQueryable<ModelObjects.GameBatStats> stats;
            if (divisionId == 0)
                stats = DataAccess.GameStats.GetBatLeaguePlayerTotals(id, sortField, sortOrder, allTime).Skip(pageSize * pageNo).Take(pageSize);
            else
                stats = DataAccess.GameStats.GetBatLeaguePlayerTotals(id, divisionId, sortField, sortOrder).Skip(pageSize * pageNo).Take(pageSize);


            return Request.CreateResponse<IQueryable<ModelObjects.GameBatStats>>(HttpStatusCode.OK, stats);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("batcategories")]
        public HttpResponseMessage GetBatAvailableCategories(long accountId)
        {
            var leaderCats = DataAccess.GameStats.AvailableBatCategories();
            return Request.CreateResponse<IEnumerable<LeaderCategory>>(HttpStatusCode.OK, leaderCats);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("pitchcategories")]
        public HttpResponseMessage GetPitchAvailableCategories(long accountId)
        {
            var leaderCats = DataAccess.GameStats.AvailablePitchCategories();
            return Request.CreateResponse<IEnumerable<LeaderCategory>>(HttpStatusCode.OK, leaderCats);
        }

        // helper for MVC mapping.
        public class LeaderCategories
        {
            public LeaderCategory[] cats { get; set; }
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("setbatcategories")]
        [SportsManagerAuthorize(Roles="AccountAdmin")]
        public HttpResponseMessage PostBatSelectedCategories(long accountId, LeaderCategories categories)
        {
            var success = DataAccess.GameStats.AddLeaderCategories(accountId, 0, true, categories.cats);
            if (success)
                return Request.CreateResponse(HttpStatusCode.OK);
            else
                return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("setpitchcategories")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage PostPitchSelectedCategories(long accountId, LeaderCategories categories)
        {
            var success = DataAccess.GameStats.AddLeaderCategories(accountId, 0, false, categories.cats);
            if (success)
                return Request.CreateResponse(HttpStatusCode.OK);
            else
                return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("batselectedcategories")]
        public HttpResponseMessage GetBatSelectedCategories(long accountId)
        {
            var leaderCats = DataAccess.GameStats.GetLeaderCategories(accountId, 0, true);
            return Request.CreateResponse<IEnumerable<LeaderCategory>>(HttpStatusCode.OK, leaderCats);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("pitchselectedcategories")]
        public HttpResponseMessage GetPitchSelectedCategories(long accountId)
        {
            var leaderCats = DataAccess.GameStats.GetLeaderCategories(accountId, 0, false);
            return Request.CreateResponse<IEnumerable<LeaderCategory>>(HttpStatusCode.OK, leaderCats);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("pitchleaders")]
        public HttpResponseMessage GetPitchLeaders(long accountId, long leagueSeasonId)
        {
            var queryValues = Request.RequestUri.ParseQueryString();

            int minIP = -1;
            String strMinIP = queryValues["calcMinIP"];

            if (!String.IsNullOrEmpty(strMinIP))
            {
                minIP = DataAccess.GameStats.CalculateMinIP(leagueSeasonId);
            }

            int numLeaders = m_numLeaders;
            String strNumLeaders = queryValues["numLeaders"];

            if (!String.IsNullOrEmpty(strNumLeaders))
            {
                Int32.TryParse(strNumLeaders, out numLeaders);
            }

            bool allTimeLeaders = false;
            String strAllTimeLeaders = queryValues["allTimeLeaders"];

            if (!String.IsNullOrEmpty(strAllTimeLeaders))
            {
                bool.TryParse(strAllTimeLeaders, out allTimeLeaders);
            }

            int divisionId = 0;
            String strDivisionId = queryValues["divisionId"];

            if (!String.IsNullOrEmpty(strDivisionId))
            {
                int.TryParse(strDivisionId, out divisionId);
            }

            String statCategory = queryValues["category"] ?? "ERA";
            var leaders = DataAccess.GameStats.GetPitchLeagueLeaders(leagueSeasonId, divisionId, statCategory, numLeaders, minIP, allTimeLeaders);
            return Request.CreateResponse<List<ModelObjects.LeagueLeaderStat>>(HttpStatusCode.OK, leaders);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("teambatleaders")]
        public HttpResponseMessage GetTeamBatLeaders(long accountId, long teamSeasonId)
        {
            var queryValues = Request.RequestUri.ParseQueryString();

            int minAB = -1;
            String strMinAB = queryValues["calcMinAB"];

            if (!String.IsNullOrEmpty(strMinAB))
            {
                minAB = DataAccess.GameStats.CalculateTeamMinAB(teamSeasonId);
            }

            int numLeaders = m_numLeaders;
            String strNumLeaders = queryValues["numLeaders"];

            if (!String.IsNullOrEmpty(strNumLeaders))
            {
                Int32.TryParse(strNumLeaders, out numLeaders);
            }

            String statCategory = queryValues["category"] ?? "AVG";
            var leaders = DataAccess.GameStats.GetBatTeamLeaders(teamSeasonId, statCategory, numLeaders, minAB, false);
            return Request.CreateResponse<List<ModelObjects.LeagueLeaderStat>>(HttpStatusCode.OK, leaders);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("teampitchleaders")]
        public HttpResponseMessage GetTeamPitchLeaders(long accountId, long teamSeasonId)
        {
            var queryValues = Request.RequestUri.ParseQueryString();

            int minIP = -1;
            String strMinIP = queryValues["calcMinIP"];

            if (!String.IsNullOrEmpty(strMinIP))
            {
                minIP = DataAccess.GameStats.CalculateTeamMinIP(teamSeasonId);
            }

            int numLeaders = m_numLeaders;
            String strNumLeaders = queryValues["numLeaders"];

            if (!String.IsNullOrEmpty(strNumLeaders))
            {
                Int32.TryParse(strNumLeaders, out numLeaders);
            }

            String statCategory = queryValues["category"] ?? "ERA";
            var leaders = DataAccess.GameStats.GetPitchTeamLeaders(teamSeasonId, statCategory, numLeaders, minIP, false);
            return Request.CreateResponse<List<ModelObjects.LeagueLeaderStat>>(HttpStatusCode.OK, leaders);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("seasonpitchstats")]
        public HttpResponseMessage GetSeasonPitchStats(long accountId, long id)
        {
            return GetPlayersPitchStats(accountId, id, false);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("alltimepitchstats")]
        public HttpResponseMessage GetAlTimePitchStats(long accountId, long id)
        {
            return GetPlayersPitchStats(accountId, id, true);
        }

        private HttpResponseMessage GetPlayersPitchStats(long accountId, long id, bool allTime)
        {
            var queryValues = Request.RequestUri.ParseQueryString();

            string sortField = queryValues["sortField"] ?? "ERA";
            string sortOrder = queryValues["sortOrder"] ?? "ascending";
            string qvDivisionId = queryValues["divisionId"] ?? "0";
            long divisionId = 0;
            if (qvDivisionId != null)
            {
                long.TryParse(qvDivisionId, out divisionId);
            }

            int pageSize = m_defaultPageSize;
            if (queryValues["pageSize"] != null)
                int.TryParse(queryValues["pageSize"], out pageSize);

            int pageNo = 1;
            if (queryValues["pageNo"] != null)
                int.TryParse(queryValues["pageNo"], out pageNo);

            pageNo--;

            IQueryable<ModelObjects.GamePitchStats> stats;

            if (divisionId == 0)
                stats = DataAccess.GameStats.GetPitchLeaguePlayerTotals(id, sortField, sortOrder, allTime).Skip(pageSize * pageNo).Take(pageSize);
            else
                stats = DataAccess.GameStats.GetPitchLeaguePlayerTotals(id, divisionId, sortField, sortOrder).Skip(pageSize * pageNo).Take(pageSize);

            return Request.CreateResponse<IQueryable<ModelObjects.GamePitchStats>>(HttpStatusCode.OK, stats);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("historicalleagues")]
        public HttpResponseMessage GetHistoricalLeagues(long accountId)
        {
            var leagues = DataAccess.Leagues.GetLeaguesFromSeason(accountId, true);
            return Request.CreateResponse<IQueryable<ModelObjects.League>>(HttpStatusCode.OK, leagues);
        }

        class TeamStandingGamesBack : TeamStanding
        {
            public TeamStandingGamesBack()
            {

            }

            public TeamStandingGamesBack(TeamStanding copyFrom)
                : base(copyFrom)
            {
                
            }

            public double GamesBack { get; set; }
        }
        class DivisionStanding
        {
            public String Name { get; set; }
            public List<TeamStandingGamesBack> Standings { get; set; }
        }

        class LeagueStanding
        {
            public String Name { get; set; }
            public List<DivisionStanding> Divisions { get; set; }
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("historicalstandings")]
        public HttpResponseMessage GetHistoricalStandings(long accountId, long id)
        {
            BuildStandingsHelper standingsHelper = new BuildStandingsHelper();

            var standings = new List<LeagueStanding>();

            var leagues = standingsHelper.Leagues(id);
            foreach(var league in leagues)
            {
                var ls = new LeagueStanding()
                    {
                        Name = league.Name,
                        Divisions = new List<DivisionStanding>()
                    };

                standings.Add(ls);

                foreach(var division in standingsHelper.GetDivisions(league.Id))
                {
                    var d = new DivisionStanding()
                    {
                        Name = division.Name,
                        Standings = new List<TeamStandingGamesBack>()
                    };

                    ls.Divisions.Add(d);

                    foreach(var t in standingsHelper.GetDivisionStandings(division.Id))
                    {
                        standingsHelper.ProcessTeamStanding(t);
                        var ts = new TeamStandingGamesBack(t)
                        {
                            GamesBack = standingsHelper.GamesBack
                        };

                        d.Standings.Add(ts);
                    }
                }
            }

            return Request.CreateResponse<IEnumerable<LeagueStanding>>(HttpStatusCode.OK, standings);
        }
    }
}
