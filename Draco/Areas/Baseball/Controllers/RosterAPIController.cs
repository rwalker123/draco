using AutoMapper;
using ModelObjects;
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
        public RosterAPIController(DB db) : base(db)
        {
        }

        private int pageSize = 10;

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("players")]
        public HttpResponseMessage GetPlayers(long accountId, long teamSeasonId, long? id = null)
        {
            if (id.HasValue)
            {
                var player = Db.RosterSeasons.Find(id.Value);
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
                var players = Db.RosterSeasons.Where(rs => rs.TeamSeasonId == teamSeasonId).OrderBy(rs => rs.Roster.Contact.LastName).ThenBy(rs => rs.Roster.Contact.FirstName).ThenBy(rs => rs.Roster.Contact.MiddleName);
                var vm = Mapper.Map<IEnumerable<PlayerSeason>, PlayerViewModel[]>(players);
                return Request.CreateResponse<PlayerViewModel[]>(HttpStatusCode.OK, vm);
            }
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("availableplayers")]
        public HttpResponseMessage GetAvailablePlayers(long accountId, long teamSeasonId, string lastName, string firstName, int page)
        {
            var team = Db.TeamsSeasons.Find(teamSeasonId);
            if (team == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            long affiliationId = (from a in Db.Accounts
                                  where a.Id == accountId
                                  select a.AffiliationId).SingleOrDefault();

            var aIds = (from a in Db.Accounts
                        where a.Id == accountId || (affiliationId != 1 && a.AffiliationId == affiliationId)
                        select a.Id);

            var cIds = (from ts in Db.TeamsSeasons
                        join rs in Db.RosterSeasons on ts.Id equals rs.TeamSeasonId
                        join r in Db.Rosters on rs.PlayerId equals r.Id
                        where ts.LeagueSeasonId == team.LeagueSeasonId && !rs.Inactive
                        select r.ContactId);

            var contacts = (from c in Db.Contacts
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
            var ts = Db.TeamsSeasons.Find(teamSeasonId);
            if (ts == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var c = Db.Contacts.Find(id);
            if (c == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var rosterPlayer = Db.Rosters.Where(r => r.ContactId == id).SingleOrDefault();
            if (rosterPlayer == null)
            {
                rosterPlayer = new Player()
                {
                    AccountId = accountId,
                    Contact = c,
                    SubmittedDriversLicense = false
                };

                Db.Rosters.Add(rosterPlayer);
            }

            var rosterSeason = (from rs in Db.RosterSeasons
                                where rs.PlayerId == rosterPlayer.Id && rs.TeamSeasonId == teamSeasonId
                                select rs).SingleOrDefault();

            if (rosterSeason == null)
            {
                rosterSeason = new PlayerSeason()
                {
                    Roster = rosterPlayer,
                    TeamSeasonId = teamSeasonId,
                    DateAdded = DateTime.Now
                };

                Db.RosterSeasons.Add(rosterSeason);
            }
            else
            {
                rosterSeason.Inactive = false;
                rosterSeason.DateAdded = DateTime.Now;
            }

            Db.SaveChanges();

            var vm = Mapper.Map<PlayerSeason, PlayerViewModel>(rosterSeason);
            return Request.CreateResponse<PlayerViewModel>(HttpStatusCode.OK, vm);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("roster")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> ModifyPlayer(long accountId, long teamSeasonId, long id, PlayerViewModel p)
        {
            var ts = Db.TeamsSeasons.Find(teamSeasonId);
            if (ts == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (ts.Team.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            var rs = Db.RosterSeasons.Find(id);
            if (rs == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            rs.SubmittedWaiver = p.SubmittedWaiver;
            rs.PlayerNumber = p.PlayerNumber;

            rs.Roster.SubmittedDriversLicense = p.SubmittedDriversLicense;

            var seasonId = this.GetCurrentSeasonId(accountId);

            var dbAffDues = (from ad in Db.PlayerSeasonAffiliationDues
                             where ad.PlayerId == rs.Roster.Id && ad.SeasonId == seasonId
                             select ad).SingleOrDefault();

            string affDuesPaid = p.AffiliationDuesPaid == null ? String.Empty : p.AffiliationDuesPaid;

            if (dbAffDues != null)
            {
                dbAffDues.AffiliationDuesPaid = affDuesPaid;
            }
            else
            {
                dbAffDues = new PlayerSeasonAffiliationDue()
                {
                    PlayerId = rs.Roster.Id,
                    AffiliationDuesPaid = affDuesPaid,
                    SeasonId = seasonId
                };

                Db.PlayerSeasonAffiliationDues.Add(dbAffDues);
            }


            // first update the player, then contact.
            Contact c = rs.Roster.Contact;
            await this.UpdateContact(accountId, c, p.Contact, true);

            Db.SaveChanges();

            return Request.CreateResponse(HttpStatusCode.NoContent);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("playernumber")]
        [SportsManagerAuthorize(Roles = "AccountAdmin, TeamAdmin")]
        public HttpResponseMessage ModifyPlayer(long accountId, long teamSeasonId, long id, PlayerNumberData playerNumber)
        {
            var p = Db.RosterSeasons.Find(id);
            if (p == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (p.TeamSeasonId != teamSeasonId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            if (p.Roster.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            int playerNum = 0;
            if (!int.TryParse(playerNumber.PlayerNumber, out playerNum))
            {
                return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "Player Number must be number");
            }

            p.PlayerNumber = playerNum;

            Db.SaveChanges();
            return Request.CreateResponse(HttpStatusCode.NoContent);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("roster")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage ReleasePlayer(long accountId, long teamSeasonId, long id)
        {
            var p = Db.RosterSeasons.Find(id);
            if (p == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (p.TeamSeasonId != teamSeasonId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            if (p.Roster.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            p.Inactive = true;

            Db.SaveChanges();

            return Request.CreateResponse(HttpStatusCode.OK);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("players")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage DeletePlayer(long accountId, long teamSeasonId, long id)
        {
            var p = Db.RosterSeasons.Find(id);
            if (p == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (p.TeamSeasonId != teamSeasonId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            if (p.Roster.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            RemovePlayer(p);
            return Request.CreateResponse(HttpStatusCode.OK);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("managers")]
        public HttpResponseMessage TeamManagers(long accountId, long teamSeasonId)
        {
            var ts = Db.TeamsSeasons.Find(teamSeasonId);
            if (ts == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (ts.Team.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            var managers = Db.TeamSeasonManagers.Where(tsm => tsm.TeamSeasonId == ts.Id);

            var vm = Mapper.Map<IEnumerable<TeamManager>, TeamManagerViewModel[]>(managers);
            return Request.CreateResponse<TeamManagerViewModel[]>(HttpStatusCode.OK, vm);

        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("managers")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage AddTeamManager(long accountId, long teamSeasonId, long id)
        {
            var ts = Db.TeamsSeasons.Find(teamSeasonId);
            if (ts == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var c = Db.Contacts.Find(id);
            if (c == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (ts.Team.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            var isManager = c.TeamSeasonManagers.Where(tsm => tsm.TeamSeasonId == ts.Id).Any();
            if (isManager)
                return Request.CreateResponse(HttpStatusCode.OK);

            var dbManager = new TeamManager()
            {
                TeamsSeason = ts,
                Contact = c
            };

            Db.TeamSeasonManagers.Add(dbManager);

            Db.SaveChanges();

            var vm = Mapper.Map<TeamManager, TeamManagerViewModel>(dbManager);
            return Request.CreateResponse<TeamManagerViewModel>(HttpStatusCode.OK, vm);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("managers")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage DeleteTeamManager(long accountId, long teamSeasonId, long id)
        {
            var ts = Db.TeamsSeasons.Find(teamSeasonId);
            if (ts == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (ts.Team.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            var manager = Db.TeamSeasonManagers.Find(id);
            if (manager == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (manager.TeamSeasonId != ts.Id)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            Db.TeamSeasonManagers.Remove(manager);
            Db.SaveChanges();

            return Request.CreateResponse(HttpStatusCode.OK);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("availablemanagers")]
        public HttpResponseMessage AvailableManagers(long accountId, long teamSeasonId, string lastName, string firstName, int page)
        {
            var ts = Db.TeamsSeasons.Find(teamSeasonId);
            if (ts == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (ts.Team.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            var availManagers = GetAvailableManagers(accountId, ts, firstName, lastName).Skip((page - 1) * pageSize).Take(pageSize);
            var vm = Mapper.Map<IEnumerable<Contact>, ContactNameViewModel[]>(availManagers);
            return Request.CreateResponse<ContactNameViewModel[]>(HttpStatusCode.OK, vm);
        }

        private bool RemovePlayer(PlayerSeason p)
        {
            var playerId = p.PlayerId;

            var playerRecaps = Db.PlayerRecaps.Where(pr => pr.PlayerId == p.Id);
            Db.PlayerRecaps.RemoveRange(playerRecaps);

            var rosterSeasons = Db.RosterSeasons.Where(rs => rs.Id == p.Id);
            Db.RosterSeasons.RemoveRange(rosterSeasons);

            var playerProfiles = Db.PlayerProfiles.Where(pp => pp.PlayerId == playerId);
            Db.PlayerProfiles.RemoveRange(playerProfiles);

            Db.SaveChanges();

            // is this player on any other team in season?
            var isInSeason = Db.RosterSeasons.Where(rs => rs.PlayerId == playerId).Any();

            if (!isInSeason)
            {
                var affs = Db.PlayerSeasonAffiliationDues.Where(ps => ps.PlayerId == playerId);
                Db.PlayerSeasonAffiliationDues.RemoveRange(affs);

                Db.SaveChanges();

                var rosters = Db.Rosters.Where(r => r.Id == playerId);
                Db.Rosters.RemoveRange(rosters);

                Db.SaveChanges();
            }

            return true;
        }
        private IQueryable<Contact> GetAvailableManagers(long accountId, TeamSeason ts, string firstName, string lastName)
        {
            long affiliationId = Db.Accounts.Find(accountId).AffiliationId;

            var cIds = Db.TeamSeasonManagers.Where(tsm => tsm.TeamSeasonId == ts.Id).Select(tsm => tsm.ContactId);

            return (from rs in Db.RosterSeasons
                    join r in Db.Rosters on rs.PlayerId equals r.Id
                    join c in Db.Contacts on r.ContactId equals c.Id
                    where rs.TeamSeasonId == ts.Id && !rs.Inactive &&
                    !cIds.Contains(c.Id) &&
                    (String.IsNullOrWhiteSpace(firstName) || c.FirstName.Contains(firstName)) &&
                    (String.IsNullOrWhiteSpace(lastName) || c.LastName.Contains(lastName))
                    orderby c.LastName, c.FirstName, c.MiddleName
                    select c);
        }
    }

    public class PlayerNumberData
    {
        public String PlayerNumber { get; set; }
    }

}
