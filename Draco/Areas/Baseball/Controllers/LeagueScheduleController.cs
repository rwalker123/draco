using ModelObjects;
using SportsManager.Baseball.ViewModels;
using SportsManager.Controllers;
using SportsManager.Models;
using System;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class LeagueScheduleController : DBController
	{
        public LeagueScheduleController(DB db) : base(db)
        {
        }

		//
		// GET: /Baseball/LeagueSchedule/
		public ActionResult Index(long? accountId, long? seasonId)
		{
			long aId = accountId.GetValueOrDefault(0);
			if (aId == 0)
				return RedirectToAction("Index", "Baseball");

			long sId = seasonId.GetValueOrDefault(0);
            if (sId == 0)
                sId = m_db.CurrentSeasons.Where(s => s.AccountId == accountId).Select(cs => cs.SeasonId).SingleOrDefault();

			return View("ScheduleMain", new ScheduleViewModel(this, aId, sId));
		}

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [ActionName("GameResultTwitter")]
        public ActionResult GameResultTwitter(long accountId, long id)
        {
            var a = m_db.Accounts.Find(accountId);
            if (a == null)
                return Redirect(Request.QueryString.Get("referer"));

            var g = m_db.LeagueSchedules.Find(id); 
            if (g == null)
                return Redirect(Request.QueryString.Get("referer"));

            var tweetText = GetGameResultTweetText(m_db, g);

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
        static internal String GetGameResultNotificationText(DB db, Game g)
        {
            string homeTeam = db.TeamsSeasons.Find(g.HTeamId).Name;
            string awayTeam = db.TeamsSeasons.Find(g.VTeamId).Name;

            string tweetText = String.Empty;

            string leagueName = db.LeagueSeasons.Find(g.LeagueId).League.Name;

            string nonFinalFmt = "{2} {1}: {0} {3} @ {4}";
            string finalFmt = "{2} {1}: {0} {3} {7} {4} {5} - {6}";
            string dateFmt = "MMM d";

            if (g.GameStatus == 1 || g.GameStatus == 4) // Final or Forfeit
            {
                if (g.HScore > g.VScore)
                {
                    tweetText = String.Format(finalFmt, leagueName, g.GameStatusLongText, g.GameDate.ToString(dateFmt), homeTeam, awayTeam, g.HScore, g.VScore, "over");
                }
                else if (g.VScore > g.HScore)
                {
                    tweetText = String.Format(finalFmt, leagueName, g.GameStatusLongText, g.GameDate.ToString(dateFmt), awayTeam, homeTeam, g.VScore, g.HScore, "over");
                }
                else
                {
                    tweetText = String.Format(finalFmt, leagueName, g.GameStatusLongText, g.GameDate.ToString(dateFmt), awayTeam, homeTeam, g.VScore, g.HScore, "tied");
                }
            }
            else if (g.GameStatus != 0)
            {
                tweetText = String.Format(nonFinalFmt, leagueName, g.GameStatusLongText, g.GameDate.ToString(dateFmt), awayTeam, homeTeam);
            }

            return tweetText;
        }

        static internal String GetGameResultTweetText(DB db, Game g)
        {
            String tweetText = GetGameResultNotificationText(db, g);
            string uri = Globals.GetURLFromRequest(System.Web.HttpContext.Current.Request);
            return String.Format("{0} http://{1}", tweetText, uri);
        }
	}
}
