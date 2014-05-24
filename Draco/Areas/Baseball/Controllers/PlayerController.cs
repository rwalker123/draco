using System.Web.Mvc;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class PlayerController : Controller
    {
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("contact")]
        public ActionResult GetFromContact(long accountId, long id)
        {
            return View("Index", new SportsManager.Baseball.ViewModels.PlayerViewModel(this, accountId, id));
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("season")]
        public ActionResult GetFromSeason(long accountId, long id)
        {
            return View("Index", new SportsManager.Baseball.ViewModels.PlayerViewModel(this, accountId, id, true));
        }
    }
}