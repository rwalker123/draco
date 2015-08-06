using ModelObjects;
using System.Web.Mvc;

namespace SportsManager.Controllers
{
    public class PlayerSurveyController : DBController
    {
        public PlayerSurveyController(DB db) : base(db)
        {

        }

        //
        // GET: /PlayerSurvey/

        public ActionResult Index(long accountId)
        {
            return View(new SportsManager.ViewModels.PlayerSurveyViewModel(this, accountId));
        }
    }
}