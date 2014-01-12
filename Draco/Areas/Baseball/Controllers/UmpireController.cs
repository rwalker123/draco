using System.Web.Mvc;
using SportsManager.Models;
using SportsManager.ViewModels;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class UmpireController : Controller
    {
        //
        // GET: /Baseball/Umpire/

        [SportsManagerAuthorize(Roles="AccountAdmin")]
        public ActionResult Index(long accountId)
        {
            return View("Umpires", new AccountViewModel(this, accountId));
        }

    }
}
