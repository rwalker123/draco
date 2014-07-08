using SportsManager.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class LeagueTeamsController : Controller
    {
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
        public FileStreamResult ExportAddressList(long accountId)
        {
            var vm = new SportsManager.Baseball.ViewModels.LeagueTeamsViewModel(this, accountId);
            Stream strm = vm.ExportToExcel();
            var fs = new FileStreamResult(strm, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            fs.FileDownloadName = vm.AccountLogoUrl + "AddressList.xlsx";
            return fs;
        }
    }
}
