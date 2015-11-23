using AutoMapper;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using SportsManager.Models;
using SportsManager.Controllers;
using ModelObjects;
using SportsManager.Golf.ViewModels.Controllers;
using SportsManager.Golf.Models;
using SportsManager.ViewModels.API;

namespace SportsManager.Golf.Controllers
{
	public class RostersController : DBController
	{
        public RostersController(DB db) : base(db)
        {

        }
		//
		// GET: /Golf/Rosters/

		public ActionResult Index(long accountId, long seasonId, long flightId, long id)
		{
			ViewBag.flightId = flightId;
			ViewBag.teamId = id;

            var leagues = Db.LeagueSeasons.Where(ls => ls.SeasonId == seasonId);
			ViewData["Leagues"] = new SelectList(leagues, "Id", "Name", flightId);

			return View();
		}

		[OutputCache(Duration = 0, VaryByParam = "None")]
		public ActionResult SubsIndex(long accountId, long seasonId, long id)
		{
			ViewBag.teamId = id;

			// subs list "Roster" is just like normal roster except team id is 0.
			var players = this.GetSubs(seasonId);
            var tvm = Mapper.Map<IQueryable<GolfRoster>, IEnumerable<PlayerViewModel>>(players);

			return View(tvm);
		}

		[OutputCache(Duration = 0, VaryByParam = "None")]
        [HttpGet]
		public ActionResult AvailableSubs(long accountId, long id /* seasonId */)
		{
			var players = this.GetSubs(id);

            var vm = Mapper.Map<IQueryable<GolfRoster>, IEnumerable<ContactNameViewModel>>(players);

			return Json(vm, JsonRequestBehavior.AllowGet);
		}

		[OutputCache(Duration = 0, VaryByParam = "None")]
		public ActionResult GetRosterGrid(long accountId, long seasonId, long flightId, long id)
		{
			ViewData["FlightId"] = flightId;

            var players = Db.GolfRosters.Where(gr => gr.TeamSeasonId == id && gr.IsActive);
            var tvm = Mapper.Map<IQueryable<GolfRoster>, IEnumerable<PlayerViewModel>>(players);

			return PartialView("RostersGrid", tvm);
		}

		// GET: /Golf/Teams/{lid}/Create
		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		[OutputCache(Duration = 0, VaryByParam = "None")]
		public ActionResult SignPlayer(long accountId, long seasonId, long flightId, long id)
		{
			ViewBag.FlightId = flightId;
			ViewBag.TeamId = id;

			IQueryable<Contact> players;
			if (id == 0)
				players = this.GetAvailableSubs(accountId, seasonId);
			else
				players = this.GetAvailableGolfers(accountId, flightId);

            var playerData = Mapper.Map<IQueryable<Contact>, IEnumerable<ContactNameViewModel>>(players);

			if (!playerData.Any())
			{
				// team id of 0 means a sub.
				if (id == 0)
					return RedirectToAction("SubsIndex", new { accountId = accountId, seasonId = seasonId, id = id });
				else
					return RedirectToAction("Index", new { accountId = accountId, seasonId = seasonId, flightId = flightId, id = id });
			}

			ViewData["Players"] = new SelectList(playerData, "Id", "Name");
            ViewData["TeamName"] = Db.TeamsSeasons.Find(id)?.Name;

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
				bool success = SignPlayer(seasonId, id, contactId);
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
			IQueryable<Contact> players;
			if (id == 0)
				players = this.GetAvailableSubs(accountId, seasonId);
			else
				players = this.GetAvailableGolfers(accountId, flightId);

            var playerData = Mapper.Map<IQueryable<Contact>, IEnumerable<ContactNameViewModel>>(players);

			ViewData["Players"] = new SelectList(playerData, "Id", "Name");
            ViewData["TeamName"] = Db.TeamsSeasons.Find(id)?.Name;

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
            return View(new PlayerViewModel(this.Db, id));
		}

		//
		// POST: /Golf/Teams/{lid}/Create
		[HttpPost]
		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Create(long accountId, long seasonId, long flightId, long id, PlayerViewModel vm)
		{
			ViewBag.FlightId = flightId;
			ViewBag.TeamId = id;

			if (TryUpdateModel(vm))
			{
				var newRosterPlayer = new GolfRoster()
				{
					Contact = new Contact()
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

                Db.GolfRosters.Add(newRosterPlayer);
				// team id of 0 means a sub.
				if (id == 0)
					return RedirectToAction("SubsIndex", new { accountId = accountId, seasonId = seasonId, id = id });
				else
					return RedirectToAction("Index", new { accountId = accountId, seasonId = seasonId, flightId = flightId, id = id });
			}

			ViewData["Title"] = "Create Player";

			return View(vm);
		}

		//
		// GET: /Golf/Teams/Edit/5
		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Edit(long accountId, long seasonId, long flightId, long teamId, long id)
		{
            var playerRoster = Db.GolfRosters.Find(id);

            PlayerViewModel tvm = Mapper.Map<GolfRoster, PlayerViewModel>(playerRoster);
			ViewData["Title"] = "Edit Player";

			return View("Create", tvm);
		}

		//
		// POST: /Golf/Teams/Edit/5

		[HttpPost]
		[SportsManagerAuthorize(Roles = "AccountAdmin")]
		public ActionResult Edit(long accountId, long seasonId, long flightId, long teamId, long id, PlayerViewModel vm)
		{
			if (TryUpdateModel(vm))
			{
                var playerRoster = Db.GolfRosters.Find(id);
                if (playerRoster != null)
                {
                    // update from the viewmodel.
                    playerRoster.Contact.FirstName = vm.FirstName;
                    playerRoster.Contact.LastName = vm.LastName;
                    playerRoster.Contact.MiddleName = vm.MiddleName;
                    playerRoster.Contact.IsFemale = vm.IsFemale;
                    playerRoster.InitialDifferential = vm.InitialDifferential;
                    playerRoster.IsSub = (teamId == 0);
                    playerRoster.SubSeasonId = (teamId == 0) ? seasonId : 0;

                    Db.SaveChanges();
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
			bool success = RemoveRosterPlayer(id, deleteContact, asSub);

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

        private IQueryable<Contact> GetAvailableGolfers(long accountId, long flightId)
        {
            var playersOnTeam = (from ls in Db.LeagueSeasons
                                 join ts in Db.TeamsSeasons on ls.Id equals ts.LeagueSeasonId
                                 join gr in Db.GolfRosters on ts.Id equals gr.TeamSeasonId
                                 where ls.Id == flightId && gr.IsActive == true
                                 select gr.ContactId).Distinct();

            // if you aren't on a team, you can be signed.
            return (from c in Db.Contacts
                    where c.CreatorAccountId == accountId && !playersOnTeam.Contains(c.Id)
                    select c);
        }

        private bool SignPlayer(long seasonId, long teamSeasonId, long contactId)
        {
            // trying to sign a sub.
            if (teamSeasonId == 0)
            {
                GolfRoster subPlayer = (from gr in Db.GolfRosters
                                        where gr.IsSub == true && gr.SubSeasonId == seasonId && gr.ContactId == contactId
                                        select gr).SingleOrDefault();
                if (subPlayer != null)
                {
                    subPlayer.IsActive = true;
                    Db.SaveChanges();
                }
                else
                {
                    subPlayer = new GolfRoster()
                    {
                        ContactId = (int)contactId,
                        TeamSeasonId = teamSeasonId,
                        IsActive = true,
                        IsSub = true,
                        SubSeasonId = seasonId
                    };

                    Db.GolfRosters.Add(subPlayer);
                    Db.SaveChanges();
                }
            }
            else
            {
                // is player already on team but inactive?
                GolfRoster rosterPlayer = (from gr in Db.GolfRosters
                                           where gr.TeamSeasonId == teamSeasonId && gr.ContactId == contactId
                                           select gr).SingleOrDefault();
                if (rosterPlayer != null)
                {
                    rosterPlayer.IsActive = true;
                    Db.SaveChanges();
                }
                else
                {
                    // see if player is listed as a sub. 
                    rosterPlayer = (from gr in Db.GolfRosters
                                    where gr.IsSub == true && gr.SubSeasonId == seasonId && gr.ContactId == contactId
                                    select gr).SingleOrDefault();

                    if (rosterPlayer != null)
                    {
                        rosterPlayer.IsActive = true;
                        rosterPlayer.TeamSeasonId = teamSeasonId;
                        rosterPlayer.IsSub = false;
                        rosterPlayer.SubSeasonId = 0;

                        Db.SaveChanges();
                    }
                    else
                    {
                        rosterPlayer = new GolfRoster()
                        {
                            ContactId = (int)contactId,
                            TeamSeasonId = teamSeasonId,
                            IsActive = true,
                            IsSub = false,
                            SubSeasonId = 0
                        };

                        Db.GolfRosters.Add(rosterPlayer);
                        Db.SaveChanges();
                    }
                }
            }

            return true;
        }

        private bool RemoveRosterPlayer(long rosterPlayerId, bool deleteContact, bool asSub)
        {
            GolfRoster rosterPlayer = (from gr in Db.GolfRosters
                                       where gr.Id == rosterPlayerId
                                       select gr).SingleOrDefault();

            if (rosterPlayer == null)
                return false;

            // put into sub list, don't need to delete anything.
            if (asSub)
            {
                rosterPlayer.TeamSeasonId = 0;
                rosterPlayer.IsActive = true;
                Db.SaveChanges();

                return true;
            }

            long contactId = rosterPlayer.ContactId;

            // can only delete if player doesn't have any scores for the team.
            bool hasAnyScoresForTeam = (from gms in Db.GolfMatchScores
                                        where gms.PlayerId == rosterPlayerId && rosterPlayer.TeamSeasonId == gms.TeamId
                                        select gms).Any();

            if (hasAnyScoresForTeam)
                rosterPlayer.IsActive = false;
            else
                Db.GolfRosters.Remove(rosterPlayer);

            // submit this much, check to see if we can delete contact next.
            Db.SaveChanges();

            // check to see if we can delete the contact, we can if they have no scores and are not on any team.
            if (!hasAnyScoresForTeam && deleteContact)
            {
                bool onAnyTeams = (from gr in Db.GolfRosters
                                   where gr.ContactId == contactId
                                   select gr).Any();

                bool hasAnyScores = (from gs in Db.GolfScores
                                     where gs.ContactId == contactId
                                     select gs).Any();

                if (!onAnyTeams && !hasAnyScores)
                {
                    Contact dbContact = (from c in Db.Contacts
                                         where c.Id == contactId
                                         select c).Single();

                    Db.Contacts.Remove(dbContact);

                    Db.SaveChanges();
                }
            }

            return true;
        }

    }
}
