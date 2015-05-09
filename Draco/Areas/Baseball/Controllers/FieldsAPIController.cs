using SportsManager.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace SportsManager.Baseball.Controllers
{
    public class FieldsAPIController : ApiController
    {
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("fields")]
        public HttpResponseMessage GetFields(long accountId)
        {
            var fields = DataAccess.Fields.GetFields(accountId);
            if (fields != null)
            {
                return Request.CreateResponse<IEnumerable<ModelObjects.Field>>(HttpStatusCode.OK, fields);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }

        [AcceptVerbs("POST"), HttpPost]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [ActionName("fields")]
        public HttpResponseMessage PostField(long accountId, ModelObjects.Field f)
        {
            f.AccountId = accountId;

            if (ModelState.IsValid && f != null)
            {
                var fieldId = DataAccess.Fields.AddField(f);
                if (fieldId > 0)
                {
                    return Request.CreateResponse<ModelObjects.Field>(HttpStatusCode.Created, f);
                }
                else
                    return Request.CreateResponse(HttpStatusCode.InternalServerError);

            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [ActionName("fields")]
        public HttpResponseMessage PutField(long accountId, ModelObjects.Field f)
        {
            f.AccountId = accountId;

            if (ModelState.IsValid && f != null)
            {
                var success = DataAccess.Fields.ModifyField(f);
                if (success)
                {
                    return Request.CreateResponse<ModelObjects.Field>(HttpStatusCode.OK, f);
                }
                else
                    return Request.CreateResponse(HttpStatusCode.NotFound);

            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        // "field" is a stupid dummy action, I couldn't get it to work
        // with FieldsAPI/accountId/Id even though WebApiConfig
        // has a route for it. I think because of "default" id
        // it was matching the action route.
        [ActionName("fields")]
        public HttpResponseMessage DeleteField(long accountId, long id)
        {
            var success = DataAccess.Fields.RemoveField(id);
            if (success)
            {
                return Request.CreateResponse(HttpStatusCode.OK);
            }
            else
                return Request.CreateResponse(HttpStatusCode.NotFound);
        }
    }
}
