using ModelObjects;
using SportsManager.Baseball.ViewModels;
using SportsManager.Controllers;
using System.Web.Mvc;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class AffiliationsController : DBController
    {
        public AffiliationsController(DB db) : base(db)
        {
        }

        // GET: Baseball/Affiliations
        public ActionResult Index()
        {
            return View(new AffiliationIndexViewModel(this));
        }

        public ActionResult Home(long accountId)
        {
            return View(new AffiliationHomeViewModel(this, accountId));
        }
    }
}