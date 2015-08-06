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
using System.Web.Http;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class UmpireAPIController : DBApiController
    {
        private int pageSize = 20;

        public UmpireAPIController(DB db) : base(db)
        {
        }

        [AcceptVerbs("GET"), HttpGet]
        public HttpResponseMessage GetUmpires(long accountId)
        {
            var umps = Db.LeagueUmpires.Where(u => u.AccountId == accountId).OrderBy(u => u.Contact.LastName).ThenBy(u => u.Contact.FirstName).ThenBy(u => u.Contact.MiddleName);
            var vm = Mapper.Map<IEnumerable<Umpire>, UmpireViewModel[]>(umps);
            return Request.CreateResponse<UmpireViewModel[]>(HttpStatusCode.OK, vm);
        }

        [AcceptVerbs("GET"), HttpGet]
        public HttpResponseMessage AvailableUmpires(long accountId, string lastName, string firstName, int page)
        {
            long affiliationId = (from a in Db.Accounts
                                  where a.Id == accountId
                                  select a.AffiliationId).SingleOrDefault();

            var aIds = (from a in Db.Accounts
                        where a.Id == accountId || (affiliationId != 1 && a.AffiliationId == affiliationId)
                        select a.Id);

            var cIds = (from lu in Db.LeagueUmpires
                        select lu.ContactId);

            var cs = (from c in Db.Contacts
                      where aIds.Contains(c.CreatorAccountId) &&
                      !cIds.Contains(c.Id) &&
                      (String.IsNullOrWhiteSpace(firstName) || c.FirstName.Contains(firstName)) &&
                      (String.IsNullOrWhiteSpace(lastName) || c.LastName.Contains(lastName))
                      orderby c.LastName, c.FirstName, c.MiddleName
                      select c).Skip((page - 1) * pageSize).Take(pageSize);

            var vm = Mapper.Map<IEnumerable<Contact>, ContactNameViewModel[]>(cs);
            return Request.CreateResponse<ContactNameViewModel[]>(HttpStatusCode.OK, vm);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("umpire")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage AddUmpire(long accountId, long id)
        {
            var c = Db.Contacts.Find(id);
            if (c == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var dbUmp = new Umpire()
            {
                AccountId = accountId,
                Contact = c
            };

            Db.LeagueUmpires.Add(dbUmp);
            Db.SaveChanges();

            var vm = Mapper.Map<Umpire, UmpireViewModel>(dbUmp);
            return Request.CreateResponse<UmpireViewModel>(HttpStatusCode.Created, vm);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("umpire")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage DeleteUmpire(long accountId, long id)
        {
            var u = Db.LeagueUmpires.Find(id);
            if (u == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (u.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            Db.LeagueUmpires.Remove(u);
            Db.SaveChanges();

            return Request.CreateResponse(HttpStatusCode.OK);
        }
    }
}
