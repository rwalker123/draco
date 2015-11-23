using ModelObjects;
using SportsManager.Controllers;
using SportsManager.Golf.ViewModels.Controllers;
using System.Web.Mvc;

namespace SportsManager.Golf.Controllers
{
    public class LeagueHandicapsController : DBController
	{
        public LeagueHandicapsController(DB db) : base(db)
        {

        }
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
