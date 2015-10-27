using ModelObjects;
using SportsManager.ViewModels;
using System.Web.Mvc;

namespace SportsManager.Controllers
{
    public class LeagueFAQController : DBController
    {
        public LeagueFAQController(DB db) : base(db)
        {

        }

        // GET: LeagueFAQ
        public ActionResult Index(long accountId)
        {
            return View(new AccountViewModel(this, accountId));
        }
    }
}