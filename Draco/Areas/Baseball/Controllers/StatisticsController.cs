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

            return View(new SeasonStatisticsViewModel(this, aId, sId, lId, dId));
        }

        public ActionResult HistoricalSeasonStandings(long accountId, long id)
        {
            return View(new StandingsViewModel(this, accountId, id));
        }

        public ActionResult PlayerStatsByTeam(long accountId, long seasonId, long id)
        {
            return View(new TeamStatisticsViewModel(this, accountId, id));
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
                return View(new SeasonStatisticsViewModel(this, 0, long.Parse(collection["seasonId"]), long.Parse(collection["leagueId"]), long.Parse(collection["divisionId"])));
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

            return View(new SeasonStatisticsViewModel(this, aId, sId, lId, 0));
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

            return View(new SeasonStatisticsViewModel(this, aId, sId, lId, 0));
        }
    }
}
