using SportsManager.Baseball.ViewModels;
using SportsManager.Models;
using System;
using System.Web;
using System.Web.Mvc;

namespace SportsManager.Areas.Baseball.Controllers
{
	public class LeagueScheduleController : Controller
	{
		//
		// GET: /Baseball/LeagueSchedule/
		public ActionResult Index(long? accountId, long? seasonId)
		{
			long aId = accountId.GetValueOrDefault(0);
			if (aId == 0)
				return RedirectToAction("Index", "Baseball");

			long sId = seasonId.GetValueOrDefault(0);
			if (sId == 0)
				sId = DataAccess.Seasons.GetCurrentSeason(aId);

			return View("ScheduleMain", new ScheduleViewModel(this, aId, sId));
		}

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("POST"), HttpPost]
        [ActionName("GameResultTwitter")]
        public ActionResult GameResultTwitter(long accountId, ModelObjects.Game g)
        {
            string homeTeam = DataAccess.Teams.GetTeamName(g.HomeTeamId);
            string awayTeam = DataAccess.Teams.GetTeamName(g.AwayTeamId);

            // 25+ Wood Bat Final Apr 2: Tigers over Redsox 5 - 4 - http://www.detroitmsbl.com
            // 25+ Final Jun 4: Tigers Tie Redsox 4 - 4
            // 25+ Rainout Jul 5: Tigers @ Redsox 
            // 25+ Postponed Aug 5: Tigers @ Redsox

            string tweet = String.Empty;

            string leagueName = DataAccess.Leagues.GetLeagueName(g.LeagueId);

            string nonFinalFmt = "{2} {1}: {0} {3} @ {4}";
            string finalFmt = "{2} {1}: {0} {3} {7} {4} {5} - {6}";
            string dateFmt = "MMM d";

            if (g.GameStatus == 1 || g.GameStatus == 4) // Final or Forfeit
            {
                if (g.HomeScore > g.AwayScore)
                {
                    tweet = String.Format(finalFmt, leagueName, g.GameStatusLongText, g.GameDate.ToString(dateFmt), homeTeam, awayTeam, g.HomeScore, g.AwayScore, "over");
                }
                else if (g.AwayScore > g.HomeScore)
                {
                    tweet = String.Format(finalFmt, leagueName, g.GameStatusLongText, g.GameDate.ToString(dateFmt), awayTeam, homeTeam, g.AwayScore, g.HomeScore, "over");
                }
                else
                {
                    tweet = String.Format(finalFmt, leagueName, g.GameStatusLongText, g.GameDate.ToString(dateFmt), awayTeam, homeTeam, g.AwayScore, g.HomeScore, "tied");
                }
            }
            else if (g.GameStatus != 0)
            {
                tweet = String.Format(nonFinalFmt, leagueName, g.GameStatusLongText, g.GameDate.ToString(dateFmt), awayTeam, homeTeam);
            }

            string uri = Globals.GetURLFromRequest(System.Web.HttpContext.Current.Request);

            uri = HttpUtility.UrlEncode(String.Format("{0} http://{1}", tweet, uri));

			var a = DataAccess.SocialIntegration.Twitter.GetAccountTwitterData(accountId);

			if (!String.IsNullOrEmpty(a.TwitterAccountName))
			{
                return RedirectToAction("BeginAsync", "TwitterOauth", new
                {
                    area = "",
                    accountId = accountId,
                    twitterRefererPage = "",
                    twitterStatus = tweet,
                    twitterAccount = a.TwitterAccountName,
                    twitterReqCode = "s",
                    twitterAuthToken = a.TwitterOauthToken,
                    twitterAuthSecretKey = a.TwitterOauthSecretKey
                });
			}

            return View();
        }
	}
}
