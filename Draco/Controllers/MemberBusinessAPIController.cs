using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace SportsManager.Controllers
{
    public class MemberBusinessAPIController : ApiController
    {
        [AcceptVerbs("GET"), HttpGet]
        public HttpResponseMessage GetMemberBusiness(long accountId)
        {
            var sponsors = DataAccess.MemberDirectory.GetAccountMemberBusiness(accountId);
            if (sponsors != null)
            {
                return Request.CreateResponse<IQueryable<ModelObjects.Sponsor>>(HttpStatusCode.OK, sponsors);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }


    }
}
