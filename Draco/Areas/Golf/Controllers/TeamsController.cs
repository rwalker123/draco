using AutoMapper;
using ModelObjects;
using SportsManager.Controllers;
using SportsManager.Golf.ViewModels.Controllers;
using SportsManager.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Mvc;

namespace SportsManager.Golf.Controllers
{
    public class TeamsController : DBController
    {
        public TeamsController(DB db) : base(db)
        {

        }
        //
        // GET: /Golf/Teams/Index
        public ActionResult Index(long accountId, long seasonId, long id)
        {
            var leagues = Db.LeagueSeasons.Where(ls => ls.SeasonId == seasonId);
            ViewData["Leagues"] = new SelectList(leagues, "Id", "Name", id);

            return View();
        }

        public ActionResult ShowTeam(long accountId, long seasonId, long id)
        {
            var teamSeason = Db.TeamsSeasons.Find(id);
            if (teamSeason != null)
            {
                TeamViewModel vm = new TeamViewModel(accountId, seasonId, teamSeason);
                vm.FillTeamMembers(Db);
                vm.FillScheduleData(this);

                ViewData["FlightId"] = vm.LeagueSeasonId;

                ViewBag.IsMobile = MobileHelpers.IsMobileDevice(Request);

                return View(vm);
            }
            return RedirectToAction("Index", new { accountId = accountId, seasonId = seasonId, id = id });
        }

        [OutputCache(Duration = 0, VaryByParam = "None")]
        public ActionResult GetTeamsGrid(long accountId, long seasonId, long id)
        {
            var teams = Db.TeamsSeasons.Where(ts => ts.LeagueSeasonId == id);

            // convert to TeamViewModel
            var tvm = Mapper.Map<IQueryable<TeamSeason>, IEnumerable<TeamViewModel>>(teams); 

            return PartialView("TeamsGrid", tvm);
        }

        [OutputCache(Duration = 0, VaryByParam = "None")]
        public JsonResult GetTeams(long accountId, long seasonId, long id)
        {
            var teams = Db.TeamsSeasons.Where(ts => ts.LeagueSeasonId == id);

            // convert to TeamViewModel
            var tvm = Mapper.Map<IQueryable<TeamSeason>, IEnumerable<TeamViewModel>>(teams);

            return Json(tvm, JsonRequestBehavior.AllowGet);
        }

        //
        //
        // GET: /Golf/Teams/{lid}/Create
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public ActionResult Create(long accountId, long seasonId, long id)
        {
            // id should be leagueSeasonId
            ViewData["Title"] = "Create Team";
            return View(new TeamViewModel(accountId, seasonId, id));
        }

        //
        // POST: /Golf/Teams/{lid}/Create

        [HttpPost]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public ActionResult Create(long accountId, long seasonId, long id, FormCollection collection)
        {
            TeamViewModel vm = new TeamViewModel(accountId, seasonId, id);

            if (TryUpdateModel(vm))
            {
                Team nt = new Team()
                {
                    AccountId = accountId,
                    YouTubeUserId = string.Empty
                };

                TeamSeason newTeam = new TeamSeason()
                {
                    LeagueSeasonId = id,
                    DivisionSeasonId = 0,
                    Name = vm.Name,
                    Team = nt
                };

                Db.TeamsSeasons.Add(newTeam);
                Db.SaveChanges();

                if (newTeam.Id > 0)
                    return RedirectToAction("Index", new { accountId = accountId, seasonId = seasonId, id = id });
            }

            ViewData["Title"] = "Create Team";
            return View(vm);
        }

        //
        // GET: /Golf/Teams/Edit/5
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public ActionResult Edit(int accountId, long seasonId, long id)
        {
            var t = Db.TeamsSeasons.Find(id);
            var tvm = Mapper.Map<TeamSeason, TeamViewModel>(t);

            ViewData["Title"] = "Edit Team";

            return View("Create", tvm);
        }

        //
        // POST: /Golf/Teams/Edit/5

        [HttpPost]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public ActionResult Edit(long accountId, long seasonId, long id, FormCollection collection)
        {
            var teamSeason = Db.TeamsSeasons.Find(id);
            TeamViewModel vm = new TeamViewModel(accountId, seasonId, teamSeason);

            if (TryUpdateModel(vm))
            {
                teamSeason.Name = vm.Name;
                Db.SaveChanges();

                return RedirectToAction("Index", new { accountId = accountId, seasonId = seasonId, id = id });
            }

            ViewData["Title"] = "Edit Team";

            return View("Create", vm);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<ActionResult> Delete(long accountId, long seasonId, long id)
        {
            try
            {
                bool success = false;
                TeamSeason ts = Db.TeamsSeasons.Find(id);
                if (ts != null)
                {
                    Db.TeamsSeasons.Remove(ts);
                    await Db.SaveChangesAsync();
                    success = true;
                }

                if (Request.IsAjaxRequest())
                {
                    return Json(success);
                }
                else
                {
                    return RedirectToAction("Index", new { accountId = accountId, seasonId = seasonId, id = id });
                }
            }
            catch
            {
                return View();
            }
        }
    }
}
