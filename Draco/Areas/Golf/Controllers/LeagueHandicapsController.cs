using System.Web.Mvc;
using SportsManager.Golf.ViewModels;

namespace SportsManager.Areas.Golf.Controllers
{
	public class LeagueHandicapsController : Controller
	{
		//
		// GET: /Golf/LeagueHandicaps/

		public ActionResult Index(long accountId, long seasonId, long id)
		{
			ViewData["SeasonId"] = seasonId;
			ViewData["FlightId"] = id;

			return View(new LeagueHandicapViewModel(this, accountId, id));
		}

	}
}
