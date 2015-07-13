using AutoMapper;
using ModelObjects;
using SportsManager.Models;
using SportsManager.ViewModels.API;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace SportsManager.Controllers
{
    public class LeagueFAQAPIController : DBApiController
    {
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("faqs")]
        public HttpResponseMessage GetFAQs(long accountId)
        {
            var faqs = m_db.LeagueFaqs.Where(f => f.AccountId == accountId).AsEnumerable();
            
            var vm = Mapper.Map<IEnumerable<LeagueFAQItem>, FAQItemViewModel[]>(faqs); 
            return Request.CreateResponse<FAQItemViewModel[]>(HttpStatusCode.OK, vm);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("faqs")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage PostFAQ(long accountId, FAQItemViewModel faq)
        {
            if (ModelState.IsValid)
            {
                var dbFaq = new LeagueFAQItem()
                {
                    AccountId = accountId,
                    Question = faq.Question,
                    Answer = faq.Answer
                };

                m_db.LeagueFaqs.Add(dbFaq);
                m_db.SaveChanges();

                var vm = Mapper.Map<LeagueFAQItem, FAQItemViewModel>(dbFaq);
                return Request.CreateResponse<FAQItemViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("faqs")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage PutFAQ(long accountId, FAQItemViewModel faq)
        {
            if (ModelState.IsValid)
            {
                var dbFaq = m_db.LeagueFaqs.Find(faq.Id);
                if (dbFaq == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (dbFaq.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                dbFaq.Answer = faq.Answer;
                dbFaq.Question = faq.Question;

                m_db.SaveChanges();

                var vm = Mapper.Map<LeagueFAQItem, FAQItemViewModel>(dbFaq);
                return Request.CreateResponse<FAQItemViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("faqs")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage DeleteFAQ(long accountId, long id)
        {
            var faq = m_db.LeagueFaqs.Find(id);
            if (faq == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (faq.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            m_db.LeagueFaqs.Remove(faq);
            m_db.SaveChanges();

            return Request.CreateResponse<long>(HttpStatusCode.OK, id);
        }
    }
}
