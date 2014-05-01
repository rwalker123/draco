using ModelObjects;
using SportsManager.Models;
using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class RosterAPIController : ApiController
    {
        private int pageSize = 10;

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("players")]
        public HttpResponseMessage GetPlayers(long accountId, long teamSeasonId, long? id = null)
        {
            if (id.HasValue)
            {
                var player = DataAccess.TeamRoster.GetPlayer(id.Value);
                return Request.CreateResponse<ModelObjects.Player>(HttpStatusCode.OK, player);
            }
            else
            {
                var players = DataAccess.TeamRoster.GetPlayers(teamSeasonId);
                return Request.CreateResponse<IQueryable<ModelObjects.Player>>(HttpStatusCode.OK, players);
            }
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("availableplayers")]
        public HttpResponseMessage GetAvailablePlayers(long accountId, long teamSeasonId, string lastName, string firstName, int page)
        {
            var team = DataAccess.Teams.GetTeam(teamSeasonId);
            if (team == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var players = DataAccess.TeamRoster.GetAvailablePlayers(accountId, team.LeagueId, firstName, lastName).Skip((page - 1) * pageSize).Take(pageSize);
            var contactNames = players.Select(a => new ModelObjects.ContactName()
            {
                FirstName = a.FirstName,
                LastName = a.LastName,
                MiddleName = a.MiddleName,
                Id = a.Id,
                PhotoURL = a.PhotoURL
            });

            return Request.CreateResponse<IQueryable<ModelObjects.ContactName>>(HttpStatusCode.OK, contactNames);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("roster")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage SignPlayer(long accountId, long teamSeasonId, long id)
        {
            var players = DataAccess.TeamRoster.SignContact(accountId, teamSeasonId, id);
            return Request.CreateResponse<ModelObjects.Player>(HttpStatusCode.OK, players);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("roster")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage ModifyPlayer(long accountId, long teamSeasonId, long id, Player p)
        {
            p.AccountId = accountId;
            p.TeamId = teamSeasonId;
            p.Id = id;

            bool success = DataAccess.TeamRoster.ModifyPlayer(p);
            if (success)
                return Request.CreateResponse(HttpStatusCode.NoContent);
            else
                return Request.CreateResponse(HttpStatusCode.NotFound);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("playernumber")]
        [SportsManagerAuthorize(Roles = "AccountAdmin, TeamAdmin")]
        public HttpResponseMessage ModifyPlayer(long accountId, long teamSeasonId, long id, PlayerNumberData playerNumber)
        {
            var p = DataAccess.TeamRoster.GetPlayer(id);
            if (p == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            int playerNum = 0;
            if (!int.TryParse(playerNumber.PlayerNumber, out playerNum))
            {
                return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "Player Number must be number");
            }

            p.PlayerNumber = playerNum;

            bool success = DataAccess.TeamRoster.ModifyPlayer(p);
            if (success)
                return Request.CreateResponse(HttpStatusCode.NoContent);
            else
                return Request.CreateResponse(HttpStatusCode.NotFound);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("roster")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage ReleasePlayer(long accountId, long teamSeasonId, long id)
        {
            if (DataAccess.TeamRoster.ReleasePlayer(id))
                return Request.CreateResponse(HttpStatusCode.OK);
            else
                return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("players")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage DeletePlayer(long accountId, long teamSeasonId, long id)
        {
            if (DataAccess.TeamRoster.RemovePlayer(id))
                return Request.CreateResponse(HttpStatusCode.OK);
            else
                return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("managers")]
        public HttpResponseMessage TeamManagers(long accountId, long teamSeasonId)
        {
            var team = DataAccess.Teams.GetTeam(teamSeasonId);
            if (team == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var managers = DataAccess.Teams.GetTeamManagers(teamSeasonId);
            return Request.CreateResponse<IQueryable<ModelObjects.TeamManager>>(HttpStatusCode.OK, managers);

        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("managers")]
        public HttpResponseMessage AddTeamManager(long accountId, long teamSeasonId, long id)
        {
            var team = DataAccess.Teams.GetTeam(teamSeasonId);
            if (team == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            TeamManager tm = new TeamManager()
            {
                Id = id,
                TeamId = teamSeasonId,
                AccountId = accountId
            };
            var managerId = DataAccess.Teams.AddManager(tm);
            var newManager = DataAccess.Teams.GetManager(managerId);
            return Request.CreateResponse<ModelObjects.TeamManager>(HttpStatusCode.OK, newManager);

        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("availablemanagers")]
        public HttpResponseMessage AvailableManagers(long accountId, long teamSeasonId, string lastName, string firstName, int page)
        {
            var team = DataAccess.Teams.GetTeam(teamSeasonId);
            if (team == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var availManagers = DataAccess.TeamRoster.GetAvailableManagers(accountId, team.LeagueId, teamSeasonId, firstName, lastName).Skip((page - 1) * pageSize).Take(pageSize);
            var contactNames = availManagers.Select(a => new ModelObjects.ContactName()
            {
                FirstName = a.FirstName,
                LastName = a.LastName,
                MiddleName = a.MiddleName,
                Id = a.Id,
                PhotoURL = a.PhotoURL
            });

            return Request.CreateResponse<IQueryable<ModelObjects.ContactName>>(HttpStatusCode.OK, contactNames);

        }
    }

    public class PlayerNumberData
    {
        public String PlayerNumber { get; set; }
    }

}
