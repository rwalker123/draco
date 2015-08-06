using SportsManager.ViewModels;
using System.Web.Mvc;
using ModelObjects;

namespace SportsManager.Controllers
{
    public class SeasonController : DBController
    {
        protected SeasonController(DB db) : base(db)
        {
        }

        //
        // GET: /Season/
        public ActionResult Index(long accountId)
        {
            if (accountId <= 0)
            {
                return RedirectToAction("Home");                
            }

            return View(new LeagueSeasonsViewModel(this, accountId));
        }

    }
}
