using SportsManager.Baseball.ViewModels;
using System.Web.Mvc;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class AffiliationsController : Controller
    {
        // GET: Baseball/Affiliations
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult Home(long accountId)
        {
            return View(new AffiliationHomeViewModel(this, accountId));
        }
    }
}