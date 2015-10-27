using System.Web.Mvc;
using ModelObjects;

namespace SportsManager.Controllers
{
    public class DiscussionsController : DBController
    {
        public DiscussionsController(DB db) : base(db)
        {
        }

        //
        // GET: /Baseball/Discussions/

        public ActionResult Index(long accountId)
        {
            return View(new SportsManager.ViewModels.DiscussionsViewModel(this, accountId));
        }

    }
}
