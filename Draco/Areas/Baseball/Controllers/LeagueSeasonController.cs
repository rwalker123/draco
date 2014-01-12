using SportsManager.Baseball.ViewModels;
using System.Web.Mvc;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class LeagueSeasonController : Controller
    {
        public ActionResult Index(long accountId)
        {
            return View(new LeagueSeasonIndexViewModel(this, accountId));
        }
    }
}
