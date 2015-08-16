using AutoMapper;
using AutoMapper.QueryableExtensions;
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
        public MemberBusinessAPIController(DB db) : base(db)
        {
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("memberbusinesses")]
        public HttpResponseMessage GetMemberBusiness(long accountId)
        {
            long seasonId = this.GetCurrentSeasonId(accountId);

            var vm = (from mb in Db.MemberBusinesses
                    join c in Db.Contacts on mb.ContactId equals c.Id
                    join r in Db.Rosters on c.Id equals r.ContactId
                    join rs in Db.RosterSeasons on r.Id equals rs.PlayerId
                    join ts in Db.TeamsSeasons on rs.TeamSeasonId equals ts.Id
                    join ls in Db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                    where ls.SeasonId == seasonId
                    orderby mb.Name
                    select mb).Distinct().Project<MemberBusiness>().To<SponsorViewModel>();

            return Request.CreateResponse<IEnumerable<SponsorViewModel>>(HttpStatusCode.OK, vm);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("userbusiness")]
        public HttpResponseMessage GetMemberBusiness(long accountId, long id)
        {
            var userBusiness = Db.MemberBusinesses.Where(mb => mb.ContactId == id).SingleOrDefault();
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
                Contact contact = this.GetCurrentContact();
                if (contact == null)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                sponsor.ContactId = contact.Id;

                var dbSponsor = (from mb in Db.MemberBusinesses
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

                Db.MemberBusinesses.Add(dbSponsor);
                Db.SaveChanges();

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
                var mb = Db.MemberBusinesses.Find(id);
                if (mb == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                Contact contact = this.GetCurrentContact();
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

                Db.SaveChanges();

                var vm = Mapper.Map<MemberBusiness, SponsorViewModel>(mb);
                return Request.CreateResponse<SponsorViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }


        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("business")]
        public async Task<HttpResponseMessage> DeleteMemberBusiness(long accountId, long id)
        {
            var dbSponsor = Db.MemberBusinesses.Find(id);
            if (dbSponsor == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            string userId = Globals.GetCurrentUserId();

            if (!this.IsAccountAdmin(accountId, userId))
            {
                Contact contact = this.GetCurrentContact();
                if (contact == null || dbSponsor.ContactId != contact.Id)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);
            }

            Db.MemberBusinesses.Remove(dbSponsor);
            Db.SaveChanges();

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
            var qry = (from cs in Db.CurrentSeasons
                       join ls in Db.LeagueSeasons on cs.SeasonId equals ls.SeasonId
                       join ts in Db.TeamsSeasons on ls.Id equals ts.LeagueSeasonId
                       join rs in Db.RosterSeasons on ts.Id equals rs.TeamSeasonId
                       join r in Db.Rosters on rs.PlayerId equals r.Id
                       join c in Db.Contacts on r.ContactId equals c.Id
                       join mbu in Db.MemberBusinesses on c.Id equals mbu.ContactId
                       where cs.AccountId == accountId && !rs.Inactive && mbu.Id != 0 &&
                       c.CreatorAccountId == accountId
                       select mbu);

            int count = qry.Count();
            int index = new Random().Next(count);

            var mb = qry.OrderBy(mbu => mbu.Id).Skip(index).FirstOrDefault();

            if (mb != null)
            {
                var vm = Mapper.Map<MemberBusiness, SponsorViewModel>(mb);
                return Request.CreateResponse<SponsorViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }
    }
}
