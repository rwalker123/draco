using AutoMapper;
using ModelObjects;
using SportsManager.Controllers;
using SportsManager.Models;
using SportsManager.Utils;
using SportsManager.ViewModels.API;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class TeamStatisticsAPIController : DBApiController
    {
        public TeamStatisticsAPIController(DB db) : base(db)
        {
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("gamebatstats")]
        public HttpResponseMessage GetGameBatStats(long accountId, long teamSeasonId, long? id = null)
        {
            var statsHelper = new BatStatsHelper(Db);

            if (id.HasValue)
            {
                var gameStats = statsHelper.GetBatGameStats(id.Value, teamSeasonId);
                var vm = Mapper.Map<IEnumerable<GameBatStats>, BatStatsViewModel[]>(gameStats);
                return Request.CreateResponse<BatStatsViewModel[]>(HttpStatusCode.OK, vm);
            }
            else
            {
                var gameStats = statsHelper.GetBatTeamPlayerTotals(teamSeasonId, "AVG", "DESC", false);
                return Request.CreateResponse<IEnumerable<BatStatsViewModel>>(HttpStatusCode.OK, gameStats);
            }
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("historicalbatstats")]
        public HttpResponseMessage GetHistoricalGameBatStats(long accountId, long teamSeasonId)
        {
            var t = Db.TeamsSeasons.Find(teamSeasonId);
            if (t == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var statsHelper = new BatStatsHelper(Db);
            var gameStats = statsHelper.GetBatTeamPlayerTotals(t.TeamId, "AVG", "DESC", true);
            return Request.CreateResponse<IEnumerable<BatStatsViewModel>>(HttpStatusCode.OK, gameStats);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("historicalpitchstats")]
        public HttpResponseMessage GetHistoricalGamePitchStats(long accountId, long teamSeasonId)
        {
            var t = Db.TeamsSeasons.Find(teamSeasonId);
            if (t == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var statsHelper = new PitchStatsHelper(Db);
            var gameStats = statsHelper.GetPitchTeamPlayerTotals(t.TeamId, "ERA", "ASC", true);
            return Request.CreateResponse<IEnumerable<PitchStatsViewModel>>(HttpStatusCode.OK, gameStats);
        }


        [AcceptVerbs("GET"), HttpGet]
        [ActionName("gamebatstatstotals")]
        public HttpResponseMessage GetGameBatStatsTotals(long accountId, long teamSeasonId, long? id = null)
        {
            var statsHelper = new BatStatsHelper(Db);

            if (id.HasValue)
            {
                var gameStats = statsHelper.GetBatGameTotals(id.Value, teamSeasonId);
                return Request.CreateResponse<BatStatsViewModel>(HttpStatusCode.OK, gameStats);
            }
            else
            {
                var gameStats = statsHelper.GetBatTeamSeasonTotals(teamSeasonId, this.GetCurrentSeasonId(accountId));
                return Request.CreateResponse<BatStatsViewModel>(HttpStatusCode.OK, gameStats);
            }
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("nobatstats")]
        public HttpResponseMessage GetPlayersWithNoGameBatStats(long accountId, long teamSeasonId, long id)
        {
            var statsHelper = new BatStatsHelper(Db);
            var players = statsHelper.GetPlayersWithNoGameBatStats(id, teamSeasonId);
            return Request.CreateResponse<IEnumerable<ContactNameViewModel>>(HttpStatusCode.OK, players);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("gameplayerbatstats")]
        public HttpResponseMessage GetPlayerGameBatStats(long accountId, long teamSeasonId, long gameId, long playerId)
        {
            var statsHelper = new BatStatsHelper(Db);
            var gameStats = statsHelper.GetPlayerGameBatStats(gameId, playerId);
            if (gameStats == null)
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }

            return Request.CreateResponse<BatStatsViewModel>(HttpStatusCode.OK, gameStats);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("gameplayerbatstats")]
        [SportsManagerAuthorize(Roles = "AccountAdmin, TeamAdmin")]
        public HttpResponseMessage PostPlayerGameBatStats(long accountId, long teamSeasonId, long gameId, long playerId)
        {
            var existing = Db.Batstatsums.Where(bs => bs.PlayerId == playerId && bs.GameId == gameId && bs.TeamId == teamSeasonId).Any();
            if (existing)
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            var batStats = new GameBatStats()
            {
                LeagueSchedule = Db.LeagueSchedules.Find(gameId),
                RosterSeason = Db.RosterSeasons.Find(playerId),
                TeamsSeason = Db.TeamsSeasons.Find(teamSeasonId)
            };

            Db.Batstatsums.Add(batStats);
            Db.SaveChanges();

            var vm = Mapper.Map<GameBatStats, BatStatsViewModel>(batStats);
            return Request.CreateResponse<BatStatsViewModel>(HttpStatusCode.Created, vm);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("gameplayerbatstats")]
        [SportsManagerAuthorize(Roles = "AccountAdmin, TeamAdmin")]
        public HttpResponseMessage DeletePlayerGameBatStats(long accountId, long teamSeasonId, long gameId, long playerId)
        {
            var stat = Db.Batstatsums.Where(bs => bs.GameId == gameId && bs.TeamId == teamSeasonId && bs.PlayerId == playerId).SingleOrDefault();
            if (stat == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            Db.Batstatsums.Remove(stat);
            Db.SaveChanges();

            return Request.CreateResponse(HttpStatusCode.OK);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("gameplayerbatstats")]
        [SportsManagerAuthorize(Roles = "AccountAdmin, TeamAdmin")]
        public HttpResponseMessage PostPlayerGameBatStats(long accountId, long teamSeasonId, long gameId, long playerId, BatStatsViewModel batStats)
        {
            if (!batStats.IsValid())
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            var player = Db.RosterSeasons.Find(playerId);
            if (player == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var team = Db.TeamsSeasons.Find(teamSeasonId);
            if (team == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var game = Db.LeagueSchedules.Find(gameId);
            if (game == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var dbStats = Db.Batstatsums.Find(batStats.Id);
            if (dbStats == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (dbStats.GameId != gameId || dbStats.PlayerId != playerId || dbStats.TeamId != teamSeasonId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            dbStats.Ab = batStats.AB;
            dbStats.H = batStats.H;
            dbStats.R = batStats.R;
            dbStats.C2B = batStats.D;
            dbStats.C3B = batStats.T;
            dbStats.Hr = batStats.HR;
            dbStats.Rbi = batStats.RBI;
            dbStats.So = batStats.SO;
            dbStats.Bb = batStats.BB;
            dbStats.Sb = batStats.SB;
            dbStats.Cs = batStats.CS;
            dbStats.Re = batStats.RE;
            dbStats.Hbp = batStats.HBP;
            dbStats.Intr = batStats.INTR;
            dbStats.Sf = batStats.SF;
            dbStats.Sh = batStats.SH;
            dbStats.Lob = batStats.LOB;

            Db.SaveChanges();
            var vm = Mapper.Map<GameBatStats, BatStatsViewModel>(dbStats);
            return Request.CreateResponse<BatStatsViewModel>(HttpStatusCode.OK, vm);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("gamepitchstats")]
        public HttpResponseMessage GetGamePitchStats(long accountId, long teamSeasonId, long? id = null)
        {
            var statsHelper = new PitchStatsHelper(Db);
            if (id.HasValue)
            {
                var gameStats = statsHelper.GetPitchGameStats(id.Value, teamSeasonId);
                var vm = Mapper.Map<IEnumerable<GamePitchStats>, PitchStatsViewModel[]>(gameStats);
                return Request.CreateResponse<IEnumerable<PitchStatsViewModel>>(HttpStatusCode.OK, vm);
            }
            else
            {
                var gameStats = statsHelper.GetPitchTeamPlayerTotals(teamSeasonId, "ERA", "asc", false);
                return Request.CreateResponse<IEnumerable<PitchStatsViewModel>>(HttpStatusCode.OK, gameStats);
            }
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("gamepitchstatstotals")]
        public HttpResponseMessage GetGamePitchStatsTotals(long accountId, long teamSeasonId, long? id = null)
        {
            var statsHelper = new PitchStatsHelper(Db);
            if (id.HasValue)
            {
                var gameStats = statsHelper.GetPitchGameTotals(id.Value, teamSeasonId);
                return Request.CreateResponse<PitchStatsViewModel>(HttpStatusCode.OK, gameStats);
            }
            else
            {
                var gameStats = statsHelper.GetPitchTeamSeasonTotals(teamSeasonId, this.GetCurrentSeasonId(accountId));
                return Request.CreateResponse<PitchStatsViewModel>(HttpStatusCode.OK, gameStats);
            }
        }


        [AcceptVerbs("GET"), HttpGet]
        [ActionName("nopitchstats")]
        public HttpResponseMessage GetPlayersWithNoGamePitchStats(long accountId, long teamSeasonId, long id)
        {
            var statsHelper = new PitchStatsHelper(Db);
            var players = statsHelper.GetPlayersWithNoGamePitchStats(id, teamSeasonId);
            return Request.CreateResponse<IEnumerable<ContactNameViewModel>>(HttpStatusCode.OK, players);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("gameplayerpitchstats")]
        public HttpResponseMessage GetPlayerGamePitchStats(long accountId, long teamSeasonId, long gameId, long playerId)
        {
            var statsHelper = new PitchStatsHelper(Db);
            var gameStats = statsHelper.GetPlayerGamePitchStats(gameId, playerId);
            if (gameStats == null)
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }

            return Request.CreateResponse<PitchStatsViewModel>(HttpStatusCode.OK, gameStats);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("gameplayerpitchstats")]
        [SportsManagerAuthorize(Roles = "AccountAdmin, TeamAdmin")]
        public HttpResponseMessage DeletePlayerGamePitchStats(long accountId, long teamSeasonId, long gameId, long playerId)
        {
            var stat = Db.Pitchstatsums.Where(bs => bs.GameId == gameId && bs.TeamId == teamSeasonId && bs.PlayerId == playerId).SingleOrDefault();
            if (stat == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            Db.Pitchstatsums.Remove(stat);
            Db.SaveChanges();

            return Request.CreateResponse(HttpStatusCode.OK);
        }


        [AcceptVerbs("POST"), HttpPost]
        [ActionName("gameplayerpitchstats")]
        [SportsManagerAuthorize(Roles = "AccountAdmin, TeamAdmin")]
        public HttpResponseMessage PostPlayerGamePitchStats(long accountId, long teamSeasonId, long gameId, long playerId)
        {
            var existing = Db.Pitchstatsums.Where(bs => bs.PlayerId == playerId && bs.GameId == gameId && bs.TeamId == teamSeasonId).Any();
            if (existing)
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            var pitchStats = new GamePitchStats()
            {
                LeagueSchedule = Db.LeagueSchedules.Find(gameId),
                RosterSeason = Db.RosterSeasons.Find(playerId),
                TeamsSeason = Db.TeamsSeasons.Find(teamSeasonId)
            };

            Db.Pitchstatsums.Add(pitchStats);
            Db.SaveChanges();

            var vm = Mapper.Map<GamePitchStats, PitchStatsViewModel>(pitchStats);
            return Request.CreateResponse<PitchStatsViewModel>(HttpStatusCode.Created, vm);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("gameplayerpitchstats")]
        [SportsManagerAuthorize(Roles = "AccountAdmin, TeamAdmin")]
        public HttpResponseMessage PutPlayerGamePitchStats(long accountId, long teamSeasonId, long gameId, long playerId, PitchStatsViewModel pitchStats)
        {
            if (!pitchStats.IsValid())
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            var player = Db.RosterSeasons.Find(playerId);
            if (player == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var team = Db.TeamsSeasons.Find(teamSeasonId);
            if (team == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var game = Db.LeagueSchedules.Find(gameId);
            if (game == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var dbStats = Db.Pitchstatsums.Find(pitchStats.Id);
            if (dbStats == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (dbStats.GameId != gameId || dbStats.PlayerId != playerId || dbStats.TeamId != teamSeasonId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            dbStats.Ip = pitchStats.IP;
            dbStats.Ip2 = pitchStats.IP2;
            dbStats.Bf = pitchStats.BF;
            dbStats.W = pitchStats.W;
            dbStats.L = pitchStats.L;
            dbStats.S = pitchStats.S;
            dbStats.H = pitchStats.H;
            dbStats.R = pitchStats.R;
            dbStats.Er = pitchStats.ER;
            dbStats.C2B = pitchStats.D;
            dbStats.C3B = pitchStats.T;
            dbStats.Hr = pitchStats.HR;
            dbStats.So = pitchStats.SO;
            dbStats.Bb = pitchStats.BB;
            dbStats.Wp = pitchStats.WP;
            dbStats.Hbp = pitchStats.HBP;
            dbStats.Bk = pitchStats.BK;
            dbStats.Sc = pitchStats.SC;

            Db.SaveChanges();

            var vm = Mapper.Map<GamePitchStats, PitchStatsViewModel>(dbStats);
            return Request.CreateResponse<PitchStatsViewModel>(HttpStatusCode.OK, vm);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("gamesummary")]
        public HttpResponseMessage GetGameSummary(long accountId, long teamSeasonId, long id)
        {
            var recap = (from gr in Db.GameRecaps
                         where gr.TeamId == teamSeasonId && gr.GameId == id
                         select gr).SingleOrDefault();

            string gameSummary = String.Empty;
            if (recap != null)
                gameSummary = recap.Recap;

            return Request.CreateResponse<String>(HttpStatusCode.OK, gameSummary);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("gamesummary")]
        [SportsManagerAuthorize(Roles = "AccountAdmin, TeamAdmin")]
        public HttpResponseMessage PostGameSummary(long accountId, long teamSeasonId, long id, GameRecapViewModel recap)
        {
            var dbRecap = Db.GameRecaps.Where(gr => gr.GameId == id && gr.TeamId == teamSeasonId).SingleOrDefault();
            if (dbRecap == null)
            {
                dbRecap = new GameRecap();
                Db.GameRecaps.Add(dbRecap);
            }

            dbRecap.GameId = id;
            dbRecap.TeamId = teamSeasonId;
            dbRecap.Recap = recap.Recap ?? String.Empty;
            Db.SaveChanges();

            var vm = Mapper.Map<GameRecap, GameRecapViewModel>(dbRecap);
            return Request.CreateResponse<GameRecapViewModel>(HttpStatusCode.Created, vm);
        }
    }
}
