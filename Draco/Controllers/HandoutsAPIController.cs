using ModelObjects;
using SportsManager.Models;
using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using System.Web.Http;

namespace SportsManager.Controllers
{
    public class HandoutsAPIController : ApiController
    {
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("handouts")]
        public HttpResponseMessage GetHandout(long accountId)
        {
            var handouts = DataAccess.AccountHandouts.GetAccountHandouts(accountId);
            if (handouts != null)
            {
                return Request.CreateResponse<IEnumerable<ModelObjects.AccountHandout>>(HttpStatusCode.OK, handouts);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("handouts")]
        public HttpResponseMessage GetTeamHandout(long accountId, long teamSeasonId)
        {
            var team = DataAccess.Teams.GetTeam(teamSeasonId);
            if (team == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var handouts = DataAccess.TeamHandouts.GetTeamHandouts(team.TeamId);
            if (handouts != null)
            {
                return Request.CreateResponse<IEnumerable<ModelObjects.TeamHandout>>(HttpStatusCode.OK, handouts);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("handouts")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage UpdateHandout(long accountId, int id, AccountHandout item)
        {
            if (String.IsNullOrEmpty(item.FileName))
                return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "FileName cannot be empty.");

            item.Id = id;
            item.ReferenceId = accountId;
            AccountHandout foundItem = DataAccess.AccountHandouts.GetHandout(item.Id);
            if (foundItem == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            bool rc = DataAccess.AccountHandouts.ModifyAccountHandout(item);

            if (rc)
            {
                return Request.CreateResponse<AccountHandout>(HttpStatusCode.OK, item);
            }
            else
            {
                return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "Maximum photos in albums reached.");
            }
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("handouts")]
        [SportsManagerAuthorize(Roles = "AccountAdmin, TeamAdmin")]
        public HttpResponseMessage UpdateHandout(long accountId, long teamSeasonId, int id, TeamHandout item)
        {
            if (String.IsNullOrEmpty(item.FileName))
                return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "FileName cannot be empty.");

            var team = DataAccess.Teams.GetTeam(teamSeasonId);
            if (team == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            item.Id = id;
            item.ReferenceId = teamSeasonId;
            var foundItem = DataAccess.TeamHandouts.GetHandout(item.Id);
            if (foundItem == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            bool rc = DataAccess.TeamHandouts.ModifyTeamHandout(item);

            if (rc)
            {
                return Request.CreateResponse<TeamHandout>(HttpStatusCode.OK, item);
            }
            else
            {
                return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "Maximum photos in albums reached.");
            }
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("handouts")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> DeleteHandout(long accountId, long id)
        {
            var handout = new AccountHandout()
            {
                ReferenceId = accountId,
                Id = id
            };

            if (await DataAccess.AccountHandouts.RemoveAccountHandout(handout))
            {
                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(handout.Id.ToString())
                };

                return response;
            }
            else
                return Request.CreateResponse(HttpStatusCode.NotFound);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("handouts")]
        [SportsManagerAuthorize(Roles = "AccountAdmin, TeamAdmin")]
        public async Task<HttpResponseMessage> DeleteHandout(long accountId, long teamSeasonId, long id)
        {
            var team = DataAccess.Teams.GetTeam(teamSeasonId);
            if (team == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var handout = new TeamHandout()
            {
                ReferenceId = teamSeasonId,
                Id = id
            };

            if (await DataAccess.TeamHandouts.RemoveTeamHandout(handout))
            {
                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(handout.Id.ToString())
                };

                return response;
            }
            else
                return Request.CreateResponse(HttpStatusCode.NotFound);
        }
    }
}
