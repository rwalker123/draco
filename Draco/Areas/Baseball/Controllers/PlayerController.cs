using ModelObjects;
using SportsManager.Baseball.ViewModels;
using SportsManager.Controllers;
using System.Web.Mvc;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class PlayerController : DBController
    {
        public PlayerController(DB db) : base(db)
        {
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("contact")]
        public ActionResult GetFromContact(long accountId, long id)
        {
            return View("Index", new PlayerViewModel(this, accountId, id, PlayerViewModel.IdType.ContactId));
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("season")]
        public ActionResult GetFromSeason(long accountId, long id)
        {
            return View("Index", new PlayerViewModel(this, accountId, id, PlayerViewModel.IdType.RosterSeasonId));
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("roster")]
        public ActionResult GetFromRoster(long accountId, long id)
        {
            return View("Index", new PlayerViewModel(this, accountId, id, PlayerViewModel.IdType.RosterId));
        }
    }
}