using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class TeamAPIController : ApiController
    {
        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("teamname")]
        public HttpResponseMessage Put(long accountId, long teamSeasonId, ModelObjects.Team t)
        {
            var team = DataAccess.Teams.GetTeam(t.Id);
            if (team == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            team.Name = t.Name ?? String.Empty;
            if (DataAccess.Teams.ModifyTeam(team))
                return Request.CreateResponse<ModelObjects.Team>(HttpStatusCode.OK, team);
            else
                return Request.CreateResponse(HttpStatusCode.BadRequest);

        }

    }
}
