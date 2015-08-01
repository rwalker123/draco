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
    public class UserRolesAPIController : DBApiController
    {
        private int pageSize = 20;

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("SearchContacts")]
        public HttpResponseMessage SearchContacts(long accountId, string lastName, string firstName, int page)
        {
            var foundItems = (from c in m_db.Contacts
                              where c.CreatorAccountId == accountId &&
                              (String.IsNullOrWhiteSpace(firstName) || c.FirstName.Contains(firstName)) &&
                              (String.IsNullOrWhiteSpace(lastName) || c.LastName.Contains(lastName))
                              orderby c.LastName, c.FirstName, c.MiddleName
                              select c).Skip((page - 1) * pageSize).Take(pageSize);

            var vm = Mapper.Map<IEnumerable<Contact>, ContactNameViewModel[]>(foundItems);
            return Request.CreateResponse<ContactNameViewModel[]>(HttpStatusCode.OK, vm);
        }

        [AcceptVerbs("GET"), HttpGet]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage AdminsForRole(long accountId, string id)
        {
            var roleId = id;
            IEnumerable<ContactRole> foundItems = null;

            // account admins are not bound by seasons.
            if (roleId == GetAdminAccountId() || roleId == GetAccountPhotoAdminId())
            {
                foundItems = (from cr in m_db.ContactRoles
                        join c in m_db.Contacts on cr.ContactId equals c.Id
                        where cr.AccountId == accountId && cr.RoleId == roleId
                        select cr).AsEnumerable();
            }
            else if (roleId == GetLeagueAdminId())
            {
                long currentSeason = GetCurrentSeasonId(accountId);

                foundItems = (from cr in m_db.ContactRoles
                        join c in m_db.Contacts on cr.ContactId equals c.Id
                        join ls in m_db.LeagueSeasons on cr.RoleData equals ls.Id
                        where cr.AccountId == accountId && cr.RoleId == roleId &&
                        ls.Id == cr.RoleData && ls.SeasonId == currentSeason
                        select cr).AsEnumerable();
            }
            else if (roleId == GetTeamAdminId() || roleId == GetTeamPhotoAdminId())
            {
                long currentSeason = GetCurrentSeasonId(accountId);

                foundItems = (from cr in m_db.ContactRoles
                        join c in m_db.Contacts on cr.ContactId equals c.Id
                        join ts in m_db.TeamsSeasons on cr.RoleData equals ts.Id
                        join ls in m_db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                        where cr.AccountId == accountId && cr.RoleId == roleId &&
                        ts.Id == cr.RoleData && ls.SeasonId == currentSeason
                        select cr).AsEnumerable();
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }

            var vm = Mapper.Map<IEnumerable<ContactRole>, ContactNameRoleViewModel[]>(foundItems);
            return Request.CreateResponse<ContactNameRoleViewModel[]>(HttpStatusCode.OK, vm);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("AddToRole")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage AddToRole(long accountId, ContactRoleViewModel roleData)
        {
            if (ModelState.IsValid)
            {
                var dbRole = (from cr in m_db.ContactRoles
                              where cr.AccountId == accountId && cr.ContactId == roleData.ContactId &&
                              cr.RoleId == roleData.RoleId && cr.RoleData == roleData.RoleData
                              select cr).SingleOrDefault();

                if (dbRole == null)
                {
                    dbRole = new ContactRole()
                    {
                        AccountId = accountId,
                        ContactId = roleData.ContactId,
                        RoleId = roleData.RoleId,
                        RoleData = roleData.RoleData
                    };

                    m_db.ContactRoles.Add(dbRole);
                    m_db.SaveChanges();
                }

                var newRole = ContactNameFromRole(accountId, dbRole.RoleId, dbRole.RoleData, dbRole.ContactId);

                // Create a 201 response.
                var response = Request.CreateResponse<ContactNameRoleViewModel>(HttpStatusCode.Created, newRole);
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "ContactRole", accountId = accountId, id = dbRole.Id }));

                return response;

            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("DELETE"), HttpDelete]
        public HttpResponseMessage DeleteFromRole(long accountId, ContactRoleViewModel info)
        {
            if (!String.IsNullOrEmpty(info.RoleId))
            {
                var dbContactRole = (from cr in m_db.ContactRoles
                                     where cr.AccountId == accountId && cr.RoleId == info.RoleId && 
                                     cr.ContactId == info.ContactId && cr.RoleData == info.RoleData
                                     select cr).SingleOrDefault();

                if (dbContactRole == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                m_db.ContactRoles.Remove(dbContactRole);
                m_db.SaveChanges();

                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(info.RoleId.ToString())
                };

                return response;
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        protected ContactNameRoleViewModel ContactNameFromRole(long accountId, string roleId, long roleData, long contactId)
        {
            ContactRole role = null;

            // account admins are not bound by seasons.
            if (roleId == GetAdminAccountId() || roleId == GetAccountPhotoAdminId())
            {
                role = (from cr in m_db.ContactRoles
                        join c in m_db.Contacts on cr.ContactId equals c.Id
                        where cr.AccountId == accountId && cr.RoleId == roleId &&
                        c.Id == contactId
                        select cr).SingleOrDefault();
            }
            else if (roleId == GetLeagueAdminId())
            {
                long currentSeason = GetCurrentSeasonId(accountId);

                role = (from cr in m_db.ContactRoles
                        join c in m_db.Contacts on cr.ContactId equals c.Id
                        join ls in m_db.LeagueSeasons on cr.RoleData equals ls.Id
                        where cr.AccountId == accountId && cr.RoleId == roleId &&
                        cr.RoleData == roleData && ls.SeasonId == currentSeason &&
                        c.Id == contactId
                        select cr).SingleOrDefault();
            }
            else if (roleId == GetTeamAdminId() || roleId == GetTeamPhotoAdminId())
            {
                long currentSeason = GetCurrentSeasonId(accountId);

                role = (from cr in m_db.ContactRoles
                        join c in m_db.Contacts on cr.ContactId equals c.Id
                        join ts in m_db.TeamsSeasons on cr.RoleData equals ts.Id
                        join ls in m_db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                        where cr.AccountId == accountId && cr.RoleId == roleId &&
                        cr.RoleData == roleData && ls.SeasonId == currentSeason &&
                        c.Id == contactId
                        select cr).SingleOrDefault();

            }
            else
            {
                return null;
            }

            return Mapper.Map<ContactRole, ContactNameRoleViewModel>(role);
        }
    }
}
