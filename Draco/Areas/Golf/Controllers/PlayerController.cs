using System.Web.Mvc;
using SportsManager.Golf.ViewModels;

namespace SportsManager.Areas.Golf.Controllers
{
    public class PlayerController : Controller
    {
        //
        // GET: /Golf/Player/

        public ActionResult Index(long accountId, long seasonId, long id)
        {
            ViewData["SeasonId"] = seasonId;

            PlayerViewModel vm = new PlayerViewModel(DataAccess.Golf.GolfRosters.GetRosterPlayer(id));

            vm.GetPlayerScoresForHandicap();

            return View(vm);
        }

        public ActionResult PlayerAllScores(long accountId, long seasonId, long id)
        {
            ViewData["SeasonId"] = seasonId;

            PlayerViewModel vm = new PlayerViewModel(DataAccess.Golf.GolfRosters.GetRosterPlayer(id));
            vm.GetAllPlayerScores();

            return View(vm);
        }
    }
}
