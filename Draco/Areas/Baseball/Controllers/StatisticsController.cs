using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using ModelObjects;
using SportsManager.Baseball.ViewModels;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class StatisticsController : Controller
    {
        //
        // GET: /Baseball/Statistics/

        public ActionResult Index(long? accountId, long? seasonId, long? id, long? divisionId)
        {
            if (accountId.GetValueOrDefault(0) == 0)
                return RedirectToAction("Index", "League");

            long aId = accountId.Value;

            long sId = seasonId.GetValueOrDefault(0);
            if (sId == 0)
                sId = DataAccess.Seasons.GetCurrentSeason(aId);

            long lId = id.GetValueOrDefault(0);
            if (lId == 0)
            {
                League l = DataAccess.Leagues.GetLeagues(sId).FirstOrDefault();
                if (l != null)
                    lId = l.Id;
            }

            long dId = divisionId.GetValueOrDefault(0);

            return View(new SeasonStatisticsViewModel(aId, sId, lId, dId));
        }

        public ActionResult HistoricalSeasonStandings(long accountId, long id)
        {
            return View(new StandingsViewModel(accountId, id));
        }

        public ActionResult PlayerStatsByTeam(long accountId, long seasonId, long id)
        {
            return View(new TeamStatisticsViewModel(accountId, id));
        }

        public ActionResult PlayerSearch(long accountId, string searchTerm)
        {
            return View(new PlayerSearchViewModel(accountId, searchTerm));
        }

        [HttpPost]
        public ActionResult Index(FormCollection collection)
        {
            try
            {
                return View(new SeasonStatisticsViewModel(0, long.Parse(collection["seasonId"]), long.Parse(collection["leagueId"]), long.Parse(collection["divisionId"])));
                //return RedirectToAction("Home", new { accountId = long.Parse(collection["accountId"]) });
            }
            catch
            {
                return View();
            }
        }

        public ActionResult BattingSortableStatistics(long? accountId, long? seasonId, long? id, long? divisionId)
        {
            if (!accountId.HasValue || !seasonId.HasValue || !id.HasValue)
            {
                return RedirectToAction("Index", "League");
            }

            long aId = accountId.Value;
            long sId = seasonId.Value;
            long lId = id.Value;

            return View(new SeasonStatisticsViewModel(aId, sId, lId, 0));
        }

        /// <summary>
        /// Json method to get a paged index worth of data.
        /// </summary>
        [OutputCache(Duration = 0, VaryByParam = "None")]
        public ActionResult BattingStatisticsGridData(long accountId, long seasonId, long id,
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
            return Json(jsonData, JsonRequestBehavior.AllowGet);
        }

        public ActionResult PitchingSortableStatistics(long? accountId, long? seasonId, long? id, long? divisionId)
        {
            if (!accountId.HasValue || !seasonId.HasValue || !id.HasValue)
            {
                return RedirectToAction("Index", "League");
            }

            long aId = accountId.Value;
            long sId = seasonId.Value;
            long lId = id.Value;

            return View(new SeasonStatisticsViewModel(aId, sId, lId, 0));
        }

        /// <summary>
        /// Json method to get a paged index worth of data.
        /// </summary>
        [OutputCache(Duration = 0, VaryByParam = "None")]
        public ActionResult PitchingStatisticsGridData(long accountId, long seasonId, long id,
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
            return Json(jsonData, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Json method to get player data.
        /// </summary>
        [OutputCache(Duration = 0, VaryByParam = "None")]
        public ActionResult PlayerBatStatisticsGridData(long accountId, long seasonId, long id)
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
            return Json(jsonData, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Json method to get player data.
        /// </summary>
        [OutputCache(Duration = 0, VaryByParam = "None")]
        public ActionResult PlayerPitchStatisticsGridData(long accountId, long seasonId, long id)
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
            return Json(jsonData, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// </summary>
        [OutputCache(Duration = 0, VaryByParam = "None")]
        public ActionResult TeamPitchingStatisticsGridData(long accountId, long seasonId, long id,
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
            return Json(jsonData, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// </summary>
        [OutputCache(Duration = 0, VaryByParam = "None")]
        public ActionResult TeamBattingStatisticsGridData(long accountId, long seasonId, long id,
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
            return Json(jsonData, JsonRequestBehavior.AllowGet);
        }


        [OutputCache(Duration = 0, VaryByParam = "None")]
        public ActionResult GetLeagues(long? accountId, long? id)
        {
            if (Request.IsAjaxRequest())
            {
                IEnumerable<League> leagues;

                if (id.HasValue)
                    leagues = DataAccess.Leagues.GetLeaguesFromSeason(id.Value, false);
                else
                    leagues = new List<League>();

                return Json(leagues, JsonRequestBehavior.AllowGet);
            }

            return View();
        }

        [OutputCache(Duration = 0, VaryByParam = "None")]
        public ActionResult GetHistoricalLeagues(long? accountId, long? id)
        {
            if (Request.IsAjaxRequest())
            {
                IEnumerable<League> leagues;

                if (accountId.HasValue)
                    leagues = DataAccess.Leagues.GetLeaguesFromSeason(accountId.Value, true);
                else
                    leagues = new List<League>();

                return Json(leagues, JsonRequestBehavior.AllowGet);
            }

            return View();
        }

        [OutputCache(Duration = 0, VaryByParam = "None")]
        public ActionResult GetDivisions(long? accountId, long? id)
        {
            if (Request.IsAjaxRequest())
            {
                if (id.HasValue)
                {
                    var divisions = DataAccess.Divisions.GetDivisions(id.Value);
                    return Json(divisions, JsonRequestBehavior.AllowGet);
                }
                else
                {
                    return Json(String.Empty);
                }
            }

            return View();
        }
    }
}
