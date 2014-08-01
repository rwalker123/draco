using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using SportsManager.Models;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class UmpireAPIController : ApiController
    {
        private int pageSize = 20;

        [AcceptVerbs("GET"), HttpGet]
        public HttpResponseMessage GetUmpires(long accountId)
        {
            var umps = DataAccess.Umpires.GetUmpires(accountId);
            return Request.CreateResponse<IQueryable<ModelObjects.Umpire>>(HttpStatusCode.OK, umps);
        }

        [AcceptVerbs("GET"), HttpGet]
        public HttpResponseMessage AvailableUmpires(long accountId, string lastName, string firstName, int page)
        {
            var availableUmpires = DataAccess.Umpires.GetAvailableUmpires(accountId, firstName, lastName).Skip((page - 1) * pageSize).Take(pageSize);
            return Request.CreateResponse<IQueryable<ModelObjects.ContactName>>(HttpStatusCode.OK, availableUmpires);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("umpire")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage AddUmpire(long accountId, long id)
        {
            var ump = DataAccess.Umpires.AddUmpire(accountId, id);
            if (ump != null)
                return Request.CreateResponse<ModelObjects.Umpire>(HttpStatusCode.Created, ump);
            else
                return Request.CreateResponse(HttpStatusCode.InternalServerError);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("umpire")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage DeleteUmpire(long accountId, long id)
        {
            if (DataAccess.Umpires.RemoveUmpire(id))
                return Request.CreateResponse(HttpStatusCode.OK);
            else
                return Request.CreateResponse(HttpStatusCode.NotFound);
        }

    }
}
