using System.Web.Mvc;
using ModelObjects;

namespace SportsManager.Controllers
{
    public class HallOfFameController : DBController
    {
        protected HallOfFameController(DB db) : base(db)
        {
        }

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