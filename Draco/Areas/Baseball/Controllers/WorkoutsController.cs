using ModelObjects;
using SportsManager.Baseball.Controllers;
using SportsManager.Controllers;
using SportsManager.Models;
using System;
using System.IO;
using System.Web.Mvc;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class WorkoutsController : DBController
    {
        public WorkoutsController(DB db) : base(db)
        {
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [ActionName("Twitter")]
        public ActionResult PostToTwitter(long accountId, long id)
        {
            var workoutAnnouncement = Db.WorkoutAnnouncements.Find(id);
            string tweetText = WorkoutsAPIController.GetWorkoutTweetText(workoutAnnouncement);
            if (String.IsNullOrEmpty(tweetText))
                return Redirect(Request.QueryString.Get("referer"));

            var a = Db.Accounts.Find(accountId);

            if (!String.IsNullOrEmpty(a.TwitterAccountName))
            {
                return RedirectToAction("SendTweetAsync", "TwitterOauth", new
                {
                    area = "",
                    referer = Request.QueryString.Get("referer") ?? "",
                    accountId = accountId,
                    tweet = tweetText
                });
            }

            if (!String.IsNullOrEmpty(Request.QueryString.Get("referer")))
                return Redirect(Request.QueryString.Get("referer"));

            return View();
        }


        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [ActionName("ExportRegistrants")]
        public FileStreamResult ExportRegistrants(long accountId, long id)
        {
            var vm = new SportsManager.Baseball.ViewModels.WorkoutsViewModel(this, accountId, id);
            FileStream strm = vm.ExportRegistrantsToExcel();
            this.TempData["tempFileName"] = strm.Name;
            var fs = new FileStreamResult(strm, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            fs.FileDownloadName += "WorkoutRegistrationList.xlsx";
            return fs;
        }

    }
}