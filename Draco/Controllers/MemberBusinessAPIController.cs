using AutoMapper;
using ModelObjects;
using SportsManager.Models.Utils;
using SportsManager.ViewModels.API;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace SportsManager.Controllers
{
    public class MemberBusinessAPIController : DBApiController
    {
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("memberbusinesses")]
        public HttpResponseMessage GetMemberBusiness(long accountId)
        {
            long seasonId = (from cs in m_db.CurrentSeasons
                             where cs.AccountId == accountId
                             select cs.SeasonId).SingleOrDefault();

            var memBus = (from mb in m_db.MemberBusinesses
                    join c in m_db.Contacts on mb.ContactId equals c.Id
                    join r in m_db.Rosters on c.Id equals r.ContactId
                    join rs in m_db.RosterSeasons on r.Id equals rs.PlayerId
                    join ts in m_db.TeamsSeasons on rs.TeamSeasonId equals ts.Id
                    join ls in m_db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                    where ls.SeasonId == seasonId
                    orderby mb.Name
                    select mb).AsEnumerable();

            if (memBus != null)
            {
                var vm = Mapper.Map<IEnumerable<MemberBusiness>, SponsorViewModel[]>(memBus);
                return Request.CreateResponse<SponsorViewModel[]>(HttpStatusCode.OK, vm);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("userbusiness")]
        public HttpResponseMessage GetMemberBusiness(long accountId, long id)
        {
            var userBusiness = m_db.MemberBusinesses.Where(mb => mb.ContactId == id).SingleOrDefault();
            if (userBusiness != null)
            {
                var vm = Mapper.Map<MemberBusiness, SponsorViewModel>(userBusiness);
                return Request.CreateResponse<SponsorViewModel>(HttpStatusCode.OK, vm);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }


        [AcceptVerbs("POST"), HttpPost]
        public HttpResponseMessage PostMemberBusiness(long accountId, SponsorViewModel sponsor)
        {
            if (ModelState.IsValid)
            {
                Contact contact = GetCurrentContact();
                if (contact == null)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                sponsor.ContactId = contact.Id;

                var dbSponsor = (from mb in m_db.MemberBusinesses
                                 where mb.ContactId == sponsor.ContactId
                                 select mb).SingleOrDefault();
                if (dbSponsor != null)
                    return Request.CreateResponse(HttpStatusCode.BadRequest);

                dbSponsor = new MemberBusiness()
                {
                    ContactId = sponsor.ContactId,
                    Name = sponsor.Name,
                    CityStateZip = sponsor.CityStateZip,
                    Description = sponsor.Description,
                    EMail = sponsor.EMail,
                    Fax = sponsor.Fax,
                    Phone = sponsor.Phone,
                    StreetAddress = sponsor.StreetAddress,
                    WebSite = sponsor.Website
                };

                if (!String.IsNullOrEmpty(dbSponsor.WebSite) && !dbSponsor.WebSite.StartsWith("http", StringComparison.InvariantCultureIgnoreCase))
                {
                    dbSponsor.WebSite = dbSponsor.WebSite.Insert(0, "http://");
                }

                m_db.MemberBusinesses.Add(dbSponsor);
                m_db.SaveChanges();

                var vm = Mapper.Map<MemberBusiness, SponsorViewModel>(dbSponsor);
                return Request.CreateResponse<SponsorViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("business")]
        public HttpResponseMessage PutMemberBusiness(long accountId, long id, SponsorViewModel item)
        {
            if (ModelState.IsValid)
            {
                var mb = m_db.MemberBusinesses.Find(id);
                if (mb == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                Contact contact = GetCurrentContact();
                if (contact == null || mb.ContactId != contact.Id)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                mb.Name = item.Name;
                mb.CityStateZip = item.CityStateZip;
                mb.Description = item.Description;
                mb.EMail = item.EMail;
                mb.Fax = item.Fax;
                mb.Phone = item.Phone;
                mb.StreetAddress = item.StreetAddress;
                mb.WebSite = item.Website;
                if (!String.IsNullOrEmpty(mb.WebSite) && !mb.WebSite.StartsWith("http", StringComparison.InvariantCultureIgnoreCase))
                {
                    mb.WebSite = mb.WebSite.Insert(0, "http://");
                }

                m_db.SaveChanges();

                var vm = Mapper.Map<MemberBusiness, SponsorViewModel>(mb);
                return Request.CreateResponse<SponsorViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }


        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("business")]
        public async Task<HttpResponseMessage> DeleteMemberBusiness(long accountId, long id)
        {
            var dbSponsor = m_db.MemberBusinesses.Find(id);
            if (dbSponsor == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            string userId = Globals.GetCurrentUserId();

            if (!IsAccountAdmin(accountId, userId))
            {
                Contact contact = GetCurrentContact();
                if (contact == null || dbSponsor.ContactId != contact.Id)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);
            }

            m_db.MemberBusinesses.Remove(dbSponsor);
            m_db.SaveChanges();

            Sponsor s = new Sponsor()
            {
                Id = id,
                AccountId = accountId
            };
            await Storage.Provider.DeleteFile(s.LogoURL);

            return Request.CreateResponse(HttpStatusCode.OK);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("randomuserbusiness")]
        public HttpResponseMessage RandomMemberBusiness(long accountId)
        {
            var qry = (from cs in m_db.CurrentSeasons
                       join ls in m_db.LeagueSeasons on cs.SeasonId equals ls.SeasonId
                       join ts in m_db.TeamsSeasons on ls.Id equals ts.LeagueSeasonId
                       join rs in m_db.RosterSeasons on ts.Id equals rs.TeamSeasonId
                       join r in m_db.Rosters on rs.PlayerId equals r.Id
                       join c in m_db.Contacts on r.ContactId equals c.Id
                       join mbu in m_db.MemberBusinesses on c.Id equals mbu.ContactId
                       where cs.AccountId == accountId && !rs.Inactive && mbu.Id != 0 &&
                       c.CreatorAccountId == accountId
                       select mbu);

            int count = qry.Count();
            int index = new Random().Next(count);

            var mb = qry.Skip(index).FirstOrDefault();

            if (mb != null)
            {
                var vm = Mapper.Map<MemberBusiness, SponsorViewModel>(mb);
                return Request.CreateResponse<SponsorViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }
    }
}
