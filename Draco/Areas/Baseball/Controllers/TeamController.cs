using ModelObjects;
using SportsManager.Baseball.ViewModels.Controllers;
using SportsManager.Controllers;
using SportsManager.Controllers.Attributes;
using SportsManager.Models;
using System.IO;
using System.Web.Mvc;

namespace SportsManager.Baseball.Controllers
{
    public class TeamController : DBController
    {
        public TeamController(DB db) : base(db)
        {
        }

        //
        // GET: /Baseball/Team/
        // accountId = accountId or teamId
        // id = NULL if not part of league, <> NULL TeamSeasonId for account.
        [AcceptVerbs("GET"), HttpGet]
        public ActionResult Index(long? accountId, long? id)
        {
            long aId = accountId.GetValueOrDefault(0);
            long teamSeasonId = id.GetValueOrDefault(0);
            if (accountId == 0 || teamSeasonId == 0)
            {
                return RedirectToAction("Index", "Baseball");
            }

            return View(new TeamViewModel(this, aId, teamSeasonId));
        }

        //
        // GET: /Baseball/Team/
        // accountId = accountId or teamId
        // id = NULL if not part of league, <> NULL TeamSeasonId for account.
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("statistics")]
        public ActionResult GetStatistics(long accountId, long id)
        {
            return View(new TeamStatisticsViewModel(this, accountId, id /*teamSeasonId*/));
        }

        //
        // GET: /Baseball/Team/
        // accountId = accountId or teamId
        // id = NULL if not part of league, <> NULL TeamSeasonId for account.
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("rostercard")]
        public ActionResult RosterCard(long accountId, long id)
        {
            return View(new RosterCardViewModel(this, accountId, id /*teamSeasonId*/));
        }

        //
        // GET: /Baseball/Team/
        // accountId = accountId or teamId
        // id = NULL if not part of league, <> NULL TeamSeasonId for account.
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("addresslist")]
        public ActionResult AddressList(long accountId, long id)
        {
            return View(new TeamAddressViewModel(this, accountId, id /*teamSeasonId*/));
        }

        //
        // GET: /Baseball/Team/
        // accountId = accountId or teamId
        // id = NULL if not part of league, <> NULL TeamSeasonId for account.
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("exportaddresslist")]
        [SportsManagerAuthorize(Roles="AccountAdmin")]
        [DeleteTempFile]
        public FileStreamResult ExportAddressList(long accountId, long id)
        {
            var vm = new TeamAddressViewModel(this, accountId, id);
            FileStream strm = vm.ExportToExcel();
            this.TempData["tempFileName"] = strm.Name;
            var fs = new FileStreamResult(strm, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            fs.FileDownloadName = vm.Team.Name + ".xlsx";
            return fs;
        }


        //
        // GET: /Baseball/Team/
        // accountId = accountId or teamId
        // id = NULL if not part of league, <> NULL TeamSeasonId for account.
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("schedule")]
        public ActionResult Schedule(long accountId, long id)
        {
            return View(new TeamScheduleViewModel(this, accountId, id /*teamSeasonId*/));
        }
    }
}
