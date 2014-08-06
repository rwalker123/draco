using SportsManager.Baseball.Controllers;
using SportsManager.Models;
using System;
using System.Web.Mvc;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class WorkoutsController : Controller
    {
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [ActionName("Twitter")]
        public ActionResult PostToTwitter(long accountId, long id)
        {
            string tweetText = WorkoutsAPIController.GetWorkoutTweetText(id);
            if (String.IsNullOrEmpty(tweetText))
                return Redirect(Request.QueryString.Get("referer"));

            var a = DataAccess.SocialIntegration.Twitter.GetAccountTwitterData(accountId);

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
    }
}