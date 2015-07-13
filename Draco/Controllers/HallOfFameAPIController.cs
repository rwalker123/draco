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
    public class HallOfFameAPIController : DBApiController
    {
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("classes")]
        public HttpResponseMessage GetHOFClasses(long accountId)
        {
            var hofClasses = (from hof in m_db.Hofs
                              where hof.AccountId == accountId
                              orderby hof.YearInducted descending
                              group hof by hof.YearInducted into g
                              select new HOFClass()
                              {
                                  Year = g.Key,
                                  MemberCount = g.Count(),
                                  Members = null
                              }).AsEnumerable();

            if (hofClasses != null)
            {
                var vm = Mapper.Map<IEnumerable<HOFClass>, HOFClassViewModel[]>(hofClasses);
                return Request.CreateResponse<HOFClassViewModel[]>(HttpStatusCode.OK, vm);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("classmembers")]
        public HttpResponseMessage GetHOFClassMembers(long accountId, long id)
        {
            var hofMembers = (from h in m_db.Hofs
                              join c in m_db.Contacts on h.ContactId equals c.Id
                              where h.AccountId == accountId && h.YearInducted == id
                              orderby c.LastName, c.FirstName
                              select h).AsEnumerable();

            if (hofMembers != null)
            {
                var vm = Mapper.Map<IEnumerable<HOFMember>, HOFMemberViewModel[]>(hofMembers);
                return Request.CreateResponse<HOFMemberViewModel[]>(HttpStatusCode.OK, vm);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("classmembers")]
        [SportsManagerAuthorize(Roles="AccountAdmin")]
        public HttpResponseMessage PostHOFClassMembers(long accountId, HOFMemberViewModel hofMember)
        {
            if (ModelState.IsValid && hofMember != null)
            {
                hofMember.AccountId = accountId;

                bool isInHof = (from hof in m_db.Hofs
                                where hof.AccountId == accountId &&
                                hof.ContactId == hofMember.ContactId
                                select hof).Any();
                // if contact is already in hof, don't add again.
                if (isInHof)
                    return Request.CreateResponse(HttpStatusCode.Found);

                var dbHof = new HOFMember()
                {
                    AccountId = accountId,
                    ContactId = hofMember.ContactId,
                    Bio = hofMember.Biography,
                    YearInducted = hofMember.YearInducted
                };

                m_db.Hofs.Add(dbHof);
                m_db.SaveChanges();

                if (dbHof.Id > 0)
                {
                    var vm = Mapper.Map<HOFMember, HOFMemberViewModel>(dbHof);
                    return Request.CreateResponse<HOFMemberViewModel>(HttpStatusCode.OK, vm);
                }
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("Put"), HttpPut]
        [ActionName("classmembers")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage PutHOFClassMembers(long accountId, HOFMemberViewModel hofMember)
        {
            if (ModelState.IsValid && hofMember != null)
            {
                var dbHof = m_db.Hofs.Find(hofMember.Id);
                if (dbHof == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (dbHof.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                dbHof.Bio = hofMember.Biography;
                dbHof.YearInducted = hofMember.YearInducted;

                m_db.SaveChanges();

                var vm = Mapper.Map<HOFMember, HOFMemberViewModel>(dbHof);
                return Request.CreateResponse<HOFMemberViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("classmembers")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage DeleteHOFClassMember(long accountId, int id)
        {
            var hof = m_db.Hofs.Find(id);
            if (hof == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (hof.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            m_db.Hofs.Remove(hof);
            m_db.SaveChanges();

            return Request.CreateResponse(HttpStatusCode.OK);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("availableinductees")]
        public HttpResponseMessage GetAvailablePlayers(long accountId, string lastName, string firstName, int page)
        {
            int pageSize = 20;

            long affiliationId = (from a in m_db.Accounts
                                  where a.Id == accountId
                                  select a.AffiliationId).SingleOrDefault();

            var aIds = (from a in m_db.Accounts
                        where a.Id == accountId || (affiliationId != 1 && a.AffiliationId == affiliationId)
                        select a.Id);

            var hofIds = (from h in m_db.Hofs
                          where h.AccountId == accountId
                          select h.ContactId);

            var available = (from c in m_db.Contacts
                             where aIds.Contains(c.CreatorAccountId) && !hofIds.Contains(c.Id) &&
                             (String.IsNullOrWhiteSpace(firstName) || c.FirstName.Contains(firstName)) &&
                             (String.IsNullOrWhiteSpace(lastName) || c.LastName.Contains(lastName))
                             orderby c.LastName, c.FirstName, c.MiddleName
                             select c).Skip((page - 1) * pageSize).Take(pageSize).AsEnumerable();

            var vm = Mapper.Map<IEnumerable<Contact>, ContactNameViewModel[]>(available);
            return Request.CreateResponse<IEnumerable<ContactNameViewModel>>(HttpStatusCode.OK, vm);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("randommember")]
        public HttpResponseMessage GetRandomHOFMember(long accountId)
        {

            var hofMembers = m_db.Hofs.Where(h => h.AccountId == accountId);
            if (hofMembers.Any())
            {
                int count = hofMembers.Count();
                int index = new Random().Next(count);
                var hofMember = hofMembers.Skip(index).FirstOrDefault();
                if (hofMember != null)
                {
                    var vm = Mapper.Map<HOFMember, HOFMemberViewModel>(hofMember);
                    return Request.CreateResponse<HOFMemberViewModel>(HttpStatusCode.OK, vm);
                }
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }

    }
}
