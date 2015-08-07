using AutoMapper;
using ModelObjects;
using SportsManager.Baseball.ViewModels;
using SportsManager.Controllers;
using SportsManager.Models;
using SportsManager.Utils;
using SportsManager.ViewModels.API;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class StatisticsAPIController : DBApiController
    {
        private const int m_allTimeMinAB = 150;
        private const int m_minABPerSeason = 30;
        private const int m_allTimeMinIP = 100;
        private const int m_minIPPerSeason = 20;
        private const int m_numLeaders = 5;

        private const int m_defaultPageSize = 30;

        public StatisticsAPIController(DB db) : base(db)
        {
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("batleaders")]
        public HttpResponseMessage GetBatLeaders(long accountId, long leagueSeasonId)
        {
            var queryValues = Request.RequestUri.ParseQueryString();

            bool allTimeLeaders = false;
            String strAllTimeLeaders = queryValues["allTimeLeaders"];

            if (!String.IsNullOrEmpty(strAllTimeLeaders))
            {
                bool.TryParse(strAllTimeLeaders, out allTimeLeaders);
            }

            int minAB = -1;
            String strMinAB = queryValues["calcMinAB"];
            
            if (!String.IsNullOrEmpty(strMinAB))
            {
                if (allTimeLeaders)
                    minAB = m_allTimeMinAB;
                else
                {
                    var minCalculator = new MinCalculator(Db);
                    minAB = minCalculator.CalculateMinAB(leagueSeasonId);
                }
            }

            int numLeaders = m_numLeaders;
            String strNumLeaders = queryValues["numLeaders"];

            if (!String.IsNullOrEmpty(strNumLeaders))
            {
                Int32.TryParse(strNumLeaders, out numLeaders);
            }

            int divisionId = 0;
            String strDivisionId = queryValues["divisionId"];

            if (!String.IsNullOrEmpty(strDivisionId))
            {
                int.TryParse(strDivisionId, out divisionId);
            }

            String statCategory = queryValues["category"] ?? "AVG";
            var statsHelper = new BatStatsHelper(Db);
            var leaders = statsHelper.GetBatLeagueLeaders(leagueSeasonId, divisionId, statCategory, numLeaders, minAB, allTimeLeaders);
            return Request.CreateResponse<IEnumerable<LeagueLeaderStatViewModel>>(HttpStatusCode.OK, leaders);
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

            IQueryable<BatStatsViewModel> stats;
            var statsHelper = new BatStatsHelper(Db);
            if (divisionId == 0)
                stats = statsHelper.GetBatLeaguePlayerTotals(id, sortField, sortOrder, allTime).Skip(pageSize * pageNo).Take(pageSize);
            else
                stats = statsHelper.GetBatLeaguePlayerTotals(id, divisionId, sortField, sortOrder).Skip(pageSize * pageNo).Take(pageSize);


            return Request.CreateResponse<IEnumerable<BatStatsViewModel>>(HttpStatusCode.OK, stats);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("batcategories")]
        public HttpResponseMessage GetBatAvailableCategories(long accountId)
        {
            var leaderCats = BatStatsHelper.AvailableBatCategories();
            return Request.CreateResponse<IEnumerable<LeaderCategory>>(HttpStatusCode.OK, leaderCats);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("pitchcategories")]
        public HttpResponseMessage GetPitchAvailableCategories(long accountId)
        {
            var leaderCats = PitchStatsHelper.AvailablePitchCategories();
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
            return AddLeaderCategories(accountId, 0, true, categories == null ? null : categories.cats);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("setpitchcategories")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage PostPitchSelectedCategories(long accountId, LeaderCategories categories)
        {
            return AddLeaderCategories(accountId, 0, false, categories == null ? null : categories.cats);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("batselectedcategories")]
        public HttpResponseMessage GetBatSelectedCategories(long accountId)
        {
            var leaderCats = GetLeaderCategories(accountId, 0, true);
            return Request.CreateResponse<IEnumerable<LeaderCategory>>(HttpStatusCode.OK, leaderCats);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("pitchselectedcategories")]
        public HttpResponseMessage GetPitchSelectedCategories(long accountId)
        {
            var leaderCats = GetLeaderCategories(accountId, 0, false);
            return Request.CreateResponse<IEnumerable<LeaderCategory>>(HttpStatusCode.OK, leaderCats);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("pitchleaders")]
        public HttpResponseMessage GetPitchLeaders(long accountId, long leagueSeasonId)
        {
            var queryValues = Request.RequestUri.ParseQueryString();

            bool allTimeLeaders = false;
            String strAllTimeLeaders = queryValues["allTimeLeaders"];

            if (!String.IsNullOrEmpty(strAllTimeLeaders))
            {
                bool.TryParse(strAllTimeLeaders, out allTimeLeaders);
            }

            int minIP = -1;
            String strMinIP = queryValues["calcMinIP"];

            if (!String.IsNullOrEmpty(strMinIP))
            {
                if (allTimeLeaders)
                    minIP = m_allTimeMinIP;
                else
                {
                    var minCalculator = new MinCalculator(Db);
                    minIP = minCalculator.CalculateMinIP(leagueSeasonId);
                }
            }

            int numLeaders = m_numLeaders;
            String strNumLeaders = queryValues["numLeaders"];

            if (!String.IsNullOrEmpty(strNumLeaders))
            {
                Int32.TryParse(strNumLeaders, out numLeaders);
            }

            int divisionId = 0;
            String strDivisionId = queryValues["divisionId"];

            if (!String.IsNullOrEmpty(strDivisionId))
            {
                int.TryParse(strDivisionId, out divisionId);
            }

            String statCategory = queryValues["category"] ?? "ERA";

            var statsHelper = new PitchStatsHelper(Db);
            var leaders = statsHelper.GetPitchLeagueLeaders(leagueSeasonId, divisionId, statCategory, numLeaders, minIP, allTimeLeaders);
            return Request.CreateResponse<IEnumerable<LeagueLeaderStatViewModel>>(HttpStatusCode.OK, leaders);
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
                var minCalculator = new MinCalculator(Db);
                minAB = minCalculator.CalculateTeamMinAB(teamSeasonId);
            }

            int numLeaders = m_numLeaders;
            String strNumLeaders = queryValues["numLeaders"];

            if (!String.IsNullOrEmpty(strNumLeaders))
            {
                Int32.TryParse(strNumLeaders, out numLeaders);
            }

            String statCategory = queryValues["category"] ?? "AVG";
            var statsHelper = new BatStatsHelper(Db);
            var leaders = statsHelper.GetBatTeamLeaders(teamSeasonId, statCategory, numLeaders, minAB);
            return Request.CreateResponse<IEnumerable<LeagueLeaderStatViewModel>>(HttpStatusCode.OK, leaders);
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
                var minCalculator = new MinCalculator(Db);
                minIP = minCalculator.CalculateTeamMinIP(teamSeasonId);
            }

            int numLeaders = m_numLeaders;
            String strNumLeaders = queryValues["numLeaders"];

            if (!String.IsNullOrEmpty(strNumLeaders))
            {
                Int32.TryParse(strNumLeaders, out numLeaders);
            }

            String statCategory = queryValues["category"] ?? "ERA";
            var statsHelper = new PitchStatsHelper(Db);
            var leaders = statsHelper.GetPitchTeamLeaders(teamSeasonId, statCategory, numLeaders, minIP);
            return Request.CreateResponse<IEnumerable<LeagueLeaderStatViewModel>>(HttpStatusCode.OK, leaders);
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

            IQueryable<PitchStatsViewModel> stats;

            var statsHelper = new PitchStatsHelper(Db);
            if (divisionId == 0)
                stats = statsHelper.GetPitchLeaguePlayerTotals(id, sortField, sortOrder, allTime).Skip(pageSize * pageNo).Take(pageSize);
            else
                stats = statsHelper.GetPitchLeaguePlayerTotals(id, divisionId, sortField, sortOrder).Skip(pageSize * pageNo).Take(pageSize);

            return Request.CreateResponse<IEnumerable<PitchStatsViewModel>>(HttpStatusCode.OK, stats);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("historicalleagues")]
        public HttpResponseMessage GetHistoricalLeagues(long accountId)
        {
            var leagues = Db.Leagues.Where(l => l.AccountId == accountId);

            var vm = Mapper.Map<IEnumerable<LeagueDefinition>, LeagueViewModel[]>(leagues);
            return Request.CreateResponse<LeagueViewModel[]>(HttpStatusCode.OK, vm);
        }

        class TeamStandingGamesBack : TeamStandingViewModel
        {
            public TeamStandingGamesBack()
            {

            }

            public TeamStandingGamesBack(TeamStandingViewModel copyFrom)
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
            BuildStandingsHelper standingsHelper = new BuildStandingsHelper(Db);

            var standings = new List<LeagueStanding>();

            var leagues = standingsHelper.Leagues(id);
            foreach(var league in leagues)
            {
                var ls = new LeagueStanding()
                    {
                        Name = league.League.Name,
                        Divisions = new List<DivisionStanding>()
                    };

                standings.Add(ls);

                foreach(var division in standingsHelper.GetDivisions(league.Id))
                {
                    var d = new DivisionStanding()
                    {
                        Name = division.DivisionDef.Name,
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

        private HttpResponseMessage AddLeaderCategories(long accountId, long teamId, bool isBatLeader, IEnumerable<LeaderCategory> cat)
        {
            // remove old ones first.
            var remove = (from ll in Db.DisplayLeagueLeaders
                          where ll.AccountId == accountId && ll.TeamId == teamId && ll.IsBatLeader == isBatLeader
                          select ll);
            Db.DisplayLeagueLeaders.RemoveRange(remove);

            if (cat != null)
                foreach (var lc in cat)
                {
                    Db.DisplayLeagueLeaders.Add(new DisplayLeagueLeader()
                    {
                        FieldName = lc.Name,
                        AccountId = accountId,
                        TeamId = teamId,
                        IsBatLeader = isBatLeader
                    });
                }

            Db.SaveChanges();

            return Request.CreateResponse(HttpStatusCode.OK);
        }
        private IQueryable<LeaderCategory> GetLeaderCategories(long accountId, long teamId, bool isBatLeader)
        {
            return (from ll in Db.DisplayLeagueLeaders
                    where ll.AccountId == accountId && ll.TeamId == teamId && ll.IsBatLeader == isBatLeader
                    select GetLeaderCategoryFromName(ll.FieldName, isBatLeader));
        }

        private LeaderCategory GetLeaderCategoryFromName(string name, bool isBatLeader)
        {
            if (isBatLeader)
            {
                foreach (var lc in BatStatsHelper.AvailableBatCategories())
                {
                    if (lc.Name == name)
                        return lc;
                }
            }
            else
            {
                foreach (var lc in PitchStatsHelper.AvailablePitchCategories())
                {
                    if (lc.Name == name)
                        return lc;
                }
            }

            return null;
        }

    }
}
