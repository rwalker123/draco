using AutoMapper;
using ModelObjects;
using SportsManager.Controllers;
using SportsManager.Golf.ViewModels.Controllers;
using SportsManager.Models;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Mvc;

namespace SportsManager.Golf.Controllers
{
    public class FlightsController : DBController
	{
        public FlightsController(DB db) : base(db)
        {
        }

		//
		// GET: /Golf/Flights/{accountId}
		public ActionResult Index(long accountId, long id)
		{
			var flight = Db.LeagueSeasons.Find(id);
            var vm = Mapper.Map<LeagueSeason, FlightViewModel>(flight);

			return View(vm);
		}

		//
		// GET: /Golf/Flights/Create/{accountId}/{id}
		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Create(long accountId, long id)
		{
			ViewData["Title"] = "Create Flight";

            return View(new FlightViewModel()
            {
                AccountId = accountId,
                SeasonId = id
            });
		}

		//
		// POST: /Golf/Flights/Create/{accountId}/{id}
		[HttpPost]
		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Create(long accountId, long id, FlightViewModel vm)
		{
			if (ModelState.IsValid)
			{
                var account = Db.Accounts.Find(accountId);
				//LeagueSeason newLeague = new LeagueSeason()
    //            { 
				//	AccountId = accountId,
				//	Name = vm.Name
				//};

				//long leagueSeasonId = DataAccess.Leagues.AddLeague(newLeague, id);
				//if (leagueSeasonId > 0)
					return RedirectToAction("Index", new { accountId = accountId, id = id });
			}

			ViewData["Title"] = "Create Flight";

			return View(vm);
		}

        //
        // GET: /Golf/Flights/Edit/{accountId}/{id}
        [HttpGet]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Edit(long accountId, long seasonId, long id)
		{
			ViewData["Title"] = "Edit Flight";

            //ModelObjects.League flight = DataAccess.Leagues.GetLeague(id);
            //if (flight == null)
            //	return RedirectToAction("Index", new { accountId = accountId, id = seasonId });

            //var flightViewModel = new FlightViewModel(accountId, seasonId, id)
            //{
            //	Name = flight.Name
            //};

            var leagueSeason = Db.LeagueSeasons.Find(id);
            var vm = Mapper.Map<LeagueSeason, FlightViewModel>(leagueSeason);
			return View("Create", vm);
		}

		//
		// POST: /Golf/Flights/Edit/{accountId}/{id}
		[HttpPost]
		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Edit(long accountId, long seasonId, long id, FlightViewModel vm)
		{
			if (ModelState.IsValid)
			{
				//ModelObjects.League league = new ModelObjects.League()
				//{
				//	Id = vm.FlightId,
				//	Name = vm.Name,
				//	AccountId = vm.AccountId
				//};

				//bool modifySuccess = DataAccess.Leagues.ModifyLeague(league);
				//if (modifySuccess)
					return RedirectToAction("Index", new { accountId = accountId, id = seasonId });
			}

			ViewData["Title"] = "Edit Flight";

			return View("Create", vm);
		}

		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Delete(long accountId, long seasonId, long id)
		{
            //League l = DataAccess.Leagues.GetLeague(id);
            bool success = true; // await DataAccess.Leagues.RemoveLeague(l.Id);

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
