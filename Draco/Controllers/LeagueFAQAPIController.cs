using SportsManager.Models;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace SportsManager.Controllers
{
    public class LeagueFAQAPIController : ApiController
    {
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("faqs")]
        public HttpResponseMessage GetFAQs(long accountId)
        {
            var faqs = DataAccess.LeagueFAQ.GetFAQ(accountId);
            return Request.CreateResponse<IQueryable<ModelObjects.LeagueFAQItem>>(HttpStatusCode.OK, faqs);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("faqs")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage PostFAQ(long accountId, ModelObjects.LeagueFAQItem faq)
        {
            faq.AccountId = accountId;

            if (ModelState.IsValid && faq != null)
            {
                var faqAdded = DataAccess.LeagueFAQ.AddFAQ(faq);
                if (faqAdded)
                {
                    return Request.CreateResponse<ModelObjects.LeagueFAQItem>(HttpStatusCode.OK, faq);
                }
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("faqs")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage PutFAQ(long accountId, ModelObjects.LeagueFAQItem faq)
        {
            faq.AccountId = accountId;

            if (ModelState.IsValid && faq != null)
            {
                var faqUpdated = DataAccess.LeagueFAQ.ModifyFAQ(faq);
                if (faqUpdated)
                {
                    return Request.CreateResponse<ModelObjects.LeagueFAQItem>(HttpStatusCode.OK, faq);
                }
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("faqs")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage DeleteFAQ(long accountId, long id)
        {
            var faqRemoved = DataAccess.LeagueFAQ.RemoveFAQ(id);
            if (faqRemoved)
            {
                return Request.CreateResponse<long>(HttpStatusCode.OK, id);
            }
            return Request.CreateResponse(HttpStatusCode.NotFound);
        }
    }
}
