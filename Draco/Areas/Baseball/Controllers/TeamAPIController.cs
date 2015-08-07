using AutoMapper;
using SportsManager.Controllers;
using SportsManager.Models;
using System;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using ModelObjects;
using SportsManager.ViewModels.API;

namespace SportsManager.Areas.Baseball.Controllers
{
    public class TeamAPIController : DBApiController
    {
        public TeamAPIController(DB db) : base(db)
        {
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("teamname")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage Put(long accountId, long teamSeasonId, TeamViewModel t)
        {
            var team = Db.TeamsSeasons.Find(teamSeasonId);
            if (team == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (team.Team.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            if (String.IsNullOrEmpty(t.Name))
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            team.Name = t.Name;
            Db.SaveChanges();

            var vm = Mapper.Map<TeamSeason, TeamViewModel>(team);
            return Request.CreateResponse<TeamViewModel>(HttpStatusCode.OK, vm);
        }

    }
}
