using SportsManager.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class TeamStatisticsAPIController : ApiController
    {
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("gamebatstats")]
        public HttpResponseMessage GetGameBatStats(long accountId, long teamSeasonId, long? id = null)
        {
            if (id.HasValue)
            {
                var gameStats = DataAccess.GameStats.GetBatGameStats(id.Value, teamSeasonId);
                return Request.CreateResponse<IQueryable<ModelObjects.GameBatStats>>(HttpStatusCode.Created, gameStats);
            }
            else
            {
                var gameStats = DataAccess.GameStats.GetBatTeamPlayerTotals(teamSeasonId, "AVG", "descending", false);
                return Request.CreateResponse<IQueryable<ModelObjects.GameBatStats>>(HttpStatusCode.Created, gameStats);
            }
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("nobatstats")]
        public HttpResponseMessage GetPlayersWithNoGameBatStats(long accountId, long teamSeasonId, long id)
        {
            var players = DataAccess.GameStats.GetPlayersWithNoGameBatStats(id, teamSeasonId);
            return Request.CreateResponse<IQueryable<ModelObjects.ContactName>>(HttpStatusCode.Created, players);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("gameplayerbatstats")]
        public HttpResponseMessage GetPlayerGameBatStats(long accountId, long teamSeasonId, long gameId, long playerId)
        {
            var gameStats = DataAccess.GameStats.GetPlayerGameBatStats(gameId, playerId);
            if (gameStats == null)
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }

            return Request.CreateResponse<ModelObjects.GameBatStats>(HttpStatusCode.Created, gameStats);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("gameplayerbatstats")]
        public HttpResponseMessage PostPlayerGameBatStats(long accountId, long teamSeasonId, long gameId, long playerId)
        {
            var batStats = new ModelObjects.GameBatStats()
            {
                GameId = gameId,
                PlayerId = playerId,
                TeamId = teamSeasonId
            };

            var gameStatId = DataAccess.GameStats.AddBattingGameStats(batStats);
            if (gameStatId > 0)
            {
                batStats.Id = gameStatId;
                return Request.CreateResponse<ModelObjects.GameBatStats>(HttpStatusCode.Created, batStats);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("gameplayerbatstats")]
        public HttpResponseMessage PostPlayerGameBatStats(long accountId, long teamSeasonId, long gameId, long playerId, ModelObjects.GameBatStats batStats)
        {
            var updated = DataAccess.GameStats.UpdateBattingGameStats(batStats);
            if (updated)
            {
                return Request.CreateResponse<ModelObjects.GameBatStats>(HttpStatusCode.Created, batStats);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

    }
}
