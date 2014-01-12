using System.Collections.Generic;
using System.Web.Mvc;
using ModelObjects;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class TeamController : Controller
    {
        //
        // GET: /Baseball/Team/
        // accountId = accountId or teamId
        // id = NULL if not part of league, <> NULL TeamSeasonId for account.
        public ActionResult Index(long? accountId, long? id)
        {
            long aId = accountId.GetValueOrDefault(0);
            long teamSeasonId = id.GetValueOrDefault(0);
            if (accountId == 0 || teamSeasonId == 0)
            {
                return RedirectToAction("Index", "Baseball");
            }

            return View(new SportsManager.Baseball.ViewModels.TeamViewModel(aId, teamSeasonId));
        }

        [HttpPost]
        public ActionResult CreateAnnouncement(ModelObjects.LeagueNewsItem a)
        {
            if (!ModelState.IsValid)
            {
                return View("CreateAnnouncement", a);
            }

            // people.Add(p);

            return RedirectToAction("Index");
        }

    }
}
