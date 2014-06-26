using System.Web.Mvc;

namespace SportsManager.Controllers
{
    public class PlayerSurveyController : Controller
    {
        //
        // GET: /PlayerSurvey/

        public ActionResult Index(long accountId)
        {
            return View(new SportsManager.ViewModels.PlayerSurveyViewModel(this, accountId));
        }
    }
}