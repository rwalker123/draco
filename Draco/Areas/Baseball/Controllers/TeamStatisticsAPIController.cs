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
        [ActionName("gamebatstatstotals")]
        public HttpResponseMessage GetGameBatStatsTotals(long accountId, long teamSeasonId, long? id = null)
        {
            if (id.HasValue)
            {
                var gameStats = DataAccess.GameStats.GetBatGameTotals(id.Value, teamSeasonId);
                return Request.CreateResponse<ModelObjects.GameBatStats>(HttpStatusCode.Created, gameStats);
            }
            else
            {
                var gameStats = DataAccess.GameStats.GetBatTeamSeasonTotals(teamSeasonId, DataAccess.Seasons.GetCurrentSeason(accountId));
                return Request.CreateResponse<ModelObjects.GameBatStats>(HttpStatusCode.Created, gameStats);
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
        [SportsManagerAuthorize(Roles = "AccountAdmin, TeamAdmin")]
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

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("gameplayerbatstats")]
        [SportsManagerAuthorize(Roles = "AccountAdmin, TeamAdmin")]
        public HttpResponseMessage DeletePlayerGameBatStats(long accountId, long teamSeasonId, long gameId, long playerId)
        {
            var batStats = new ModelObjects.GameBatStats()
            {
                GameId = gameId,
                PlayerId = playerId,
                TeamId = teamSeasonId
            };

            var gameStatId = DataAccess.GameStats.RemoveGameBatStats(batStats);
            if (gameStatId)
            {
                return Request.CreateResponse(HttpStatusCode.OK);
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("gameplayerbatstats")]
        [SportsManagerAuthorize(Roles = "AccountAdmin, TeamAdmin")]
        public HttpResponseMessage PostPlayerGameBatStats(long accountId, long teamSeasonId, long gameId, long playerId, ModelObjects.GameBatStats batStats)
        {
            var updated = DataAccess.GameStats.UpdateBattingGameStats(batStats);
            if (updated)
            {
                return Request.CreateResponse<ModelObjects.GameBatStats>(HttpStatusCode.Created, batStats);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("gamepitchstats")]
        public HttpResponseMessage GetGamePitchStats(long accountId, long teamSeasonId, long? id = null)
        {
            if (id.HasValue)
            {
                var gameStats = DataAccess.GameStats.GetPitchGameStats(id.Value, teamSeasonId);
                return Request.CreateResponse<IQueryable<ModelObjects.GamePitchStats>>(HttpStatusCode.Created, gameStats);
            }
            else
            {
                var gameStats = DataAccess.GameStats.GetPitchTeamPlayerTotals(teamSeasonId, "ERA", "ascending", false);
                return Request.CreateResponse<IQueryable<ModelObjects.GamePitchStats>>(HttpStatusCode.Created, gameStats);
            }
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("gamepitchstatstotals")]
        public HttpResponseMessage GetGamePitchStatsTotals(long accountId, long teamSeasonId, long? id = null)
        {
            if (id.HasValue)
            {
                var gameStats = DataAccess.GameStats.GetPitchGameTotals(id.Value, teamSeasonId);
                return Request.CreateResponse<ModelObjects.GamePitchStats>(HttpStatusCode.Created, gameStats);
            }
            else
            {
                var gameStats = DataAccess.GameStats.GetPitchTeamSeasonTotals(teamSeasonId, DataAccess.Seasons.GetCurrentSeason(accountId));
                return Request.CreateResponse<ModelObjects.GamePitchStats>(HttpStatusCode.Created, gameStats);
            }
        }


        [AcceptVerbs("GET"), HttpGet]
        [ActionName("nopitchstats")]
        public HttpResponseMessage GetPlayersWithNoGamePitchStats(long accountId, long teamSeasonId, long id)
        {
            var players = DataAccess.GameStats.GetPlayersWithNoGamePitchStats(id, teamSeasonId);
            return Request.CreateResponse<IQueryable<ModelObjects.ContactName>>(HttpStatusCode.Created, players);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("gameplayerpitchstats")]
        public HttpResponseMessage GetPlayerGamePitchStats(long accountId, long teamSeasonId, long gameId, long playerId)
        {
            var gameStats = DataAccess.GameStats.GetPlayerGamePitchStats(gameId, playerId);
            if (gameStats == null)
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }

            return Request.CreateResponse<ModelObjects.GamePitchStats>(HttpStatusCode.Created, gameStats);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("gameplayerpitchstats")]
        [SportsManagerAuthorize(Roles = "AccountAdmin, TeamAdmin")]
        public HttpResponseMessage DeletePlayerGamePitchStats(long accountId, long teamSeasonId, long gameId, long playerId)
        {
            var pitchStats = new ModelObjects.GamePitchStats()
            {
                GameId = gameId,
                PlayerId = playerId,
                TeamId = teamSeasonId
            };

            var gameStatId = DataAccess.GameStats.RemoveGamePitchStats(pitchStats);
            if (gameStatId)
            {
                return Request.CreateResponse(HttpStatusCode.OK);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }


        [AcceptVerbs("POST"), HttpPost]
        [ActionName("gameplayerpitchstats")]
        [SportsManagerAuthorize(Roles = "AccountAdmin, TeamAdmin")]
        public HttpResponseMessage PostPlayerGamePitchStats(long accountId, long teamSeasonId, long gameId, long playerId)
        {
            var batStats = new ModelObjects.GamePitchStats()
            {
                GameId = gameId,
                PlayerId = playerId,
                TeamId = teamSeasonId
            };

            var gameStatId = DataAccess.GameStats.AddPitchingGameStats(batStats);
            if (gameStatId > 0)
            {
                batStats.Id = gameStatId;
                return Request.CreateResponse<ModelObjects.GamePitchStats>(HttpStatusCode.Created, batStats);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("gameplayerpitchstats")]
        [SportsManagerAuthorize(Roles = "AccountAdmin, TeamAdmin")]
        public HttpResponseMessage PostPlayerGamePitchStats(long accountId, long teamSeasonId, long gameId, long playerId, ModelObjects.GamePitchStats pitchStats)
        {
            var updated = DataAccess.GameStats.UpdatePitchingGameStats(pitchStats);
            if (updated)
            {
                return Request.CreateResponse<ModelObjects.GamePitchStats>(HttpStatusCode.Created, pitchStats);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("gamesummary")]
        public HttpResponseMessage GetGameSummary(long accountId, long teamSeasonId, long id)
        {
            var gameStats = DataAccess.GameStats.GetGameRecap(id, teamSeasonId);
            string gameSummary = String.Empty;
            if (gameStats != null)
                gameSummary = gameStats.Recap;

            return Request.CreateResponse<String>(HttpStatusCode.Created, gameSummary);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("gamesummary")]
        [SportsManagerAuthorize(Roles = "AccountAdmin, TeamAdmin")]
        public HttpResponseMessage PostGameSummary(long accountId, long teamSeasonId, long id, ModelObjects.GameRecap recap)
        {
            var gameStats = DataAccess.GameStats.UpdateGameRecap(recap);
            string gameSummary = String.Empty;
            if (gameStats)
                gameSummary = recap.Recap;

            return Request.CreateResponse<String>(HttpStatusCode.Created, gameSummary);
        }
    }
}
