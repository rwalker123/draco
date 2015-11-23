using AutoMapper;
using ModelObjects;
using SportsManager.Controllers;
using SportsManager.Golf.Models;
using SportsManager.Golf.ViewModels.Controllers;
using System.Web.Mvc;

namespace SportsManager.Golf.Controllers
{
    public class PlayerController : DBController
    {
        public PlayerController(DB db) : base(db)
        {

        }
        //
        // GET: /Golf/Player/

        public ActionResult Index(long accountId, long seasonId, long id)
        {
            ViewData["SeasonId"] = seasonId;

            var rosterPlayer = this.GetRosterPlayer(id);
            var vm = Mapper.Map<GolfRoster, PlayerViewModel>(rosterPlayer);

            vm.GetPlayerScoresForHandicap();

            return View(vm);
        }

        public ActionResult PlayerAllScores(long accountId, long seasonId, long id)
        {
            ViewData["SeasonId"] = seasonId;

            var rosterPlayer = this.GetRosterPlayer(id);
            var vm = Mapper.Map<GolfRoster, PlayerViewModel>(rosterPlayer);

            vm.GetAllPlayerScores();

            return View(vm);
        }
    }
}
