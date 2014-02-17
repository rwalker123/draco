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
    }
}
