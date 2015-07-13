using ModelObjects;
using SportsManager.ViewModels;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.Controllers
{
    [HandleError]
    public class HomeController : Controller
    {
        DB m_db;
        HomeController(DB db)
        {
            m_db = db;
        }

        public ActionResult Index()
        {
            return View();
        }

        public ActionResult About()
        {
            ViewBag.Message = "Your application description page.";

            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }

        [ChildActionOnly]
        public ActionResult AdminLinks(long accountId)
        {
            long seasonId = (from cs in m_db.CurrentSeasons
                             where cs.AccountId == accountId
                             select cs.SeasonId).SingleOrDefault();

            return PartialView(new RolesViewModel(accountId, seasonId));
        }
    }
}