using ModelObjects;
using SportsManager.Controllers;
using SportsManager.Models;
using SportsManager.ViewModels;
using System.Web.Mvc;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class UmpireController : DBController
    {
        public UmpireController(DB db) : base(db)
        {

        }

        //
        // GET: /Baseball/Umpire/

        [SportsManagerAuthorize(Roles="AccountAdmin")]
        public ActionResult Index(long accountId)
        {
            return View("Umpires", new AccountViewModel(this, accountId));
        }

    }
}
