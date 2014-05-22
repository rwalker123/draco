using ModelObjects;
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



        /// <summary>
        /// Json method to get a paged index worth of data.
        /// </summary>
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("Batting")]
        public HttpResponseMessage BattingStatisticsGridData(long accountId, long seasonId, long id,
            string sidx, string sord, int page, int rows)
        {
            int totalRecords = 0;
            IEnumerable<GameBatStats> stats = DataAccess.GameStats.GetBatLeaguePlayerTotals(id, sidx, sord, seasonId == 0, out totalRecords);

            int totalPages = (int)Math.Ceiling((float)totalRecords / (float)rows);
            int pageIndex = Convert.ToInt32(page) - 1;
            int pageSize = rows;

            var pagedStats = stats.Skip(pageIndex * pageSize).Take(pageSize);

            var jsonData = new
            {
                total = totalPages,
                page = page,
                records = totalRecords,
                rows = (from s in pagedStats
                        select new
                        {
                            id = s.PlayerId,
                            cell = new Object[] {
                                s.PlayerName, s.AB, s.H, s.R, s.D, s.T, s.HR, s.RBI, s.SO, s.BB, s.HBP, s.SB, s.CS, s.SF, s.SH, s.TB, s.PA, s.OBA, s.SLG, s.OPS, s.AVG
                            }
                        }).ToArray()
            };
            return Request.CreateResponse(HttpStatusCode.NotImplemented);
        }

        /// <summary>
        /// Json method to get a paged index worth of data.
        /// </summary>
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("Pitching")]
        public HttpResponseMessage PitchingStatisticsGridData(long accountId, long seasonId, long id,
            string sidx, string sord, int page, int rows)
        {
            int totalRecords = 0;
            IEnumerable<GamePitchStats> stats = DataAccess.GameStats.GetPitchLeaguePlayerTotals(id, sidx, sord, seasonId == 0, out totalRecords);

            int totalPages = (int)Math.Ceiling((float)totalRecords / (float)rows);
            int pageIndex = Convert.ToInt32(page) - 1;
            int pageSize = rows;

            var pagedStats = stats.Skip(pageIndex * pageSize).Take(pageSize);

            var jsonData = new
            {
                total = totalPages,
                page = page,
                records = totalRecords,
                rows = (from s in pagedStats
                        select new
                        {
                            id = s.PlayerId,
                            cell = new Object[] {
                                s.PlayerName, s.W, s.L, s.S, s.IPDecimal, s.BF, s.H, s.R, s.ER, s.SO, s.BB, s.K9, s.BB9, s.OBA, s.SLG, s.WHIP, s.ERA
                            }
                        }).ToArray()
            };
            return Request.CreateResponse(HttpStatusCode.NotImplemented);
        }

        /// <summary>
        /// Json method to get player data.
        /// </summary>
        public HttpResponseMessage PlayerBatStatisticsGridData(long accountId, long seasonId, long id)
        {
            ICollection<GameCareerBatStats> stats = DataAccess.GameStats.GetBatPlayerCareer(id, seasonId == 0);

            // get the totals
            GameCareerBatStats t = (from s in stats
                                    group s by s.PlayerId into g
                                    select new GameCareerBatStats
                                    (g.Key,
                                        String.Empty,
                                        String.Empty,
                                        String.Empty,
                                        g.Sum(b => b.AB),
                                        g.Sum(b => b.H),
                                        g.Sum(b => b.R),
                                        g.Sum(b => b.D),
                                        g.Sum(b => b.T),
                                        g.Sum(b => b.HR),
                                        g.Sum(b => b.RBI),
                                        g.Sum(b => b.SO),
                                        g.Sum(b => b.BB),
                                        g.Sum(b => b.HBP),
                                        g.Sum(b => b.INTR),
                                        g.Sum(b => b.SF),
                                        g.Sum(b => b.SH),
                                        g.Sum(b => b.SB))).FirstOrDefault();

            if (t == null)
                t = new GameCareerBatStats();

            var jsonData = new
            {
                rows = (from s in stats
                        select new
                        {
                            id = s.TeamId,
                            cell = new Object[] {
                                s.SeasonName, s.LeagueName, s.TeamName, s.AB, s.H, s.R, s.D, s.T, s.HR, s.RBI, s.SO, s.BB, s.HBP, s.SB, s.SF, s.SH, s.TB, s.PA, s.OBA, s.SLG, s.OPS, s.AVG
                            }
                        }).ToArray(),
                userdata = new { Team = "Totals:", AB = t.AB, H = t.H, R = t.R, _2B = t.D, _3B = t.T, HR = t.HR, RBI = t.RBI, SO = t.SO, BB = t.BB, HB = t.HBP, SB = t.SB, SF = t.SF, SH = t.SH, TB = t.TB, PA = t.PA, OBP = t.OBA, SLG = t.SLG, OPS = t.OPS, AVG = t.AVG }
            };
            return Request.CreateResponse(HttpStatusCode.NotImplemented);
        }

        /// <summary>
        /// Json method to get player data.
        /// </summary>
        public HttpResponseMessage PlayerPitchStatisticsGridData(long accountId, long seasonId, long id)
        {
            ICollection<GameCareerPitchStats> stats = DataAccess.GameStats.GetPitchPlayerCareer(id, seasonId == 0);

            // get the totals
            GameCareerPitchStats t = (from s in stats
                                      group s by s.PlayerId into g
                                      select new GameCareerPitchStats
                                      (g.Key,
                                          String.Empty,
                                          String.Empty,
                                          String.Empty,
                                          g.Sum(b => b.IP),
                                          g.Sum(b => b.IP2),
                                          g.Sum(b => b.BF),
                                          g.Sum(b => b.W),
                                          g.Sum(b => b.L),
                                          g.Sum(b => b.S),
                                          g.Sum(b => b.H),
                                          g.Sum(b => b.R),
                                          g.Sum(b => b.ER),
                                          g.Sum(b => b.D),
                                          g.Sum(b => b.T),
                                          g.Sum(b => b.HR),
                                          g.Sum(b => b.SO),
                                          g.Sum(b => b.BB),
                                          g.Sum(b => b.WP),
                                          g.Sum(b => b.HBP),
                                          g.Sum(b => b.BK),
                                          g.Sum(b => b.SC))).FirstOrDefault();

            if (t == null)
                t = new GameCareerPitchStats();

            var jsonData = new
            {
                rows = (from s in stats
                        select new
                        {
                            id = s.TeamId,
                            cell = new Object[] {
                                s.SeasonName, s.LeagueName, s.TeamName, s.W, s.L, s.S, s.IPDecimal, s.BF, s.H, s.R, s.ER, s.SO, s.BB, s.K9, s.BB9, s.OBA, s.SLG, s.WHIP, s.ERA
                            }
                        }).ToArray(),
                userdata = new { Team = "Totals:", W = t.W, L = t.L, S = t.S, IP = t.IPDecimal, BF = t.BF, H = t.H, R = t.R, ER = t.ER, SO = t.SO, BB = t.BB, K9 = t.K9, BB9 = t.BB9, OBA = t.OBA, SLG = t.SLG, WHIP = t.WHIP, ERA = t.ERA }
            };
            return Request.CreateResponse(HttpStatusCode.NotImplemented);
        }

        /// <summary>
        /// </summary>
        public HttpResponseMessage TeamPitchingStatisticsGridData(long accountId, long seasonId, long id,
            string sidx, string sord, int page, int rows)
        {
            IEnumerable<GamePitchStats> stats;
            if (id != 0)
                stats = DataAccess.GameStats.GetPitchTeamPlayerTotals(id, sidx, sord, seasonId == 0);
            else
                stats = new List<GamePitchStats>();

            // get the totals
            // get the totals
            GamePitchStats t = (from s in stats
                                group s by s.TeamId into g
                                select new GamePitchStats
                                (0, 0, 0, g.Key,
                                    g.Sum(b => b.IP),
                                    g.Sum(b => b.IP2),
                                    g.Sum(b => b.BF),
                                    g.Sum(b => b.W),
                                    g.Sum(b => b.L),
                                    g.Sum(b => b.S),
                                    g.Sum(b => b.H),
                                    g.Sum(b => b.R),
                                    g.Sum(b => b.ER),
                                    g.Sum(b => b.D),
                                    g.Sum(b => b.T),
                                    g.Sum(b => b.HR),
                                    g.Sum(b => b.SO),
                                    g.Sum(b => b.BB),
                                    g.Sum(b => b.WP),
                                    g.Sum(b => b.HBP),
                                    g.Sum(b => b.BK),
                                    g.Sum(b => b.SC))).FirstOrDefault();

            if (t == null)
                t = new GamePitchStats();

            var jsonData = new
            {
                rows = (from s in stats
                        select new
                        {
                            id = s.TeamId,
                            cell = new Object[] {
                                s.PlayerName, s.W, s.L, s.S, s.IPDecimal, s.BF, s.H, s.R, s.ER, s.D, s.T, s.HR, s.SO, s.BB, s.HBP, s.K9, s.BB9, s.OBA, s.SLG, s.WHIP, s.ERA
                            }
                        }).ToArray(),
                userdata = new { W = t.W, L = t.L, S = t.S, IPDecimal = t.IPDecimal, BF = t.BF, H = t.H, R = t.R, ER = t.ER, _2B = t.D, _3B = t.T, HR = t.HR, SO = t.SO, BB = t.BB, HBP = t.HBP, K9 = t.K9, BB9 = t.BB9, OBA = t.OBA, SLG = t.SLG, WHIP = t.WHIP, ERA = t.ERA }
            };
            return Request.CreateResponse(HttpStatusCode.NotImplemented);
        }

        /// <summary>
        /// </summary>
        public HttpResponseMessage TeamBattingStatisticsGridData(long accountId, long seasonId, long id,
            string sidx, string sord, int page, int rows)
        {
            IEnumerable<GameBatStats> stats;
            if (id != 0)
                stats = DataAccess.GameStats.GetBatTeamPlayerTotals(id, sidx, sord, seasonId == 0);
            else
                stats = new List<GameBatStats>();

            // get the totals
            GameBatStats t = (from s in stats
                              group s by s.TeamId into g
                              select new GameBatStats
                              (0, 0, 0, g.Key,
                                  g.Sum(b => b.AB),
                                  g.Sum(b => b.H),
                                  g.Sum(b => b.R),
                                  g.Sum(b => b.D),
                                  g.Sum(b => b.T),
                                  g.Sum(b => b.HR),
                                  g.Sum(b => b.RBI),
                                  g.Sum(b => b.SO),
                                  g.Sum(b => b.BB),
                                  g.Sum(b => b.RE),
                                  g.Sum(b => b.HBP),
                                  g.Sum(b => b.INTR),
                                  g.Sum(b => b.SF),
                                  g.Sum(b => b.SH),
                                  g.Sum(b => b.SB),
                                  g.Sum(b => b.CS),
                                  g.Sum(b => b.LOB))).FirstOrDefault();

            if (t == null)
                t = new GameBatStats();

            var jsonData = new
            {
                rows = (from s in stats
                        select new
                        {
                            id = s.PlayerId,
                            cell = new Object[] {
                                s.PlayerName, s.AB, s.H, s.R, s.D, s.T, s.HR, s.RBI, s.SO, s.BB, s.HBP, s.SB, s.CS, s.SF, s.SH, s.TB, s.PA, s.OBA, s.SLG, s.OPS, s.AVG
                            }
                        }).ToArray(),
                userdata = new { AB = t.AB, H = t.H, R = t.R, _2B = t.D, _3B = t.T, HR = t.HR, RBI = t.RBI, SO = t.SO, BB = t.BB, HB = t.HBP, SB = t.SB, CS = t.CS, SF = t.SF, SH = t.SH, TB = t.TB, PA = t.PA, OBP = t.OBA, SLG = t.SLG, OPS = t.OPS, AVG = t.AVG }
            };
            return Request.CreateResponse(HttpStatusCode.NotImplemented);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("historicalleagues")]
        public HttpResponseMessage GetHistoricalLeagues(long accountId)
        {
            var leagues = DataAccess.Leagues.GetLeaguesFromSeason(accountId, true);
            return Request.CreateResponse<IQueryable<ModelObjects.League>>(HttpStatusCode.OK, leagues);
        }
    }
}
