using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using SportsManager.Golf.ViewModels;
using SportsManager.Model;
using SportsManager.Models;

namespace SportsManager.Golf.Controllers
{
	public class RostersController : DBController
	{
		//
		// GET: /Golf/Rosters/

		public ActionResult Index(long accountId, long seasonId, long flightId, long id)
		{
			ViewBag.flightId = flightId;
			ViewBag.teamId = id;

			IEnumerable<ModelObjects.League> leagues = DataAccess.Leagues.GetLeagues(seasonId);
			ViewData["Leagues"] = new SelectList(leagues, "Id", "Name", flightId);

			return View();
		}

		[OutputCache(Duration = 0, VaryByParam = "None")]
		public ActionResult SubsIndex(long accountId, long seasonId, long id)
		{
			ViewBag.teamId = id;

			// subs list "Roster" is just like normal roster except team id is 0.
			IEnumerable<GolfRoster> players = DataAccess.Golf.GolfRosters.GetSubs(seasonId);

			// convert to TeamViewModel
			IEnumerable<PlayerViewModel> tvm = (from p in players
												select new PlayerViewModel(p));


			return View(tvm);
		}

		[OutputCache(Duration = 0, VaryByParam = "None")]
		public ActionResult GetAvailableSubs(long accountId, long id /* seasonId */)
		{
			var players = DataAccess.Golf.GolfRosters.GetSubs(id);

			// convert to TeamViewModel
			var jsonData = (from p in players
							select new
							{
								value = p.Id,
								name = p.Contact.LastName + ", " + p.Contact.FirstName
							});

			return Json(jsonData, JsonRequestBehavior.AllowGet);
		}

		[OutputCache(Duration = 0, VaryByParam = "None")]
		public ActionResult GetRosterGrid(long accountId, long seasonId, long flightId, long id)
		{
			ViewData["FlightId"] = flightId;

			IEnumerable<GolfRoster> players = DataAccess.Golf.GolfRosters.GetRoster(id);

			// convert to TeamViewModel
			IEnumerable<PlayerViewModel> tvm = (from p in players
												select new PlayerViewModel(p));

			return PartialView("RostersGrid", tvm);
		}

		// GET: /Golf/Teams/{lid}/Create
		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		[OutputCache(Duration = 0, VaryByParam = "None")]
		public ActionResult SignPlayer(long accountId, long seasonId, long flightId, long id)
		{
			ViewBag.FlightId = flightId;
			ViewBag.TeamId = id;

			IEnumerable<Model.Contact> players;
			if (id == 0)
				players = DataAccess.Golf.GolfRosters.GetAvailableSubs(accountId, seasonId);
			else
				players = DataAccess.Golf.GolfRosters.GetAvailableGolfers(accountId, flightId);

			var playerData = (from p in players
							  select new
							  {
								  Id = p.Id,
								  Name = p.LastName + ", " + p.FirstName
							  });

			if (!playerData.Any())
			{
				// team id of 0 means a sub.
				if (id == 0)
					return RedirectToAction("SubsIndex", new { accountId = accountId, seasonId = seasonId, id = id });
				else
					return RedirectToAction("Index", new { accountId = accountId, seasonId = seasonId, flightId = flightId, id = id });
			}

			ViewData["Players"] = new SelectList(playerData, "Id", "Name");
			ViewData["TeamName"] = DataAccess.Teams.GetTeamName(id);

			return View();
		}

		// POST: /Golf/Teams/{lid}/Create
		[HttpPost]
		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult SignPlayer(long accountId, long seasonId, long flightId, long id, FormCollection collection)
		{
			ViewBag.FlightId = flightId;
			ViewBag.TeamId = id;

			long contactId = 0;
			if (long.TryParse(collection["players"], out contactId))
			{
				bool success = DataAccess.Golf.GolfRosters.SignPlayer(seasonId, id, contactId);
				if (success)
				{
					// team id of 0 means a sub.
					if (id == 0)
						return RedirectToAction("SubsIndex", new { accountId = accountId, seasonId = seasonId, id = id });
					else
						return RedirectToAction("Index", new { accountId = accountId, seasonId = seasonId, flightId = flightId, id = id });
				}
			}

			// id == 0, get available subs.
			IEnumerable<Model.Contact> players;
			if (id == 0)
				players = DataAccess.Golf.GolfRosters.GetAvailableSubs(accountId, seasonId);
			else
				players = DataAccess.Golf.GolfRosters.GetAvailableGolfers(accountId, flightId);

			var playerData = (from p in players
							  select new
							  {
								  Id = p.Id,
								  Name = p.LastName + ", " + p.FirstName
							  });

			ViewData["Players"] = new SelectList(playerData, "Id", "Name");
			ViewData["TeamName"] = DataAccess.Teams.GetTeamName(id);

			return View();
		}

		// GET: /Golf/Teams/{lid}/Create
		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Create(long accountId, long seasonId, long flightId, long id)
		{
			ViewBag.FlightId = flightId;
			ViewBag.TeamId = id;

			// id should be leagueSeasonId
			ViewData["Title"] = "Create Player";
			return View(new PlayerViewModel(new GolfRoster() { TeamSeasonId = id }));
		}

		//
		// POST: /Golf/Teams/{lid}/Create
		[HttpPost]
		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Create(long accountId, long seasonId, long flightId, long id, FormCollection collection)
		{
			ViewBag.FlightId = flightId;
			ViewBag.TeamId = id;

			PlayerViewModel vm = new PlayerViewModel(new GolfRoster() { TeamSeasonId = id });

			if (TryUpdateModel(vm))
			{
				SportsManager.Model.GolfRoster newRosterPlayer = new GolfRoster()
				{
					Contact = new Model.Contact()
					{
						CreatorAccountId = accountId,
						LastName = vm.LastName,
						FirstName = vm.FirstName,
						MiddleName = vm.MiddleName,
						IsFemale = vm.IsFemale
					},
					TeamSeasonId = id,
					IsActive = true,
					InitialDifferential = vm.InitialDifferential,
					IsSub = (id == 0),
					SubSeasonId = (id == 0) ? seasonId : 0,
				};

				long rosterId = DataAccess.Golf.GolfRosters.AddRosterPlayer(newRosterPlayer);
				if (rosterId > 0)
				{
					// team id of 0 means a sub.
					if (id == 0)
						return RedirectToAction("SubsIndex", new { accountId = accountId, seasonId = seasonId, id = id });
					else
						return RedirectToAction("Index", new { accountId = accountId, seasonId = seasonId, flightId = flightId, id = id });
				}
			}

			ViewData["Title"] = "Create Player";

			return View(vm);
		}

		//
		// GET: /Golf/Teams/Edit/5
		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Edit(long accountId, long seasonId, long flightId, long teamId, long id)
		{
			Model.GolfRoster playerRoster = DataAccess.Golf.GolfRosters.GetRosterPlayer(id);
			PlayerViewModel tvm = new PlayerViewModel(playerRoster);
			ViewData["Title"] = "Edit Player";

			return View("Create", tvm);
		}

		//
		// POST: /Golf/Teams/Edit/5

		[HttpPost]
		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Edit(long accountId, long seasonId, long flightId, long teamId, long id, FormCollection collection)
		{
			Model.GolfRoster playerRoster = DataAccess.Golf.GolfRosters.GetRosterPlayer(id);
			PlayerViewModel vm = new PlayerViewModel(playerRoster);

			if (TryUpdateModel(vm))
			{
				// update from the viewmodel.
				playerRoster.Contact.FirstName = vm.FirstName;
				playerRoster.Contact.LastName = vm.LastName;
				playerRoster.Contact.MiddleName = vm.MiddleName;
				playerRoster.Contact.IsFemale = vm.IsFemale;
				playerRoster.InitialDifferential = vm.InitialDifferential;
				playerRoster.IsSub = (teamId == 0);
				playerRoster.SubSeasonId = (teamId == 0) ? seasonId : 0;

				bool modifySuccess = DataAccess.Golf.GolfRosters.ModifyRosterPlayer(playerRoster);
				if (modifySuccess)
				{
					// team id of 0 means a sub.
					if (teamId == 0)
						return RedirectToAction("SubsIndex", new { accountId = accountId, seasonId = seasonId, id = teamId });
					else
						return RedirectToAction("Index", new { accountId = accountId, seasonId = seasonId, flightId = flightId, id = id });
				}
			}

			ViewData["Title"] = "Edit Team";

			return View("Create", vm);
		}

		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Delete(long accountId, long seasonId, long flightId, long teamId, long id)
		{
			return DeleteOrRemovePlayer(accountId, seasonId, flightId, teamId, id, true);
		}

		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Release(long accountId, long seasonId, long flightId, long teamId, long id)
		{
			return DeleteOrRemovePlayer(accountId, seasonId, flightId, teamId, id, false);
		}

		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult ReleaseAsSub(long accountId, long seasonId, long flightId, long teamId, long id)
		{
			return DeleteOrRemovePlayer(accountId, seasonId, flightId, teamId, id, false, true);
		}

		private ActionResult DeleteOrRemovePlayer(long accountId, long seasonId, long flightId, long teamId, long id, bool deleteContact, bool asSub = false)
		{
			bool success = DataAccess.Golf.GolfRosters.RemoveRosterPlayer(id, deleteContact, asSub);

			if (Request.IsAjaxRequest())
			{
				return Json(success);
			}
			else
			{
				// team id of 0 means a sub.
				if (teamId == 0)
					return RedirectToAction("SubsIndex", new { accountId = accountId, seasonId = seasonId, id = teamId });
				else
					return RedirectToAction("Index", new { accountId = accountId, seasonId = seasonId, flightId = flightId, id = id });
			}

		}
	}
}
