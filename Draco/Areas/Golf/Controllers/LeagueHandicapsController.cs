using System.Web.Mvc;
using SportsManager.Golf.ViewModels;

namespace SportsManager.Golf.Controllers
{
	public class LeagueHandicapsController : DBController
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
