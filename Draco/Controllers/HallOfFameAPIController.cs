using ModelObjects;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace SportsManager.Controllers
{
    public class HallOfFameAPIController : ApiController
    {
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("classes")]
        public HttpResponseMessage GetHOFClasses(long accountId)
        {
            var hofClasses = DataAccess.HOFMembers.GetClassYears(accountId);
            if (hofClasses != null)
            {
                return Request.CreateResponse<IQueryable<ModelObjects.HOFClass>>(HttpStatusCode.OK, hofClasses);
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
            var hofMembers = DataAccess.HOFMembers.GetClassMembers(accountId, id);
            if (hofMembers != null)
            {
                return Request.CreateResponse<IQueryable<ModelObjects.HOFMember>>(HttpStatusCode.OK, hofMembers);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("classmembers")]
        public HttpResponseMessage PostHOFClassMembers(long accountId, HOFMember hofMember)
        {
            hofMember.AccountId = accountId;

            if (ModelState.IsValid && hofMember != null)
            {
                hofMember.Id = DataAccess.HOFMembers.AddMember(hofMember);
                if (hofMember.Id > 0)
                    return Request.CreateResponse<ModelObjects.HOFMember>(HttpStatusCode.OK, hofMember);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

    }
}
