using ModelObjects;
using SportsManager.Baseball.ViewModels.Controllers;
using SportsManager.Controllers;
using System.Web.Mvc;

namespace SportsManager.Baseball.Controllers
{
    public class PlayerClassifiedController : DBController
    {
        public PlayerClassifiedController(DB db) : base(db)
        {
        }

        // GET: Baseball/PlayerClassified
        public ActionResult Index(long accountId)
        {
            return View(new PlayerClassifiedViewModel(this, accountId));
        }
    }
}