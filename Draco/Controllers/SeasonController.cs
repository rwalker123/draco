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
            return View(new LeagueSeasonsViewModel(this, accountId));
        }

    }
}
