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
			return View(new FlightsViewModel(this, accountId, id));
		}

		//
		// GET: /Golf/Flights/Create/{accountId}/{id}
		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Create(long accountId, long id)
		{
			ViewData["Title"] = "Create Flight";

            Globals.SetupAccountViewData(accountId, this.ViewData);

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
		public async Task<ActionResult> Create(long accountId, long id, FlightViewModel vm)
		{
			if (ModelState.IsValid)
			{
                var season = await Db.Seasons.FindAsync(id);
                if (season != null)
                {
                    if (season.AccountId == accountId)
                    {
                        var leagueDef = (from ld in Db.Leagues
                                         where ld.AccountId == accountId && ld.Name == vm.Name
                                         select ld).SingleOrDefault();
                        if (leagueDef == null)
                        {
                            leagueDef = new LeagueDefinition()
                            {
                                AccountId = accountId,
                                Name = vm.Name
                            };

                            Db.Leagues.Add(leagueDef);
                        }

                        LeagueSeason newLeague = new LeagueSeason()
                        {
                            League = leagueDef,
                            Season = season
                        };

                        Db.LeagueSeasons.Add(newLeague);
                        Db.SaveChanges();

                        if (newLeague.Id > 0)
                            return RedirectToAction("Index", new { accountId = accountId, id = id });
                    }
                }
			}

			ViewData["Title"] = "Create Flight";

            Globals.SetupAccountViewData(accountId, this.ViewData);
            return View(vm);
		}

        //
        // GET: /Golf/Flights/Edit/{accountId}/{id}
        [HttpGet]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Edit(long accountId, long seasonId, long id)
		{
			ViewData["Title"] = "Edit Flight";

            var season = Db.Seasons.Find(seasonId);
            if (season != null && season.AccountId == accountId)
            {
                var flight = Db.LeagueSeasons.Find(id);
                if (flight != null)
                {
                    var vm = Mapper.Map<LeagueSeason, FlightViewModel>(flight);
                    Globals.SetupAccountViewData(accountId, this.ViewData);
                    return View("Create", vm);
                }
            }

            return RedirectToAction("Index", new { accountId = accountId, id = seasonId });
        }

        //
        // POST: /Golf/Flights/Edit/{accountId}/{id}
        [HttpPost]
		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Edit(long accountId, long seasonId, long id, FlightViewModel vm)
		{
            if (ModelState.IsValid)
            {
                var ls = Db.LeagueSeasons.Find(id);
                if (ls != null && ls.SeasonId == seasonId && ls.Season.AccountId == accountId)
                {
                    ls.League.Name = vm.Name;
                    Db.SaveChanges();

                    return RedirectToAction("Index", new { accountId = accountId, id = seasonId });
                }
            }

			ViewData["Title"] = "Edit Flight";
            Globals.SetupAccountViewData(accountId, this.ViewData);

            return View("Create", vm);
		}

		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Delete(long accountId, long seasonId, long id)
		{
            bool success = false;
            var ls = Db.LeagueSeasons.Find(id); 
            if (ls != null && ls.SeasonId == seasonId && ls.Season.AccountId == accountId)
            {

                if (ls.League.LeagueSeasons.Count == 1)
                    Db.Leagues.Remove(ls.League);

                Db.LeagueSeasons.Remove(ls);
                Db.SaveChanges();
            }

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
