using ModelObjects;
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
        [ActionName("GameResultTwitter")]
        public ActionResult GameResultTwitter(long accountId, long id)
        {
            var g = DataAccess.Schedule.GetGame(id);
            if (g == null)
            {
                return Redirect(Request.QueryString.Get("referer"));
            }

            var tweetText = GetGameResultTweetText(g);

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

        static internal String GetGameResultTweetText(Game g)
        {
            string homeTeam = DataAccess.Teams.GetTeamName(g.HomeTeamId);
            string awayTeam = DataAccess.Teams.GetTeamName(g.AwayTeamId);

            // 25+ Wood Bat Final Apr 2: Tigers over Redsox 5 - 4 - http://www.detroitmsbl.com
            // 25+ Final Jun 4: Tigers Tie Redsox 4 - 4
            // 25+ Rainout Jul 5: Tigers @ Redsox 
            // 25+ Postponed Aug 5: Tigers @ Redsox

            string tweetText = String.Empty;

            string leagueName = DataAccess.Leagues.GetLeagueName(g.LeagueId);

            string nonFinalFmt = "{2} {1}: {0} {3} @ {4}";
            string finalFmt = "{2} {1}: {0} {3} {7} {4} {5} - {6}";
            string dateFmt = "MMM d";

            if (g.GameStatus == 1 || g.GameStatus == 4) // Final or Forfeit
            {
                if (g.HomeScore > g.AwayScore)
                {
                    tweetText = String.Format(finalFmt, leagueName, g.GameStatusLongText, g.GameDate.ToString(dateFmt), homeTeam, awayTeam, g.HomeScore, g.AwayScore, "over");
                }
                else if (g.AwayScore > g.HomeScore)
                {
                    tweetText = String.Format(finalFmt, leagueName, g.GameStatusLongText, g.GameDate.ToString(dateFmt), awayTeam, homeTeam, g.AwayScore, g.HomeScore, "over");
                }
                else
                {
                    tweetText = String.Format(finalFmt, leagueName, g.GameStatusLongText, g.GameDate.ToString(dateFmt), awayTeam, homeTeam, g.AwayScore, g.HomeScore, "tied");
                }
            }
            else if (g.GameStatus != 0)
            {
                tweetText = String.Format(nonFinalFmt, leagueName, g.GameStatusLongText, g.GameDate.ToString(dateFmt), awayTeam, homeTeam);
            }

            string uri = Globals.GetURLFromRequest(System.Web.HttpContext.Current.Request);

            return String.Format("{0} http://{1}", tweetText, uri);
        }
	}
}
