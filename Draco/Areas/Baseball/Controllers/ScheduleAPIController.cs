using SportsManager.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class ScheduleAPIController : ApiController
    {

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("Game")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage AddGame(long accountId, long leagueSeasonId, ModelObjects.Game game)
        {
            game.LeagueId = leagueSeasonId;
            if (ModelState.IsValid && game != null)
            {
                var newGame = DataAccess.Schedule.AddGame(game);
                if (newGame != null && newGame.Id > 0)
                {
                    return Request.CreateResponse<ModelObjects.Game>(HttpStatusCode.Created, newGame);
                }
                else
                    return Request.CreateResponse(HttpStatusCode.InternalServerError);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("Game")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage UpdateGame(long accountId, long leagueSeasonId, ModelObjects.Game game)
        {
            game.LeagueId = leagueSeasonId;
            if (ModelState.IsValid && game != null)
            {
                bool found = DataAccess.Schedule.ModifyGame(game);
                if (found)
                {
                    return Request.CreateResponse<ModelObjects.Game>(HttpStatusCode.OK, game);
                }
                else
                    return Request.CreateResponse(HttpStatusCode.NotFound);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("GameResult")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage UpdateGameResults(long accountId, long leagueSeasonId, ModelObjects.Game game)
        {
            game.LeagueId = leagueSeasonId;
            if (ModelState.IsValid && game != null)
            {
                bool found = DataAccess.Schedule.UpdateGameScore(game);
                if (found)
                {
                    return Request.CreateResponse<ModelObjects.Game>(HttpStatusCode.OK, game);
                }
                else
                    return Request.CreateResponse(HttpStatusCode.NotFound);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("Game")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage DeleteGame(long accountId, long leagueSeasonId, long id)
        {
            bool found = DataAccess.Schedule.RemoveGame(id);
            if (found)
            {
                return Request.CreateResponse(HttpStatusCode.OK);
            }
            else
                return Request.CreateResponse(HttpStatusCode.NotFound);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("Week")]
        public HttpResponseMessage GetWeekGames(long accountId, long leagueSeasonId)
        {
            var queryValues = Request.RequestUri.ParseQueryString();
            String strStartDate = queryValues["startDay"];
            String strEndDate = queryValues["endDay"];
            if (!String.IsNullOrEmpty(strStartDate) &&
                !String.IsNullOrEmpty(strEndDate))
            {
                DateTime startDate = DateTime.Parse(strStartDate);
                DateTime endDate = DateTime.Parse(strEndDate);
                IQueryable<ModelObjects.Game> games;
                if (leagueSeasonId == 0)
                    games = DataAccess.Schedule.GetCurrentSeasonSchedule(accountId, startDate, endDate);
                else
                    games = DataAccess.Schedule.GetSchedule(leagueSeasonId, startDate, endDate);

                return Request.CreateResponse<IQueryable<ModelObjects.Game>>(HttpStatusCode.OK, games);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("Week")]
        public HttpResponseMessage GetTeamWeekGames(long accountId, long teamSeasonId)
        {
            var queryValues = Request.RequestUri.ParseQueryString();
            String strStartDate = queryValues["startDay"];
            String strEndDate = queryValues["endDay"];
            if (!String.IsNullOrEmpty(strStartDate) &&
                !String.IsNullOrEmpty(strEndDate))
            {
                DateTime startDate = DateTime.Parse(strStartDate);
                DateTime endDate = DateTime.Parse(strEndDate);
                var games = DataAccess.Schedule.GetTeamSchedule(teamSeasonId, startDate, endDate);
                return Request.CreateResponse<IQueryable<ModelObjects.Game>>(HttpStatusCode.OK, games);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }
    }
}
