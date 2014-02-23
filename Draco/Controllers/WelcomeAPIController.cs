using SportsManager.Models;
using System;
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
                // 
                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(welcomeText.WelcomeText)
                };
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "WelcomeText", id = welcomeText.Id, accountId = accountId }));
                return response;
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }


        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("POST"), HttpPost]
        public HttpResponseMessage WelcomeText(long accountId, ModelObjects.AccountWelcome welcomeData)
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
                var response = new HttpResponseMessage(HttpStatusCode.Created)
                {
                    Content = new StringContent(welcomeData.Id.ToString())
                };
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "WelcomeText", accountId = accountId, id = welcomeData.Id }));
                return response;
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("PUT"), HttpPut]
        public HttpResponseMessage WelcomeText(long accountId, long id, ModelObjects.AccountWelcome welcomeData)
        {
            if (id != 0 && ModelState.IsValid && welcomeData != null)
            {
                // Convert any HTML markup in the status text.
                bool foundMessage = DataAccess.Accounts.ModifyWelcomeText(welcomeData);

                if (!foundMessage)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                // Create a 200 response.
                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(welcomeData.Id.ToString())
                };
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "WelcomeText", accountId = accountId, id = welcomeData.Id }));
                return response;
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("DELETE"), HttpDelete]
        public HttpResponseMessage WelcomeText(long accountId, long id)
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
