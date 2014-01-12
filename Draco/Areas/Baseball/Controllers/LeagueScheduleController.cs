using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using SportsManager.Baseball.ViewModels;

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

			return View("ScheduleMain", new ScheduleViewModel(aId, sId));
		}

		[OutputCache(Duration = 0, VaryByParam = "None")]
		public ActionResult GetGames(long accountId, long leagueSeasonId, string date)
		{
			IEnumerable<ModelObjects.Game> games = DataAccess.Schedule.GetSchedule(leagueSeasonId, DateTime.Parse(date));

			var jsonData = (from game in games
							select new
							{
								id = game.Id,
								gameDate = game.GameDate.ToShortDateString(),
								gameTime = game.GameTime.ToShortTimeString(),
								homeTeamId = game.HomeTeamId,
								homeTeamUrl = Url.Action("Index", "Team", new { area = "baseball", accountId = accountId, id = game.HomeTeamId }, null),
								awayTeamUrl = Url.Action("Index", "Team", new { area = "baseball", accountId = accountId, id = game.AwayTeamId }, null),
								awayTeamId = game.AwayTeamId,
								homeScore = game.HomeScore,
								awayScore = game.AwayScore,
								fieldId = game.FieldId,
								fieldName = DataAccess.Fields.GetFieldName(game.FieldId),
								fieldUrl = Url.Action("Fields", "Fields", new { area = "baseball", accountId = accountId, id = game.FieldId }, null),
								gameType = game.GameType,
								statusText = game.GameStatusLongText,
								isGameComplete = game.IsGameComplete(),
								homeTeamName = DataAccess.Teams.GetTeamName(game.HomeTeamId),
								awayTeamName = DataAccess.Teams.GetTeamName(game.AwayTeamId),
								hasGameRecap = DataAccess.GameStats.HasGameRecap(game.Id),
								leagueName = DataAccess.Leagues.GetLeagueName(game.LeagueId),
							});

			return Json(jsonData, JsonRequestBehavior.AllowGet);
		}
	}
}
