using AutoMapper;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using SportsManager.Models;
using SportsManager.Controllers;
using ModelObjects;
using SportsManager.Golf.ViewModels.Controllers;
using SportsManager.Golf.Models;

namespace SportsManager.Golf.Controllers
{
    public class ScheduleController : DBController
    {
        public ScheduleController(DB db) : base(db)
        {

        }
        //
        // GET: /Golf/Schedule/
        [OutputCache(Duration = 0, VaryByParam = "None")]
        public ActionResult Index(long accountId, long seasonId, long id)
        {
            ViewBag.FlightId = id;

            var season = Db.Seasons.Find(seasonId);
            if (season != null && season.AccountId == accountId)
            {
                var leagues = Db.LeagueSeasons.Where(ls => ls.SeasonId == seasonId);
                ViewData["Leagues"] = new SelectList(leagues, "Id", "Name", id);
            }

            return View();
        }

        [OutputCache(Duration = 0, VaryByParam = "None")]
        public ActionResult GetScheduleGrid(long accountId, long seasonId, long id)
        {
            ViewData["FlightId"] = id;

            var golfMatches = Db.GolfMatches.Where(gm => gm.LeagueId == id);

            // convert to TeamViewModel
            var tvm = Mapper.Map<IQueryable<GolfMatch>, IEnumerable<GolfMatchViewModel>>(golfMatches);

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

            return View(new GolfMatchViewModel()
            {
                FlightId = id
            });
        }

        //
        // POST: /Golf/Schedule/Create
        [HttpPost]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public ActionResult Create(long accountId, long seasonId, long id, GolfMatchViewModel vm)
        {
            if (ModelState.IsValid)
            {
                GolfMatch gm = GolfMatchFromViewModel(vm);
                gm.LeagueId = id;
                gm.MatchStatus = 0;
                gm.Comment = String.Empty;

                Db.GolfMatches.Add(gm);
                Db.SaveChanges();
                System.Diagnostics.Debug.Assert(false, "fix this");
                //if (collection["continueWithMore"] != null && collection["continueWithMore"] == "1")
                //{
                //    vm.MatchTime = vm.MatchTime.Add(new TimeSpan(0, 6, 0));
                //}
                //else
                //{
                //    return RedirectToAction("Index", new { accountId = accountId, seasonId = seasonId, id = id });
                //}
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

            var golfMatch = Db.GolfMatches.Find(id);
            var vm = Mapper.Map<GolfMatch, GolfMatchViewModel>(golfMatch);

            ViewData["Courses"] = GetCourseList(accountId);
            ViewData["Teams"] = GetTeamsList(flightId);
            ViewData["ForCreate"] = false;

            return View("Create", vm);
        }

        //
        // POST: /Golf/Schedule/Create
        [HttpPost]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public ActionResult Edit(long accountId, long seasonId, long flightId, long id, GolfMatchViewModel vm)
        {
            if (ModelState.IsValid)
            {
                GolfMatch gm = Db.GolfMatches.Find(id);
                if (gm != null && gm.LeagueId == flightId)
                {
                    gm.Comment = String.Empty;

                    bool updateSuccess = UpdateMatch(gm, vm, updateStatus: false);
                    if (updateSuccess)
                        return RedirectToAction("Index", new { accountId = accountId, seasonId = seasonId, id = flightId });
                }
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
            bool success = RemoveMatch(id);

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
            
            MatchResultsViewModel vm = new MatchResultsViewModel(this, accountId, id);
            vm.InitializeFromDB();

            BuildCourseList(accountId, vm.CourseId);

            ViewBag.FlightId = flightId;

            return View(vm);
        }

        [HttpPost]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public ActionResult MatchResults(long accountId, long seasonId, long flightId, long id, FormCollection formCollection)
        {
            MatchResultsViewModel vm = new MatchResultsViewModel(this, accountId, id);

            UpdateMatchResultsFromForm(vm, formCollection);
            vm.MatchStatus = 1;

            GolfMatchViewModel gmvm = new GolfMatchViewModel()
            {
                MatchId = vm.MatchId,
                Team1 = vm.Team1Id,
                Team2 = vm.Team2Id,
                FlightId = flightId,
                MatchDate = vm.MatchDate,
                MatchTime = vm.MatchTime,
                CourseId = vm.CourseId,
                MatchStatus = 1, // 1 = complete.
                MatchType = vm.MatchType
            };
            Dictionary<long, Dictionary<long, GolfScore>> scoreUpdates = new Dictionary<long, Dictionary<long, GolfScore>>();

            var team1Scores = new Dictionary<long, GolfScore>();
            scoreUpdates[vm.Team1Id] = team1Scores;

            foreach (GolfScoreViewModel golfScoreVM in vm.Team1Scores)
            {
                team1Scores[golfScoreVM.PlayerId] = GolfScoreFromViewModel(golfScoreVM);
            }

            var team2Scores = new Dictionary<long, GolfScore>();
            scoreUpdates[vm.Team2Id] = team2Scores;

            foreach (GolfScoreViewModel golfScoreVM in vm.Team2Scores)
            {
                team2Scores[golfScoreVM.PlayerId] = GolfScoreFromViewModel(golfScoreVM);
            }

            var gm = Db.GolfMatches.Find(id);

            UpdateMatchScores(gm, scoreUpdates);

            UpdateMatch(gm, gmvm);

            return RedirectToAction("Home", "League", new { area = "Golf", accountId = accountId });
        }

        [OutputCache(Duration = 0, VaryByParam = "None")]
        public ActionResult LeagueStandings(long accountId, long seasonId, long id)
        {
            LeagueStandingsViewModel vm = new LeagueStandingsViewModel(this, accountId, seasonId, id);

            ViewBag.FlightId = id;

            return View(vm);
        }

        [OutputCache(Duration = 0, VaryByParam = "None")]
        public ActionResult MobileRecentMatch(long accountId, long seasonId, long id)
        {
            CompletedMatchViewModel vm = new CompletedMatchViewModel(this, accountId, seasonId, id);

            ViewBag.FlightId = id;

            return View(vm);
        }

        [OutputCache(Duration = 0, VaryByParam = "None")]
        public ActionResult ShowLeagueMatchResults(long accountId, long seasonId, long flightId, long id)
        {
            GolfMatch match = Db.GolfMatches.Find(id);
            LeagueMatchResultsViewModel vm = new LeagueMatchResultsViewModel(this, accountId, flightId, match.MatchDate);

            ViewBag.FlightId = flightId;
            return View(vm);
        }

        [OutputCache(Duration = 0, VaryByParam = "None")]
        public ActionResult ShowMatchResults(long accountId, long seasonId, long flightId, long id)
        {
            MatchResultsViewModel vm = new MatchResultsViewModel(this, accountId, id);
            vm.InitializeMatchResults(accountId);

            ViewBag.FlightId = flightId;

            return View(vm);
        }

        [OutputCache(Duration = 0, VaryByParam = "None")]
        public ActionResult PreviewMatch(long accountId, long seasonId, long flightId, long id)
        {
            PreviewMatchViewModel vm = new PreviewMatchViewModel(this, accountId, id);

            BuildCourseList(accountId, vm.CourseId);

            ViewBag.FlightId = flightId;

            return View(vm);
        }

        [OutputCache(Duration = 0, VaryByParam = "None")]
        public ActionResult CompleteSchedule(long accountId, long seasonId, long id)
        {
            LeagueScheduleViewModel vm = new LeagueScheduleViewModel(this, accountId, id);

            ViewBag.FlightId = id;

            ViewBag.IsMobile = MobileHelpers.IsMobileDevice(Request);

            return View(vm);
        }

        private void BuildCourseList(long accountId, long selectedCourseId)
        {
            var courses = this.GetLeagueCourses(accountId);

            var coursesVM = Mapper.Map<IQueryable<GolfCourse>, IEnumerable<GolfCourseViewModel>>(courses);
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
                GolfRoster player = this.GetRosterPlayer(playerId);
                GolfScoreViewModel scoreVM = new GolfScoreViewModel(this, player)
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

        private IEnumerable<SelectListItem> GetCourseList(long accountId)
        {
            List<SelectListItem> courses = new List<SelectListItem>();
            courses.Add(new SelectListItem() { Text = "Select Course", Value = "0" });

            foreach (var s in this.GetLeagueCourses(accountId))
                courses.Add(new SelectListItem() { Text = s.Name, Value = s.Id.ToString() });

            return courses;
        }

        private IEnumerable<SelectListItem> GetTeamsList(long flightId)
        {
            var teams = Db.TeamsSeasons.Where(ts => ts.LeagueSeasonId == flightId);
            return Mapper.Map<IQueryable<TeamSeason>, IEnumerable<SelectListItem>>(teams);

            //foreach (var s in Db.Teams.GetTeams(flightId))
            //    teams.Add(new SelectListItem() { Text = s.Name, Value = s.Id.ToString() });
        }

        private GolfMatch GolfMatchFromViewModel(GolfMatchViewModel vm)
        {
            return new GolfMatch()
            {
                Id = vm.MatchId,
                CourseId = vm.CourseId,
                MatchDate = vm.MatchDate,
                MatchTime = vm.MatchTime,
                MatchType = vm.MatchType,
                Team1 = vm.Team1,
                Team2 = vm.Team2,
                MatchStatus = vm.MatchStatus,
                LeagueId = vm.FlightId
            };
        }

        private bool UpdateMatch(GolfMatch dbGolfMatch, GolfMatchViewModel vm, bool updateStatus = true)
        {
            dbGolfMatch.MatchDate = vm.MatchDate;
            dbGolfMatch.MatchTime = vm.MatchTime;
            dbGolfMatch.MatchType = vm.MatchType;
            if (updateStatus)
                dbGolfMatch.MatchStatus = vm.MatchStatus;
            dbGolfMatch.Team1 = vm.Team1;
            dbGolfMatch.Team2 = vm.Team2;
            dbGolfMatch.CourseId = vm.CourseId;
            //dbGolfMatch.Comment = vm.Comment;

            // if any of these change any results have to be removed.
            if (dbGolfMatch.Team1 != vm.Team1 ||
                dbGolfMatch.Team2 != vm.Team2 ||
                dbGolfMatch.CourseId != vm.CourseId)
            {
                var matchScores = (from gms in Db.GolfMatchScores
                                   where gms.MatchId == dbGolfMatch.Id
                                   select gms);

                var golfScores = (from gms in Db.GolfMatchScores
                                  join gs in Db.GolfScores on gms.ScoreId equals gs.Id
                                  where gms.MatchId == dbGolfMatch.Id
                                  select gs);

                Db.GolfScores.RemoveRange(golfScores);
                Db.GolfMatchScores.RemoveRange(matchScores);

                dbGolfMatch.MatchStatus = 0;
            }
            // if date changes update the scores DatePlayed.
            else if (dbGolfMatch.MatchDate != vm.MatchDate)
            {
                var golfScores = (from gms in Db.GolfMatchScores
                                  join gs in Db.GolfScores on gms.ScoreId equals gs.Id
                                  where gms.MatchId == dbGolfMatch.Id
                                  select gs);

                foreach (GolfScore score in golfScores)
                {
                    score.DatePlayed = vm.MatchDate;
                }
            }

            Db.SaveChanges();

            return true;
        }

        private bool RemoveMatch(long matchId)
        {
            GolfMatch dbGolfMatch = (from gm in Db.GolfMatches
                                     where gm.Id == matchId
                                     select gm).SingleOrDefault();
            if (dbGolfMatch == null)
                return false;

            // remove scores entered for this match.
            var golfMatchScores = (from gms in Db.GolfMatchScores
                                   where gms.MatchId == dbGolfMatch.Id
                                   select gms);

            var golfScores = (from gms in Db.GolfMatchScores
                              join gs in Db.GolfScores on gms.ScoreId equals gs.Id
                              where gms.MatchId == dbGolfMatch.Id
                              select gs);

            Db.GolfScores.RemoveRange(golfScores);
            Db.GolfMatchScores.RemoveRange(golfMatchScores);
            Db.GolfMatches.Remove(dbGolfMatch);

            Db.SaveChanges();

            return true;
        }

        private GolfScore GolfScoreFromViewModel(GolfScoreViewModel x)
        {
            GolfRoster rp = Db.GolfRosters.Find(x.PlayerId);
            return new GolfScore()
            {
                CourseId = x.CourseId,
                Contact = rp.Contact,
                TeeId = x.TeeId,
                DatePlayed = x.DatePlayed,
                HolesPlayed = x.HolesPlayed,
                TotalScore = x.TotalScore,
                TotalsOnly = false,
                HoleScore1 = x.HoleScore(1),
                HoleScore2 = x.HoleScore(2),
                HoleScore3 = x.HoleScore(3),
                HoleScore4 = x.HoleScore(4),
                HoleScore5 = x.HoleScore(5),
                HoleScore6 = x.HoleScore(6),
                HoleScore7 = x.HoleScore(7),
                HoleScore8 = x.HoleScore(8),
                HoleScore9 = x.HoleScore(9),
                HoleScore10 = x.HoleScore(10),
                HoleScore11 = x.HoleScore(11),
                HoleScore12 = x.HoleScore(12),
                HoleScore13 = x.HoleScore(13),
                HoleScore14 = x.HoleScore(14),
                HoleScore15 = x.HoleScore(15),
                HoleScore16 = x.HoleScore(16),
                HoleScore17 = x.HoleScore(17),
                HoleScore18 = x.HoleScore(18),
            };

        }

        private bool UpdateMatchScores(GolfMatch match, IDictionary<long, Dictionary<long, GolfScore>> teamIdToRosterPlayerScores)
        {
            // remove all existing match scores, assume the scores passed in are entire set for match.
            var oldMatchScores = (from gm in Db.GolfMatchScores
                                  where gm.MatchId == match.Id
                                  select gm);

            var oldGolfScores = (from gm in Db.GolfMatchScores
                                 join gs in Db.GolfScores on gm.ScoreId equals gs.Id
                                 where gm.MatchId == match.Id
                                 select gs);

            Db.GolfMatchScores.RemoveRange(oldMatchScores);
            Db.GolfScores.RemoveRange(oldGolfScores);
            Db.SaveChanges();

            foreach (var t in teamIdToRosterPlayerScores)
            {
                foreach (var r in t.Value)
                {
                    GolfScore gs = r.Value;

                    // get the start index to use for this round.
                    gs.StartIndex = this.CalculateHandicapIndexOnDate(gs.ContactId, gs.DatePlayed);
                    gs.StartIndex9 = this.CalculateHandicapIndexOnDate(gs.ContactId, gs.DatePlayed, for9Holes: true);
                    Db.GolfScores.Add(gs);
                    Db.SaveChanges();

                    // update future scores.
                    this.UpdateIndexForSubsequentScores(gs);

                    GolfMatchScore gms = new GolfMatchScore()
                    {
                        MatchId = match.Id,
                        TeamId = t.Key,
                        PlayerId = r.Key,
                        ScoreId = gs.Id
                    };

                    Db.GolfMatchScores.Add(gms);
                }
            }

            Db.SaveChanges();

            return true;
        }
    }
}
