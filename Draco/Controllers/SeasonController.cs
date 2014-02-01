using SportsManager.ViewModels;
using System.Web.Mvc;

namespace SportsManager.Controllers
{
    public class SeasonController : Controller
    {
        //
        // GET: /Season/
        public ActionResult Index(long accountId)
        {
            if (accountId <= 0)
            {
                return RedirectToAction("Home");                
            }

            return View(new LeagueSeasonsViewModel(this, accountId));
        }

    }
}
