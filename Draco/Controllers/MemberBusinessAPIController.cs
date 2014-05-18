using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace SportsManager.Controllers
{
    public class MemberBusinessAPIController : ApiController
    {
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("memberbusinesses")]
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

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("userbusiness")]
        public HttpResponseMessage GetMemberBusiness(long accountId, long id)
        {
            var userBusiness = DataAccess.MemberDirectory.GetMemberBusinessFromContact(id);
            if (userBusiness != null)
            {
                return Request.CreateResponse<ModelObjects.Sponsor>(HttpStatusCode.OK, userBusiness);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }


        [AcceptVerbs("POST"), HttpPost]
        public HttpResponseMessage PostMemberBusiness(long accountId, ModelObjects.Sponsor sponsor)
        {
            if (accountId <= 0)
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            sponsor.AccountId = accountId;

            sponsor.ContactId = DataAccess.Contacts.GetContactId(Globals.GetCurrentUserId());
            if (sponsor.ContactId <= 0)
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            if (ModelState.IsValid && sponsor != null)
            {
                var sponsorId = DataAccess.MemberDirectory.AddMemberBusiness(sponsor);
                if (sponsorId > 0)
                {
                    sponsor.Id = sponsorId;
                    return Request.CreateResponse<ModelObjects.Sponsor>(HttpStatusCode.OK, sponsor);
                }
                else
                {
                    return Request.CreateResponse(HttpStatusCode.NotFound);
                }
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("business")]
        public HttpResponseMessage PutMemberBusiness(long accountId, long id, ModelObjects.Sponsor sponsor)
        {
            if (accountId <= 0 || id <= 0)
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            sponsor.AccountId = accountId;
            sponsor.Id = id;

            sponsor.ContactId = DataAccess.Contacts.GetContactId(Globals.GetCurrentUserId());
            if (sponsor.ContactId <= 0)
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            if (ModelState.IsValid && sponsor != null)
            {
                var updated = DataAccess.MemberDirectory.ModifyMemberBusiness(sponsor);
                if (updated)
                {
                    return Request.CreateResponse<ModelObjects.Sponsor>(HttpStatusCode.OK, sponsor);
                }
                else
                {
                    return Request.CreateResponse(HttpStatusCode.NotFound);
                }
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }


        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("business")]
        public async Task<HttpResponseMessage> DeleteMemberBusiness(long accountId, long id)
        {
            if (accountId <= 0 || id <= 0)
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            var deleted = await DataAccess.MemberDirectory.RemoveMemberBusiness(accountId, id);
            if (deleted)
            {
                return Request.CreateResponse(HttpStatusCode.OK);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("randomuserbusiness")]
        public HttpResponseMessage RandomMemberBusiness(long accountId)
        {
            var userBusiness = DataAccess.MemberDirectory.GetRandomMemberBusiness(accountId);
            if (userBusiness != null)
            {
                return Request.CreateResponse<ModelObjects.Sponsor>(HttpStatusCode.OK, userBusiness);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }


    }
}
