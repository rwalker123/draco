using AutoMapper;
using ModelObjects;
using SportsManager.Baseball.ViewModels;
using SportsManager.Controllers;
using SportsManager.Models;
using SportsManager.ViewModels.API;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class RosterAPIController : DBApiController
    {
        private int pageSize = 10;

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("players")]
        public HttpResponseMessage GetPlayers(long accountId, long teamSeasonId, long? id = null)
        {
            if (id.HasValue)
            {
                var player = m_db.RosterSeasons.Find(id.Value);
                if (player == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (player.TeamSeasonId != teamSeasonId)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (player.TeamSeason.LeagueSeason.League.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                var vm = Mapper.Map<PlayerSeason, PlayerViewModel>(player);
                return Request.CreateResponse<PlayerViewModel>(HttpStatusCode.OK, vm);
            }
            else
            {
                var players = m_db.RosterSeasons.Where(rs => rs.TeamSeasonId == teamSeasonId);
                var vm = Mapper.Map<IEnumerable<PlayerSeason>, PlayerViewModel[]>(players);
                return Request.CreateResponse<PlayerViewModel[]>(HttpStatusCode.OK, vm);
            }
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("availableplayers")]
        public HttpResponseMessage GetAvailablePlayers(long accountId, long teamSeasonId, string lastName, string firstName, int page)
        {
            var team = m_db.TeamsSeasons.Find(teamSeasonId);
            if (team == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            long affiliationId = (from a in m_db.Accounts
                                  where a.Id == accountId
                                  select a.AffiliationId).SingleOrDefault();

            var aIds = (from a in m_db.Accounts
                        where a.Id == accountId || (affiliationId != 1 && a.AffiliationId == affiliationId)
                        select a.Id);

            var cIds = (from ts in m_db.TeamsSeasons
                        join rs in m_db.RosterSeasons on ts.Id equals rs.TeamSeasonId
                        join r in m_db.Rosters on rs.PlayerId equals r.Id
                        where ts.LeagueSeasonId == team.LeagueSeasonId && !rs.Inactive
                        select r.ContactId);

            var contacts = (from c in m_db.Contacts
                    where aIds.Contains(c.CreatorAccountId) &&
                    !cIds.Contains(c.Id) &&
                    (String.IsNullOrWhiteSpace(firstName) || c.FirstName.Contains(firstName)) &&
                    (String.IsNullOrWhiteSpace(lastName) || c.LastName.Contains(lastName))
                    orderby c.LastName, c.FirstName, c.MiddleName
                    select c).Skip((page - 1) * pageSize).Take(pageSize);

            var vm = Mapper.Map<IEnumerable<Contact>, ContactNameViewModel[]>(contacts);
            return Request.CreateResponse<ContactNameViewModel[]>(HttpStatusCode.OK, vm);
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
        public async Task<HttpResponseMessage> ModifyPlayer(long accountId, long teamSeasonId, long id, Player p)
        {
            p.AccountId = accountId;
            p.TeamId = teamSeasonId;
            p.Id = id;

            // first update the player, then contact.
            bool success = DataAccess.TeamRoster.ModifyPlayer(p);
            if (success)
            {
                Contact c = p.Contact;
                if (c != null)
                    await DataAccess.Contacts.UpdateContact(c, true);
                return Request.CreateResponse(HttpStatusCode.NoContent);
            }
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
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
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

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("managers")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage DeleteTeamManager(long accountId, long teamSeasonId, long id)
        {
            var team = DataAccess.Teams.GetTeam(teamSeasonId);
            if (team == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var managerRemoved = DataAccess.Teams.RemoveManager(id);
            if (managerRemoved)
                return Request.CreateResponse(HttpStatusCode.OK);
            else
                return Request.CreateResponse(HttpStatusCode.NotFound);

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
