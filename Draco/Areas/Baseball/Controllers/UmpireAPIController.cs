using AutoMapper;
using ModelObjects;
using SportsManager.Controllers;
using SportsManager.Models;
using SportsManager.ViewModels.API;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
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
        [ActionName("umpires")]
        public HttpResponseMessage GetUmpires(long accountId)
        {
            var umps = Db.LeagueUmpires.Where(u => u.AccountId == accountId).OrderBy(u => u.Contact.LastName).ThenBy(u => u.Contact.FirstName).ThenBy(u => u.Contact.MiddleName);
            var vm = Mapper.Map<IEnumerable<Umpire>, UmpireViewModel[]>(umps);
            return Request.CreateResponse<UmpireViewModel[]>(HttpStatusCode.OK, vm);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("AvailableUmpires")]
        public HttpResponseMessage AvailableUmpires(long accountId, [FromUri]NameSearchViewModel nsvm)
        {
            var cIds = (from lu in Db.LeagueUmpires
                        select lu.ContactId);

            var cs = (from c in Db.Contacts
                      where c.CreatorAccountId == accountId &&
                      !cIds.Contains(c.Id) &&
                      (nsvm.FirstName == null || nsvm.LastName == "" || c.FirstName.Contains(nsvm.FirstName)) &&
                      (nsvm.LastName == null || nsvm.LastName == "" || c.LastName.Contains(nsvm.LastName))
                      orderby c.LastName, c.FirstName, c.MiddleName
                      select c).Skip((nsvm.Page - 1) * pageSize).Take(pageSize);

            var vm = Mapper.Map<IEnumerable<Contact>, ContactNameViewModel[]>(cs);
            return Request.CreateResponse<ContactNameViewModel[]>(HttpStatusCode.OK, vm);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("umpires")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> AddUmpire(long accountId, long id)
        {
            var c = await Db.Contacts.FindAsync(id);
            if (c == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (c.CreatorAccountId != accountId)
                if (c == null)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

            var dbUmp = new Umpire()
            {
                AccountId = accountId,
                Contact = c
            };

            Db.LeagueUmpires.Add(dbUmp);
            await Db.SaveChangesAsync();

            var vm = Mapper.Map<Umpire, UmpireViewModel>(dbUmp);
            return Request.CreateResponse<UmpireViewModel>(HttpStatusCode.Created, vm);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("umpires")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> DeleteUmpire(long accountId, long id)
        {
            var u = await Db.LeagueUmpires.FindAsync(id);
            if (u == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (u.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            Db.LeagueUmpires.Remove(u);
            await Db.SaveChangesAsync();

            return Request.CreateResponse(HttpStatusCode.OK);
        }
    }
}
