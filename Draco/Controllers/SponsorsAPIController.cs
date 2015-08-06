using AutoMapper;
using ModelObjects;
using SportsManager.Models;
using SportsManager.ViewModels.API;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace SportsManager.Controllers
{
    public class SponsorsAPIController : DBApiController
    {
        public SponsorsAPIController(DB db) : base(db)
        {
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("sponsors")]
        public HttpResponseMessage GetSponsors(long accountId)
        {
            var sponsors = (from s in Db.Sponsors
                            where s.AccountId == accountId && s.TeamId == 0
                            select s).AsEnumerable();

            if (sponsors != null)
            {
                var vm = Mapper.Map<IEnumerable<Sponsor>, SponsorViewModel[]>(sponsors);
                return Request.CreateResponse<SponsorViewModel[]>(HttpStatusCode.OK, vm);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("teamsponsor")]
        public HttpResponseMessage GetSponsors(long accountId, long teamSeasonId)
        {
            var teamSeason = Db.TeamsSeasons.Find(teamSeasonId);
            if (teamSeason == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var team = teamSeason.Team;
            if (team == null)
                return Request.CreateResponse(HttpStatusCode.InternalServerError);

            if (team.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            var sponsors = team.Sponsors; 
            if (sponsors != null)
            {
                var vm = Mapper.Map<IEnumerable<Sponsor>, SponsorViewModel[]>(sponsors.AsEnumerable());
                return Request.CreateResponse<SponsorViewModel[]>(HttpStatusCode.OK, vm);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }

        [AcceptVerbs("PUT"), HttpPut]
        [SportsManagerAuthorize(Roles="AccountAdmin")]
        [ActionName("sponsors")]
        public HttpResponseMessage PutSponsors(long accountId, long id, SponsorViewModel sponsor)
        {
            if (ModelState.IsValid)
            {
                var dbSponsor = Db.Sponsors.Find(id);
                if (dbSponsor == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (dbSponsor.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                dbSponsor.Description = sponsor.Description ?? String.Empty;
                dbSponsor.Name = sponsor.Name;
                dbSponsor.EMail = sponsor.EMail ?? String.Empty;
                dbSponsor.Fax = sponsor.Fax ?? String.Empty;
                dbSponsor.CityStateZip = sponsor.CityStateZip ?? String.Empty;
                dbSponsor.Phone = sponsor.Phone ?? String.Empty;
                dbSponsor.StreetAddress = sponsor.StreetAddress ?? String.Empty;
                dbSponsor.WebSite = sponsor.Website ?? String.Empty;
                if (!String.IsNullOrEmpty(dbSponsor.WebSite) && !dbSponsor.WebSite.StartsWith("http", StringComparison.InvariantCultureIgnoreCase))
                {
                    dbSponsor.WebSite = dbSponsor.WebSite.Insert(0, "http://");
                }

                Db.SaveChanges();

                var vm = Mapper.Map<Sponsor, SponsorViewModel>(dbSponsor);
                return Request.CreateResponse<SponsorViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("POST"), HttpPost]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [ActionName("sponsors")]
        public HttpResponseMessage PostSponsors(long accountId, SponsorViewModel sponsor)
        {
            if (ModelState.IsValid)
            {
                var dbSponsor = new Sponsor()
                {
                    AccountId = accountId,
                    Description = sponsor.Description ?? String.Empty,
                    Name = sponsor.Name,
                    EMail = sponsor.EMail ?? String.Empty,
                    Fax = sponsor.Fax ?? String.Empty,
                    CityStateZip = sponsor.CityStateZip ?? String.Empty,
                    Phone = sponsor.Phone ?? String.Empty,
                    StreetAddress = sponsor.StreetAddress ?? String.Empty,
                    TeamId = 0,
                    WebSite = sponsor.Website ?? String.Empty
                };

                if (!String.IsNullOrEmpty(dbSponsor.WebSite) && !dbSponsor.WebSite.StartsWith("http", StringComparison.InvariantCultureIgnoreCase))
                {
                    dbSponsor.WebSite = dbSponsor.WebSite.Insert(0, "http://");
                }

                Db.Sponsors.Add(dbSponsor);
                Db.SaveChanges();

                var vm = Mapper.Map<Sponsor, SponsorViewModel>(dbSponsor);
                return Request.CreateResponse<SponsorViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [ActionName("sponsors")]
        public HttpResponseMessage DeleteSponsors(long accountId, long id)
        {
            var sponsor = Db.Sponsors.Find(id);
            if (sponsor == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (sponsor.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            Db.Sponsors.Remove(sponsor);
            Db.SaveChanges();

            return Request.CreateResponse<long>(HttpStatusCode.OK, id);
        }


        [AcceptVerbs("PUT"), HttpPut]
        [SportsManagerAuthorize(Roles = "AccountAdmin, TeamAdmin")]
        [ActionName("teamsponsor")]
        public HttpResponseMessage PutSponsors(long accountId, long teamSeasonId, long id, SponsorViewModel sponsor)
        {
            if (ModelState.IsValid)
            {
                var teamSeason = Db.TeamsSeasons.Find(teamSeasonId);
                if (teamSeason == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                var team = teamSeason.Team;
                if (team == null)
                    return Request.CreateResponse(HttpStatusCode.InternalServerError);

                if (team.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                var dbSponsor = Db.Sponsors.Find(id);
                if (dbSponsor == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (dbSponsor.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                if (dbSponsor.TeamId != team.Id)
                    return Request.CreateResponse(HttpStatusCode.BadRequest);

                dbSponsor.Description = sponsor.Description ?? String.Empty;
                dbSponsor.Name = sponsor.Name;
                dbSponsor.EMail = sponsor.EMail ?? String.Empty;
                dbSponsor.Fax = sponsor.Fax ?? String.Empty;
                dbSponsor.CityStateZip = sponsor.CityStateZip ?? String.Empty;
                dbSponsor.Phone = sponsor.Phone ?? String.Empty;
                dbSponsor.StreetAddress = sponsor.StreetAddress ?? String.Empty;
                dbSponsor.WebSite = sponsor.Website ?? String.Empty;
                if (!String.IsNullOrEmpty(dbSponsor.WebSite) && !dbSponsor.WebSite.StartsWith("http", StringComparison.InvariantCultureIgnoreCase))
                {
                    dbSponsor.WebSite = dbSponsor.WebSite.Insert(0, "http://");
                }

                Db.SaveChanges();

                var vm = Mapper.Map<Sponsor, SponsorViewModel>(dbSponsor);
                return Request.CreateResponse<SponsorViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("POST"), HttpPost]
        [SportsManagerAuthorize(Roles = "AccountAdmin, TeamAdmin")]
        [ActionName("teamsponsor")]
        public HttpResponseMessage PostSponsors(long accountId, long teamSeasonId, SponsorViewModel sponsor)
        {
            if (ModelState.IsValid && sponsor != null)
            {
                var teamSeason = Db.TeamsSeasons.Find(teamSeasonId);
                if (teamSeason == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                var team = teamSeason.Team;
                if (team == null)
                    return Request.CreateResponse(HttpStatusCode.InternalServerError);

                if (team.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                var dbSponsor = new Sponsor()
                {
                    AccountId = accountId,
                    Description = sponsor.Description ?? String.Empty,
                    Name = sponsor.Name,
                    EMail = sponsor.EMail ?? String.Empty,
                    Fax = sponsor.Fax ?? String.Empty,
                    CityStateZip = sponsor.CityStateZip ?? String.Empty,
                    Phone = sponsor.Phone ?? String.Empty,
                    StreetAddress = sponsor.StreetAddress ?? String.Empty,
                    TeamId = teamSeasonId,
                    WebSite = sponsor.Website ?? String.Empty
                };

                if (!String.IsNullOrEmpty(dbSponsor.WebSite) && !dbSponsor.WebSite.StartsWith("http", StringComparison.InvariantCultureIgnoreCase))
                {
                    dbSponsor.WebSite = dbSponsor.WebSite.Insert(0, "http://");
                }

                Db.Sponsors.Add(dbSponsor);
                Db.SaveChanges();

                var vm = Mapper.Map<Sponsor, SponsorViewModel>(dbSponsor);
                return Request.CreateResponse<SponsorViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [SportsManagerAuthorize(Roles = "AccountAdmin, TeamAdmin")]
        [ActionName("teamsponsor")]
        public HttpResponseMessage DeleteSponsors(long accountId, long teamSeasonId, long id)
        {
            var sponsor = Db.Sponsors.Find(id);
            if (sponsor == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var teamSeason = Db.TeamsSeasons.Find(teamSeasonId);
            if (teamSeason == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var team = teamSeason.Team;
            if (team == null)
                return Request.CreateResponse(HttpStatusCode.InternalServerError);

            if (team.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            if (sponsor.TeamId != team.Id)
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            if (sponsor.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            Db.Sponsors.Remove(sponsor);
            Db.SaveChanges();

            return Request.CreateResponse<long>(HttpStatusCode.OK, id);
        }
    }
}
