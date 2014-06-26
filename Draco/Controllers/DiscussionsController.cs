using System.Web.Mvc;

namespace SportsManager.Controllers
{
    public class DiscussionsController : Controller
    {
        //
        // GET: /Baseball/Discussions/

        public ActionResult Index(long accountId)
        {
            return View(new SportsManager.ViewModels.DiscussionsViewModel(this, accountId));
        }

    }
}
