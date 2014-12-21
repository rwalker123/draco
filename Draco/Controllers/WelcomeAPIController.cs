using SportsManager.Models;
using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace SportsManager.Controllers
{
    public class WelcomeAPIController : ApiController
    {
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("WelcomeText")]
        public HttpResponseMessage GetWelcomeText(long accountId, long id)
        {
            var welcomeText = DataAccess.Accounts.GetWelcomeText(id);
            if (welcomeText != null)
            {
                return Request.CreateResponse<String>(HttpStatusCode.OK, welcomeText.WelcomeText);
                //// 
                //var response = new HttpResponseMessage(HttpStatusCode.OK)
                //{
                //    Content = new StringContent(welcomeText.WelcomeText)
                //};
                //response.Headers.Location =
                //    new Uri(Url.Link("ActionApi", new { action = "WelcomeText", id = welcomeText.Id, accountId = accountId }));
                //return response;
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }


        [AcceptVerbs("GET"), HttpGet]
        [ActionName("WelcomeText")]
        public HttpResponseMessage TeamGetWelcomeText(long accountId, long teamSeasonId, long id)
        {
            return GetWelcomeText(accountId, id);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("WelcomeTextHeaders")]
        public HttpResponseMessage GetWelcomeTextHeaders(long accountId)
        {
            var welcomeTexts = DataAccess.Accounts.GetAccountWelcomeTextHeaders(accountId);
            if (welcomeTexts != null)
            {
                return Request.CreateResponse<IQueryable<ModelObjects.AccountWelcome>>(HttpStatusCode.OK, welcomeTexts);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }


        [AcceptVerbs("GET"), HttpGet]
        [ActionName("WelcomeTextHeaders")]
        public HttpResponseMessage TeamGetWelcomeTextHeaders(long accountId, long teamSeasonId)
        {
            var welcomeTexts = DataAccess.Teams.GetWelcomeTextHeaders(accountId, teamSeasonId);
            if (welcomeTexts != null)
            {
                return Request.CreateResponse<IQueryable<ModelObjects.AccountWelcome>>(HttpStatusCode.OK, welcomeTexts);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin, LeagueAdmin, TeamAdmin")]
        [AcceptVerbs("POST"), HttpPost]
        [ActionName("WelcomeText")]
        public HttpResponseMessage TeamPostWelcomeText(long accountId, long teamSeasonId, ModelObjects.AccountWelcome welcomeData)
        {
            return PostWelcomeText(accountId, welcomeData);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("POST"), HttpPost]
        [ActionName("WelcomeText")]
        public HttpResponseMessage PostWelcomeText(long accountId, ModelObjects.AccountWelcome welcomeData)
        {
            if (ModelState.IsValid && welcomeData != null)
            {
                if (welcomeData.TeamId > 0)
                {
                    var team = DataAccess.Teams.GetTeam(welcomeData.TeamId);
                    if (team == null)
                        return Request.CreateResponse(HttpStatusCode.NotFound);

                    // need to use the teamId not team Season.
                    welcomeData.TeamId = team.TeamId;
                }

                // Convert any HTML markup in the status text.
                DataAccess.Accounts.AddWelcomeText(welcomeData);
                if (welcomeData.Id == 0)
                    return Request.CreateResponse(HttpStatusCode.BadRequest);

                // Create a 201 response.
                var response = Request.CreateResponse<ModelObjects.AccountWelcome>(HttpStatusCode.Created, welcomeData);
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "WelcomeText", accountId = accountId, id = welcomeData.Id }));
                return response;
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin, LeagueAdmin, TeamAdmin")]
        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("WelcomeText")]
        public HttpResponseMessage PutTeamWelcomeText(long accountId, long teamSeasonId, long id, ModelObjects.AccountWelcome welcomeData)
        {
            return PutWelcomeText(accountId, id, welcomeData);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("WelcomeText")]
        public HttpResponseMessage PutWelcomeText(long accountId, long id, ModelObjects.AccountWelcome welcomeData)
        {
            if (id != 0 && ModelState.IsValid && welcomeData != null)
            {
                // Convert any HTML markup in the status text.
                bool foundMessage = DataAccess.Accounts.ModifyWelcomeText(welcomeData);

                if (!foundMessage)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                // Create a 200 response.
                var response = Request.CreateResponse<ModelObjects.AccountWelcome>(HttpStatusCode.OK, welcomeData);
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "WelcomeText", accountId = accountId, id = welcomeData.Id }));
                return response;
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin, LeagueAdmin, TeamAdmin")]
        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("WelcomeText")]
        public HttpResponseMessage TeamDeleteWelcomeText(long accountId, long teamSeasonId, long id)
        {
            return DeleteWelcomeText(accountId, id);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("WelcomeText")]
        public HttpResponseMessage DeleteWelcomeText(long accountId, long id)
        {
            if (id > 0)
            {
                DataAccess.Accounts.RemoveWelcomeText(id);

                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(id.ToString())
                };

                return response;
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }
    }
}
