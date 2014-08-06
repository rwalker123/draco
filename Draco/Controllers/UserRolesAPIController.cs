using SportsManager.Models;
using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using ModelObjects;

namespace SportsManager.Controllers
{
    public class UserRolesAPIController : ApiController
    {
        private int pageSize = 20;

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("SearchContacts")]
        public HttpResponseMessage SearchContacts(long accountId, string lastName, string firstName, int page)
        {
            var foundItems = DataAccess.Contacts.FindContacts(accountId, firstName, lastName).Skip((page - 1) * pageSize).Take(pageSize);

           return Request.CreateResponse<IQueryable<ModelObjects.ContactName>>(HttpStatusCode.OK, foundItems);
        }

        [AcceptVerbs("GET"), HttpGet]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage AdminsForRole(long accountId, string id)
        {
            var foundItems = DataAccess.ContactRoles.ContactNamesFromRole(accountId, id);
            return Request.CreateResponse<IQueryable<ModelObjects.ContactNameRole>>(HttpStatusCode.OK, foundItems);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("AddToRole")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage AddToRole(long accountId, SportsManager.Model.ContactRole cr)
        {
            if (ModelState.IsValid && cr != null)
            {
                long id = DataAccess.ContactRoles.AddContactRole(accountId, cr);
                if (id == 0)
                    return Request.CreateResponse(HttpStatusCode.BadRequest);

                var newRole = DataAccess.ContactRoles.ContactNameFromRole(accountId, cr.RoleId, cr.RoleData, cr.ContactId);

                // Create a 201 response.
                var response = Request.CreateResponse<ContactNameRole>(HttpStatusCode.Created, newRole);
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "ContactRole", accountId = accountId, id = id }));

                return response;
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("DELETE"), HttpDelete]
        public HttpResponseMessage DeleteFromRole(long accountId, RoleInfo info)
        {
            if (!String.IsNullOrEmpty(info.RoleId))
            {
                DataAccess.ContactRoles.RemoveContactRole(accountId, info.RoleId, info.ContactId, info.RoleData);

                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(info.RoleId.ToString())
                };

                return response;
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }
    }
}
