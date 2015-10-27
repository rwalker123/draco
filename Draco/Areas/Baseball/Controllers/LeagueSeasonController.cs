using ModelObjects;
using SportsManager.Baseball.ViewModels;
using SportsManager.Controllers;
using System.Web.Mvc;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class LeagueSeasonController : DBController
    {
        public LeagueSeasonController(DB db) : base(db)
        {
        }

        public ActionResult Index(long accountId)
        {
            return View(new LeagueSeasonIndexViewModel(this, accountId));
        }
    }
}
