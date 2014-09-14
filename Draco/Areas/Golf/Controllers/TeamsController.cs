using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using ModelObjects;
using SportsManager.Golf.ViewModels;
using SportsManager.Models;
using System.Threading.Tasks;

namespace SportsManager.Areas.Golf.Controllers
{
    public class TeamsController : Controller
    {
        //
        // GET: /Golf/Teams/Index
        public ActionResult Index(long accountId, long seasonId, long id)
        {
            IEnumerable<League> leagues = DataAccess.Leagues.GetLeagues(seasonId);
            ViewData["Leagues"] = new SelectList(leagues, "Id", "Name", id);

            return View();
        }

        public ActionResult ShowTeam(long accountId, long seasonId, long id)
        {
            TeamViewModel vm = new TeamViewModel(accountId, seasonId, DataAccess.Teams.GetTeam(id));
            vm.FillTeamMembers();
            vm.FillScheduleData();

            ViewData["FlightId"] = vm.LeagueSeasonId;

            ViewBag.IsMobile = MobileHelpers.IsMobileDevice(Request);

            return View(vm);
        }

        [OutputCache(Duration = 0, VaryByParam = "None")]
        public ActionResult GetTeamsGrid(long accountId, long seasonId, long id)
        {
            IEnumerable<Team> teams = DataAccess.Teams.GetTeams(id);

            // convert to TeamViewModel
            IEnumerable<TeamViewModel> tvm = (from t in teams
                                              select new TeamViewModel(accountId, seasonId, t));

            return PartialView("TeamsGrid", tvm);
        }

        [OutputCache(Duration = 0, VaryByParam = "None")]
        public JsonResult GetTeams(long accountId, long seasonId, long id)
        {
            IEnumerable<Team> teams = DataAccess.Teams.GetTeams(id);

            // convert to TeamViewModel
            var jsonData = (from t in teams
                            select new
                            {
                                value = t.Id,
                                name = t.Name
                            });

            return Json(jsonData, JsonRequestBehavior.AllowGet);
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
                ModelObjects.Team newTeam = new ModelObjects.Team()
                {
                    AccountId = accountId,
                    LeagueId = id,
                    DivisionId = 0,
                    Name = vm.Name,
                    YouTubeUserId = string.Empty
                };

                long teamSeasonId = DataAccess.Teams.AddTeam(newTeam);
                if (teamSeasonId > 0)
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
            Team t = DataAccess.Teams.GetTeam(id);
            TeamViewModel tvm = new TeamViewModel(accountId, seasonId, t);

            ViewData["Title"] = "Edit Team";

            return View("Create", tvm);
        }

        //
        // POST: /Golf/Teams/Edit/5

        [HttpPost]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public ActionResult Edit(long accountId, long seasonId, long id, FormCollection collection)
        {
            TeamViewModel vm = new TeamViewModel(accountId, seasonId, DataAccess.Teams.GetTeam(id));

            if (TryUpdateModel(vm))
            {
                ModelObjects.Team newTeam = new ModelObjects.Team()
                {
                    Id = vm.TeamSeasonId,
                    DivisionId = 0,
                    Name = vm.Name,
                    YouTubeUserId = string.Empty
                };

                bool modifySuccess = DataAccess.Teams.ModifyTeam(newTeam);
                if (modifySuccess)
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
                Team t = DataAccess.Teams.GetTeam(id);
                bool success = await DataAccess.Teams.RemoveTeam(t);

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
