using System.Web.Mvc;

namespace SportsManager.Controllers
{
    public class HallOfFameController : Controller
    {
        // GET: HallOfFame
        public ActionResult Index(long? accountId)
        {
            if (accountId.GetValueOrDefault(0) == 0)
            {
                return RedirectToAction("Index", "League");
            }

            return View(new SportsManager.ViewModels.HallOfFameViewModel(this, accountId.Value));
        }
    }
}