using System.Web.Mvc;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class DiscussionsController : Controller
    {
        //
        // GET: /Baseball/Discussions/

        public ActionResult Index(long? accountId)
        {
            if (accountId.GetValueOrDefault(0) == 0)
            {
                return RedirectToAction("Index", "League");
            }

            return View(new SportsManager.ViewModels.DiscussionsViewModel(this, accountId.Value));
        }

    }
}
