using System.Linq;
using System.Web.Mvc;
using ModelObjects;
using SportsManager.Golf.ViewModels;
using SportsManager.Models;
using System.Threading.Tasks;

namespace SportsManager.Golf.Controllers
{
	public class FlightsController : DBController
	{
		//
		// GET: /Golf/Flights/{accountId}
		public ActionResult Index(long accountId, long id)
		{
			var flights = DataAccess.Leagues.GetLeagues(id);

			var vm = (from f in flights
					  select new FlightViewModel(accountId, id, f.Id)
					  {
						  Name = f.Name
					  });

			return View(vm);
		}

		//
		// GET: /Golf/Flights/Create/{accountId}/{id}
		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Create(long accountId, long id)
		{
			ViewData["Title"] = "Create Flight";

			return View(new FlightViewModel(accountId, id, 0));
		}

		//
		// POST: /Golf/Flights/Create/{accountId}/{id}
		[HttpPost]
		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Create(long accountId, long id, FormCollection collection)
		{
			FlightViewModel vm = new FlightViewModel(accountId, id, 0);

			if (TryUpdateModel(vm))
			{
				ModelObjects.League newLeague = new ModelObjects.League()
				{
					AccountId = accountId,
					Name = vm.Name
				};

				long leagueSeasonId = DataAccess.Leagues.AddLeague(newLeague, id);
				if (leagueSeasonId > 0)
					return RedirectToAction("Index", new { accountId = accountId, id = id });
			}

			ViewData["Title"] = "Create Flight";

			return View(vm);
		}

		//
		// GET: /Golf/Flights/Edit/{accountId}/{id}
		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Edit(long accountId, long seasonId, long id)
		{
			ViewData["Title"] = "Edit Flight";

			ModelObjects.League flight = DataAccess.Leagues.GetLeague(id);
			if (flight == null)
				return RedirectToAction("Index", new { accountId = accountId, id = seasonId });

			var flightViewModel = new FlightViewModel(accountId, seasonId, id)
			{
				Name = flight.Name
			};

			return View("Create", flightViewModel);
		}

		//
		// POST: /Golf/Flights/Edit/{accountId}/{id}
		[HttpPost]
		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Edit(long accountId, long seasonId, long id, FormCollection collection)
		{
			FlightViewModel vm = new FlightViewModel(accountId, seasonId, id);

			if (TryUpdateModel(vm))
			{
				ModelObjects.League league = new ModelObjects.League()
				{
					Id = vm.FlightId,
					Name = vm.Name,
					AccountId = vm.AccountId
				};

				bool modifySuccess = DataAccess.Leagues.ModifyLeague(league);
				if (modifySuccess)
					return RedirectToAction("Index", new { accountId = accountId, id = seasonId });
			}

			ViewData["Title"] = "Edit Flight";

			return View("Create", vm);
		}

		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public async Task<ActionResult> Delete(long accountId, long seasonId, long id)
		{
			League l = DataAccess.Leagues.GetLeague(id);
			bool success = await DataAccess.Leagues.RemoveLeague(l.Id);

			if (Request.IsAjaxRequest())
			{
				return Json(success);
			}
			else
			{
				return RedirectToAction("Index", new { accountId = accountId, id = seasonId });
			}
		}

	}
}
