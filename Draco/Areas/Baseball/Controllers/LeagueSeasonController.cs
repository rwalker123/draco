using ModelObjects;
using SportsManager.Baseball.ViewModels.Controllers;
using SportsManager.Controllers;
using System.Web.Mvc;

namespace SportsManager.Baseball.Controllers
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
