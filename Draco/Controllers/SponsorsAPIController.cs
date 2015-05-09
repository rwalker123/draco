using SportsManager.Models;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace SportsManager.Controllers
{
    public class SponsorsAPIController : ApiController
    {
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("sponsors")]
        public HttpResponseMessage GetSponsors(long accountId)
        {
            var sponsors = DataAccess.Sponsors.GetSponsors(accountId);
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
        [ActionName("teamsponsor")]
        public HttpResponseMessage GetSponsors(long accountId, long teamSeasonId)
        {
            var sponsors = DataAccess.Sponsors.GetTeamSponsors(teamSeasonId);
            if (sponsors != null)
            {
                return Request.CreateResponse<IQueryable<ModelObjects.Sponsor>>(HttpStatusCode.OK, sponsors);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }

        [AcceptVerbs("PUT"), HttpPut]
        [SportsManagerAuthorize(Roles="AccountAdmin")]
        [ActionName("sponsors")]
        public HttpResponseMessage PutSponsors(long accountId, long id, ModelObjects.Sponsor sponsor)
        {
            if (ModelState.IsValid && sponsor != null)
            {
                sponsor.Id = id;
                sponsor.AccountId = accountId;
                var success = DataAccess.Sponsors.ModifySponsor(sponsor);
                if (success)
                    return Request.CreateResponse<ModelObjects.Sponsor>(HttpStatusCode.OK, sponsor);
                else
                    return Request.CreateResponse(HttpStatusCode.NotFound);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }

        [AcceptVerbs("POST"), HttpPost]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [ActionName("sponsors")]
        public HttpResponseMessage PostSponsors(long accountId, ModelObjects.Sponsor sponsor)
        {
            if (ModelState.IsValid && sponsor != null)
            {
                sponsor.AccountId = accountId;
                var id = DataAccess.Sponsors.AddSponsor(sponsor);
                if (id > 0)
                {
                    return Request.CreateResponse<ModelObjects.Sponsor>(HttpStatusCode.OK, sponsor);
                }

                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [ActionName("sponsors")]
        public async Task<HttpResponseMessage> DeleteSponsors(long accountId, long id)
        {
            var sponsor = DataAccess.Sponsors.GetSponsor(id);
            if (sponsor == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var success = await DataAccess.Sponsors.RemoveSponsor(id);
            if (success)
            {
                return Request.CreateResponse<ModelObjects.Sponsor>(HttpStatusCode.OK, sponsor);
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }


        [AcceptVerbs("PUT"), HttpPut]
        [SportsManagerAuthorize(Roles = "AccountAdmin, TeamAdmin")]
        [ActionName("teamsponsor")]
        public HttpResponseMessage PutSponsors(long accountId, long teamSeasonId, long id, ModelObjects.Sponsor sponsor)
        {
            if (ModelState.IsValid && sponsor != null)
            {
                sponsor.Id = id;
                sponsor.AccountId = accountId;
                var team = DataAccess.Teams.GetTeam(teamSeasonId);
                if (team == null)
                {
                    return Request.CreateResponse(HttpStatusCode.NotFound);
                }
                sponsor.TeamId = team.TeamId;

                var success = DataAccess.Sponsors.ModifySponsor(sponsor);
                if (success)
                    return Request.CreateResponse<ModelObjects.Sponsor>(HttpStatusCode.OK, sponsor);
                else
                    return Request.CreateResponse(HttpStatusCode.NotFound);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }

        [AcceptVerbs("POST"), HttpPost]
        [SportsManagerAuthorize(Roles = "AccountAdmin, TeamAdmin")]
        [ActionName("teamsponsor")]
        public HttpResponseMessage PostSponsors(long accountId, long teamSeasonId, ModelObjects.Sponsor sponsor)
        {
            if (ModelState.IsValid && sponsor != null)
            {
                sponsor.AccountId = accountId;
                var team = DataAccess.Teams.GetTeam(teamSeasonId);
                if (team == null)
                {
                    return Request.CreateResponse(HttpStatusCode.NotFound);
                }
                sponsor.TeamId = team.TeamId;

                var id = DataAccess.Sponsors.AddSponsor(sponsor);
                if (id > 0)
                {
                    return Request.CreateResponse<ModelObjects.Sponsor>(HttpStatusCode.OK, sponsor);
                }

                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [SportsManagerAuthorize(Roles = "AccountAdmin, TeamAdmin")]
        [ActionName("teamsponsor")]
        public async Task<HttpResponseMessage> DeleteSponsors(long accountId, long teamSeasonId, long id)
        {
            var sponsor = DataAccess.Sponsors.GetSponsor(id);
            if (sponsor == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var team = DataAccess.Teams.GetTeam(teamSeasonId);
            if (team == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (sponsor.TeamId != team.TeamId)
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            var success = await DataAccess.Sponsors.RemoveSponsor(id);
            if (success)
            {
                return Request.CreateResponse<ModelObjects.Sponsor>(HttpStatusCode.OK, sponsor);
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }
    }
}
