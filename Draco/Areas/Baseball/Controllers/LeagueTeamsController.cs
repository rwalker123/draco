using ModelObjects;
using SportsManager.Controllers;
using SportsManager.Controllers.Attributes;
using SportsManager.Models;
using System;
using System.IO;
using System.Web.Mvc;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class LeagueTeamsController : DBController
    {
        public LeagueTeamsController(DB db)
            : base(db)
        {

        }

        //
        // GET: /Baseball/Teams/

        public ActionResult Index(long? accountId)
        {
            if (accountId.GetValueOrDefault(0) == 0)
            {
                return RedirectToAction("Index", "League");
            }

            return View(new SportsManager.Baseball.ViewModels.LeagueTeamsViewModel(this, accountId.Value));
        }

        //
        // GET: /Baseball/Team/
        // accountId = accountId or teamId
        // id = NULL if not part of league, <> NULL TeamSeasonId for account.
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("exportaddresslist")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [DeleteTempFile]
        public FileStreamResult ExportAddressList(long accountId)
        {
            bool onlyManagers = !String.IsNullOrEmpty(Request.QueryString.Get("m"));
            long leagueId = 0;
            long.TryParse(Request.QueryString.Get("l"), out leagueId);

            var vm = new SportsManager.Baseball.ViewModels.LeagueTeamsViewModel(this, accountId);
            FileStream strm = vm.ExportToExcel(leagueId, onlyManagers);
            this.TempData["tempFileName"] = strm.Name;
            var fs = new FileStreamResult(strm, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            fs.FileDownloadName = vm.AccountName;
            if (onlyManagers)
                fs.FileDownloadName += "Managers";
            fs.FileDownloadName += "AddressList.xlsx";
            return fs;
        }
    }
}
