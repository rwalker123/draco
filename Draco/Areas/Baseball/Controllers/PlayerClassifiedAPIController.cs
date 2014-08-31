using ModelObjects;
using SportsManager.Models;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class PlayerClassifiedAPIController : ApiController
    {
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("playerswanted")]
        public HttpResponseMessage GetPlayersWanted(long accountId)
        {
            var playersWanted = DataAccess.PlayerClassifieds.GetPlayersWanted(accountId);
            return Request.CreateResponse<IQueryable<PlayersWantedClassified>>(HttpStatusCode.OK, playersWanted);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("playerswanted")]
        public HttpResponseMessage PostPlayersWanted(long accountId, PlayersWantedClassified model)
        {
            if (ModelState.IsValid && model != null)
            {
                model.AccountId = accountId;
                model.CreatedByContactId = DataAccess.Contacts.GetContactId(Globals.GetCurrentUserId());
                if (model.CreatedByContactId != 0)
                {
                    var success = DataAccess.PlayerClassifieds.AddPlayersWanted(model);
                    if (success)
                    {
                        return Request.CreateResponse<PlayersWantedClassified>(HttpStatusCode.Created, model);
                    }
                }
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("playerswanted")]
        public HttpResponseMessage PutPlayersWanted(long accountId, long id, PlayersWantedClassified model)
        {
            if (ModelState.IsValid && model != null)
            {
                model.AccountId = accountId;
                model.Id = id;

                model.CreatedByContactId = DataAccess.Contacts.GetContactId(Globals.GetCurrentUserId());
                if (model.CreatedByContactId != 0)
                {
                    var success = DataAccess.PlayerClassifieds.UpdatePlayersWanted(model);
                    if (success)
                    {
                        return Request.CreateResponse<PlayersWantedClassified>(HttpStatusCode.OK, model);
                    }
                }
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("playerswanted")]
        public HttpResponseMessage DeletePlayersWanted(long accountId, long id)
        {
            bool deleted = DataAccess.PlayerClassifieds.DeletePlayersWanted(accountId, id);
            if (deleted)
            {
                return Request.CreateResponse(HttpStatusCode.OK);
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("teamswanted")]
        public HttpResponseMessage GetTeamsWanted(long accountId)
        {
            var queryValues = Request.RequestUri.ParseQueryString();
            var accessCode = queryValues["c"];

            var teamsWanted = DataAccess.PlayerClassifieds.GetTeamsWanted(accountId, accessCode);
            return Request.CreateResponse<IQueryable<TeamsWantedClassified>>(HttpStatusCode.OK, teamsWanted);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("teamswanted")]
        public HttpResponseMessage PostTeamsWanted(long accountId, TeamsWantedClassified model)
        {
            if (ModelState.IsValid && model != null)
            {
                model.AccountId = accountId;
                
                var queryValues = Request.RequestUri.ParseQueryString();
                var refererUrl = queryValues["r"];

                var success = DataAccess.PlayerClassifieds.AddTeamsWanted(model, refererUrl);
                if (success)
                {
                    return Request.CreateResponse<TeamsWantedClassified>(HttpStatusCode.Created, model);
                }
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("teamswanted")]
        public HttpResponseMessage PutTeamsWanted(long accountId, long id, TeamsWantedClassified model)
        {
            if (ModelState.IsValid && model != null)
            {
                model.Id = id;
                model.AccountId = accountId;

                var success = DataAccess.PlayerClassifieds.UpdateTeamsWanted(model);
                if (success)
                {
                    return Request.CreateResponse<TeamsWantedClassified>(HttpStatusCode.OK, model);
                }
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("teamswanted")]
        public HttpResponseMessage DeleteTeamsWanted(long accountId, long id)
        {
            string userId = Globals.GetCurrentUserId();
            bool isAdmin = DataAccess.Accounts.IsAccountAdmin(accountId, userId);
            var accessCode = string.Empty;
            if (!isAdmin)
            {
                var queryValues = Request.RequestUri.ParseQueryString();
                accessCode = queryValues["c"];
            }

            bool deleted = DataAccess.PlayerClassifieds.DeleteTeamsWanted(id, accessCode);
            if (deleted)
            {
                return Request.CreateResponse(HttpStatusCode.OK);
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }
    }
}
