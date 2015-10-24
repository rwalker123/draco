using AutoMapper;
using ModelObjects;
using SportsManager.Models;
using SportsManager.ViewModels.API;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace SportsManager.Controllers
{
    public class LeagueFAQAPIController : DBApiController
    {
        public LeagueFAQAPIController(DB db) : base(db)
        {
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("faqs")]
        public HttpResponseMessage GetFAQs(long accountId)
        {
            var faqs = Db.LeagueFaqs.Where(f => f.AccountId == accountId).AsEnumerable();
            
            var vm = Mapper.Map<IEnumerable<LeagueFAQItem>, FAQItemViewModel[]>(faqs); 
            return Request.CreateResponse<FAQItemViewModel[]>(HttpStatusCode.OK, vm);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("faqs")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> PostFAQ(long accountId, FAQItemViewModel faq)
        {
            if (ModelState.IsValid)
            {
                var dbFaq = new LeagueFAQItem()
                {
                    AccountId = accountId,
                    Question = faq.Question,
                    Answer = faq.Answer
                };

                Db.LeagueFaqs.Add(dbFaq);
                await Db.SaveChangesAsync();

                var vm = Mapper.Map<LeagueFAQItem, FAQItemViewModel>(dbFaq);
                return Request.CreateResponse<FAQItemViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("faqs")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> PutFAQ(long accountId, FAQItemViewModel faq)
        {
            if (ModelState.IsValid)
            {
                var dbFaq = await Db.LeagueFaqs.FindAsync(faq.Id);
                if (dbFaq == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (dbFaq.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                dbFaq.Answer = faq.Answer;
                dbFaq.Question = faq.Question;

                await Db.SaveChangesAsync();

                var vm = Mapper.Map<LeagueFAQItem, FAQItemViewModel>(dbFaq);
                return Request.CreateResponse<FAQItemViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("faqs")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> DeleteFAQ(long accountId, long id)
        {
            var faq = await Db.LeagueFaqs.FindAsync(id);
            if (faq == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (faq.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            Db.LeagueFaqs.Remove(faq);
            await Db.SaveChangesAsync();

            return Request.CreateResponse<long>(HttpStatusCode.OK, id);
        }
    }
}
