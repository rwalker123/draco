using System;
using System.Data.SqlClient;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.OData;
using ModelObjects;
using SportsManager.Models;
using System.Threading.Tasks;

namespace SportsManager.Controllers
{
    public class ContactsODataController : ODataController
    {
        internal const int PageSize = 15;

        [AcceptVerbs("GET"), HttpGet]
        [Queryable(PageSize = PageSize)]
        public IQueryable<ModelObjects.ContactName> Get(long accountId)
        {
            return DataAccess.Contacts.GetContactNames(accountId);
        }
    }

    public class ContactsAPIController : ApiController
    {
        private const String nameExistsError = "Name already exists.";
        private const String emailExistsError = "Email already exists.";

        [AcceptVerbs("GET"), HttpGet]
        public HttpResponseMessage GetContactDetails(long accountId, long id)
        {
            var contact = DataAccess.Contacts.GetContact(id);
            return Request.CreateResponse<ModelObjects.Contact>(HttpStatusCode.OK, contact);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("DoesContactNameExist")]
        public HttpResponseMessage GetDoesContactNameExist(long accountId, long id, string firstName, string lastName, string middleName)
        {
            bool doesExist = DataAccess.Contacts.DoesContactExist(accountId, id, firstName, middleName, lastName);
            return Request.CreateResponse<bool>(HttpStatusCode.OK, doesExist);
        }

        [AcceptVerbs("POST"), HttpPost]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage PostContact(long accountId, ModelObjects.Contact newContact)
        {
            newContact.CreatorAccountId = accountId;

            if (ModelState.IsValid && newContact != null)
            {
                try
                {
                    long contactId = DataAccess.Contacts.AddContact(newContact);
                    if (contactId == 0)
                        return Request.CreateResponse(HttpStatusCode.InternalServerError);

                    // Create a 201 response.
                    var response = new HttpResponseMessage(HttpStatusCode.Created)
                    {
                        Content = new StringContent(contactId.ToString())
                    };
                    response.Headers.Location =
                        new Uri(Url.Link("ActionApi", new { action = "Contacts", accountId = accountId, id = contactId }));
                    return response;
                }
                catch (SqlException ex)
                {
                    // key violation, name exists.
                    if (ex.Number == 2627)
                    {
                        return Request.CreateResponse(HttpStatusCode.Conflict, nameExistsError);
                    }
                    else if (ex.Number == 2601)
                    {
                        return Request.CreateResponse(HttpStatusCode.Conflict, emailExistsError);
                    }

                    return Request.CreateResponse(HttpStatusCode.InternalServerError);
                }
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }

        [AcceptVerbs("PUT"), HttpPut]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage ResetPassword(long accountId, long id)
        {
            ModelObjects.Contact c = DataAccess.Contacts.GetContact(id);
            if (c != null)
            {
                DataAccess.Contacts.ResetPassword(c);
                return Request.CreateResponse(HttpStatusCode.OK);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }

        [AcceptVerbs("PUT"), HttpPut]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage PutContact(long accountId, ModelObjects.Contact contact)
        {
            contact.CreatorAccountId = accountId;

            if (ModelState.IsValid && contact != null)
            {
                try
                {
                    DataAccess.Contacts.UpdateContact(contact);
                    // Create a 200 response.
                    var response = new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(contact.Id.ToString())
                    };
                    response.Headers.Location =
                        new Uri(Url.Link("ActionApi", new { action = "Contacts", accountId = accountId, id = contact.Id }));
                    return response;
                }
                catch (SqlException ex)
                {
                    // key violation, name exists.
                    if (ex.Number == 2627)
                    {
                        return Request.CreateResponse(HttpStatusCode.Conflict, nameExistsError);
                    }
                    else if (ex.Number == 2601)
                    {
                        return Request.CreateResponse(HttpStatusCode.Conflict, emailExistsError);
                    }

                    return Request.CreateResponse(HttpStatusCode.InternalServerError);
                }
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [ActionName("DeleteContact")]
        public async Task<HttpResponseMessage> DeleteContact(long accountId, long id)
        {
            var contact = DataAccess.Contacts.GetContact(id);
            if (contact != null)
            {
                if (await DataAccess.Contacts.DeleteUserAccount(contact))
                {
                    return Request.CreateResponse(HttpStatusCode.OK);
                }

                return Request.CreateResponse(HttpStatusCode.InternalServerError);
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }
    }
}
