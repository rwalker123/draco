using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using SportsManager.Golf.ViewModels;
using SportsManager.Model;
using SportsManager.Models;

namespace SportsManager.Areas.Golf.Controllers
{
    public class ScheduleController : Controller
    {
        //
        // GET: /Golf/Schedule/
        [OutputCache(Duration = 0, VaryByParam = "None")]
        public ActionResult Index(long accountId, long seasonId, long id)
        {
            ViewBag.FlightId = id;

            IEnumerable<ModelObjects.League> leagues = DataAccess.Leagues.GetLeagues(seasonId);
            ViewData["Leagues"] = new SelectList(leagues, "Id", "Name", id);

            return View();
        }

        [OutputCache(Duration = 0, VaryByParam = "None")]
        public ActionResult GetScheduleGrid(long accountId, long seasonId, long id)
        {
            ViewData["FlightId"] = id;

            IEnumerable<GolfMatch> golfMatches = DataAccess.Golf.GolfMatches.GetMatches(id);

            // convert to TeamViewModel
            IEnumerable<GolfMatchViewModel> tvm = (from gm in golfMatches
                                                   select new GolfMatchViewModel(gm));

            return PartialView("ScheduleGrid", tvm);
        }

        //
        // GET: /Golf/Schedule/Create
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public ActionResult Create(long accountId, long seasonId, long id)
        {
            ViewBag.Title = "Create Match";

            ViewBag.FlightId = id;

            ViewData["Courses"] = GetCourseList(accountId);
            ViewData["Teams"] = GetTeamsList(id);
            ViewData["ForCreate"] = true;

            return View(new GolfMatchViewModel(new GolfMatch()));
        }

        //
        // POST: /Golf/Schedule/Create
        [HttpPost]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public ActionResult Create(long accountId, long seasonId, long id, FormCollection collection)
        {
            GolfMatchViewModel vm = new GolfMatchViewModel(0);

            if (TryUpdateModel(vm))
            {
                GolfMatch gm = GolfMatchViewModel.GolfMatchFromViewModel(vm);
                gm.LeagueId = id;
                gm.MatchStatus = 0;
                gm.Comment = String.Empty;

                long matchId = DataAccess.Golf.GolfMatches.AddMatch(gm);
                if (matchId > 0)
                {
                    if (collection["continueWithMore"] != null && collection["continueWithMore"] == "1")
                    {
                        vm.MatchTime = vm.MatchTime.Add(new TimeSpan(0, 6, 0));
                    }
                    else
                    {
                        return RedirectToAction("Index", new { accountId = accountId, seasonId = seasonId, id = id });
                    }
                }
            }

            ViewBag.Title = "Create Match";

            ViewBag.FlightId = id;

            ViewData["Courses"] = GetCourseList(accountId);
            ViewData["Teams"] = GetTeamsList(id);
            ViewData["ForCreate"] = true;

            return View(vm);
        }

        //
        // GET: /Golf/Schedule/Create
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public ActionResult Edit(long accountId, long seasonId, long flightId, long id)
        {
            ViewBag.Title = "Create Match";

            ViewBag.FlightId = flightId;

            GolfMatchViewModel vm = new GolfMatchViewModel(DataAccess.Golf.GolfMatches.GetMatch(id));

            ViewData["Courses"] = GetCourseList(accountId);
            ViewData["Teams"] = GetTeamsList(flightId);
            ViewData["ForCreate"] = false;

            return View("Create", vm);
        }

        //
        // POST: /Golf/Schedule/Create
        [HttpPost]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public ActionResult Edit(long accountId, long seasonId, long flightId, long id, FormCollection collection)
        {
            GolfMatchViewModel vm = new GolfMatchViewModel(id);

            if (TryUpdateModel(vm))
            {
                GolfMatch gm = GolfMatchViewModel.GolfMatchFromViewModel(vm);
                gm.LeagueId = flightId;
                gm.Comment = String.Empty;

                bool updateSuccess = DataAccess.Golf.GolfMatches.UpdateMatch(gm, updateStatus: false);
                if (updateSuccess)
                    return RedirectToAction("Index", new { accountId = accountId, seasonId = seasonId, id = flightId });
            }

            ViewBag.Title = "Create Match";

            ViewBag.FlightId = flightId;

            ViewData["Courses"] = GetCourseList(accountId);
            ViewData["Teams"] = GetTeamsList(flightId);
            ViewData["ForCreate"] = false;

            return View("Create", vm);
        }


        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public ActionResult Delete(long accountId, long seasonId, long flightId, long id)
        {
            bool success = DataAccess.Golf.GolfMatches.RemoveMatch(id);

            if (Request.IsAjaxRequest())
            {
                return Json(success);
            }
            else
            {
                return RedirectToAction("Index", new { accountId = accountId, seasonId = seasonId, id = flightId });
            }
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [OutputCache(Duration = 0, VaryByParam = "None")]
        public ActionResult MatchResults(long accountId, long seasonId, long flightId, long id)
        {
            MatchResultsViewModel vm = new MatchResultsViewModel(id);
            vm.InitializeFromDB();

            BuildCourseList(accountId, vm.CourseId);

            ViewBag.FlightId = flightId;

            return View(vm);
        }

        [HttpPost]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public ActionResult MatchResults(long accountId, long seasonId, long flightId, long id, FormCollection formCollection)
        {
            MatchResultsViewModel vm = new MatchResultsViewModel(id);

            UpdateMatchResultsFromForm(vm, formCollection);

            GolfMatch gm = new GolfMatch()
            {
                Id = vm.MatchId,
                Team1 = vm.Team1Id,
                Team2 = vm.Team2Id,
                LeagueId = flightId,
                MatchDate = vm.MatchDate,
                MatchTime = vm.MatchTime,
                CourseId = vm.CourseId,
                MatchStatus = 1, // 1 = complete.
                MatchType = vm.MatchType,
                Comment = vm.Comment
            };

            Dictionary<long, Dictionary<long, GolfScore>> scoreUpdates = new Dictionary<long, Dictionary<long, GolfScore>>();

            var team1Scores = new Dictionary<long, GolfScore>();
            scoreUpdates[vm.Team1Id] = team1Scores;

            foreach (GolfScoreViewModel golfScoreVM in vm.Team1Scores)
            {
                team1Scores[golfScoreVM.PlayerId] = GolfScoreViewModel.GolfScoreFromViewModel(golfScoreVM);
            }

            var team2Scores = new Dictionary<long, GolfScore>();
            scoreUpdates[vm.Team2Id] = team2Scores;

            foreach (GolfScoreViewModel golfScoreVM in vm.Team2Scores)
            {
                team2Scores[golfScoreVM.PlayerId] = GolfScoreViewModel.GolfScoreFromViewModel(golfScoreVM);
            }

            DataAccess.Golf.GolfMatches.UpdateMatchScores(gm, scoreUpdates);

            DataAccess.Golf.GolfMatches.UpdateMatch(gm);

            return RedirectToAction("Home", "League", new { area = "Golf", accountId = accountId });
        }

        [OutputCache(Duration = 0, VaryByParam = "None")]
        public ActionResult LeagueStandings(long accountId, long seasonId, long id)
        {
            LeagueStandingsViewModel vm = new LeagueStandingsViewModel(accountId, seasonId, id);

            ViewBag.FlightId = id;

            return View(vm);
        }

        [OutputCache(Duration = 0, VaryByParam = "None")]
        public ActionResult MobileRecentMatch(long accountId, long seasonId, long id)
        {
            CompletedMatchViewModel vm = new CompletedMatchViewModel(accountId, seasonId, id);

            ViewBag.FlightId = id;

            return View(vm);
        }

        [OutputCache(Duration = 0, VaryByParam = "None")]
        public ActionResult ShowLeagueMatchResults(long accountId, long seasonId, long flightId, long id)
        {
            GolfMatch match = DataAccess.Golf.GolfMatches.GetMatch(id);
            LeagueMatchResultsViewModel vm = new LeagueMatchResultsViewModel(accountId, flightId, match.MatchDate);

            ViewBag.FlightId = flightId;

            return View(vm);
        }

        [OutputCache(Duration = 0, VaryByParam = "None")]
        public ActionResult ShowMatchResults(long accountId, long seasonId, long flightId, long id)
        {
            MatchResultsViewModel vm = new MatchResultsViewModel(id);
            vm.InitializeMatchResults(accountId);

            ViewBag.FlightId = flightId;

            return View(vm);
        }

        [OutputCache(Duration = 0, VaryByParam = "None")]
        public ActionResult PreviewMatch(long accountId, long seasonId, long flightId, long id)
        {
            PreviewMatchViewModel vm = new PreviewMatchViewModel(id);

            BuildCourseList(accountId, vm.CourseId);

            ViewBag.FlightId = flightId;

            return View(vm);
        }

        [OutputCache(Duration = 0, VaryByParam = "None")]
        public ActionResult CompleteSchedule(long accountId, long seasonId, long id)
        {
            LeagueScheduleViewModel vm = new LeagueScheduleViewModel(accountId, id);

            ViewBag.FlightId = id;

            ViewBag.IsMobile = MobileHelpers.IsMobileDevice(Request);

            return View(vm);
        }

        private void BuildCourseList(long accountId, long selectedCourseId)
        {
            IEnumerable<GolfCourse> courses = DataAccess.Golf.GolfCourses.GetLeagueCourses(accountId);

            var coursesVM = (from c in courses
                             select new GolfCourseViewModel(accountId)
                             {
                                 CourseId = c.Id,
                                 Name = c.Name
                             });

            ViewData["Courses"] = new SelectList(coursesVM, "CourseId", "Name", selectedCourseId);
        }

        private void UpdateMatchResultsFromForm(MatchResultsViewModel vm, FormCollection formCollection)
        {
            const string playerPrefix = "player_";
            const string holeFormat = "hole_{0}_{1}";

            Dictionary<long, long> playerToTeamIds = new Dictionary<long, long>();
            Dictionary<long, long> playerIdToSub = new Dictionary<long, long>();

            long courseId = vm.CourseId;

            // get data from form. Start with course and map players to teams.
            foreach (string key in formCollection.AllKeys)
            {
                // found course.
                if (key.Equals("courses", StringComparison.InvariantCultureIgnoreCase))
                {
                    courseId = long.Parse(formCollection[key]);
                }
                // found a player row.
                else if (key.StartsWith(playerPrefix, StringComparison.InvariantCultureIgnoreCase))
                {
                    string formData = formCollection[key];
                    int seperatorIndex = formData.IndexOf("_");
                    long teamId = long.Parse(formData.Substring(0, seperatorIndex));
                    long playerId = long.Parse(formData.Substring(seperatorIndex + 1));
                    playerToTeamIds[playerId] = teamId;
                }
                // found sub for player.
                else if (key.StartsWith("subSelect_", StringComparison.InvariantCultureIgnoreCase))
                {
                    long subPlayerId = long.Parse(formCollection[key]);

                    string[] vals = key.Split(new char[] { '_' });
                    long teamId = long.Parse(vals[1]);
                    long playerId = long.Parse(vals[2]);

                    playerIdToSub[playerId] = subPlayerId;
                    playerToTeamIds[playerId] = teamId;
                }
            }

            // get information for each player found from above.
            foreach (var playerTeamId in playerToTeamIds)
            {
                long playerId = 0;

                // mobile browsers have a select list for the player. The list has all the subs along with Absent(0)/Exclude(-1)
                if (formCollection["playerSelect_" + playerTeamId.Key] != null)
                {
                    long selectedId = long.Parse(formCollection["playerSelect_" + playerTeamId.Key]);
                    // exclude or absent.
                    if (selectedId <= 0)
                        continue;

                    playerId = selectedId;
                }
                else
                {
                    playerId = (playerIdToSub.ContainsKey(playerTeamId.Key)) ? playerIdToSub[playerTeamId.Key] : playerTeamId.Key;
                }
                GolfRoster player = DataAccess.Golf.GolfRosters.GetRosterPlayer(playerId);
                GolfScoreViewModel scoreVM = new GolfScoreViewModel(player)
                {
                    CourseId = courseId,
                    DatePlayed = vm.MatchDate,
                    HolesPlayed = vm.NumberHolesPlayed,
                    TeeId = long.Parse(formCollection["tees_" + playerTeamId.Key])
                };

                for (int i = 1; i <= 18; ++i)
                {
                    var holeScore = formCollection[String.Format(holeFormat, i, playerTeamId.Key)];
                    if (holeScore != null)
                    {
                        int s;
                        if (int.TryParse(holeScore, out s))
                            scoreVM.AddScore(i, s);
                    }
                }

                if (playerTeamId.Value == vm.Team1Id)
                    vm.AddTeam1Score(scoreVM);
                else
                    vm.AddTeam2Score(scoreVM);
            }
        }

        private static IEnumerable<SelectListItem> GetCourseList(long accountId)
        {
            List<SelectListItem> courses = new List<SelectListItem>();
            courses.Add(new SelectListItem() { Text = "Select Course", Value = "0" });

            foreach (var s in DataAccess.Golf.GolfCourses.GetLeagueCourses(accountId))
                courses.Add(new SelectListItem() { Text = s.Name, Value = s.Id.ToString() });

            return courses;
        }

        private static IEnumerable<SelectListItem> GetTeamsList(long flightId)
        {
            List<SelectListItem> teams = new List<SelectListItem>();

            foreach (var s in DataAccess.Teams.GetTeams(flightId))
                teams.Add(new SelectListItem() { Text = s.Name, Value = s.Id.ToString() });

            return teams;
        }

    }
}
