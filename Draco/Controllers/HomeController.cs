using SportsManager.ViewModels;
using System.Web.Mvc;

namespace SportsManager.Controllers
{
    [HandleError]
    public class HomeController : Controller
    {
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
            long seasonId = DataAccess.Seasons.GetCurrentSeason(accountId);
            return PartialView(new RolesViewModel(accountId, seasonId));
        }
    }
}