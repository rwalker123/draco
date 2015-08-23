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
    public class HandoutsAPIController : DBApiController
    {
        public HandoutsAPIController(DB db) : base(db)
        {
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("handouts")]
        public HttpResponseMessage GetHandout(long accountId)
        {
            var handouts = Db.AccountHandouts.Where(h => h.AccountId == accountId).OrderByDescending(h => h.Id);
            if (handouts != null)
            {
                var vm = Mapper.Map <IEnumerable<AccountHandout>, HandoutViewModel[]>(handouts);
                return Request.CreateResponse<HandoutViewModel[]>(HttpStatusCode.OK, vm);
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
            var team = Db.TeamsSeasons.Find(teamSeasonId);
            if (team == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var handouts = Db.TeamHandouts.Where(h => h.TeamId == team.Team.Id).AsEnumerable();
            if (handouts != null)
            {
                var vm = Mapper.Map<IEnumerable<TeamHandout>, HandoutViewModel[]>(handouts);
                return Request.CreateResponse<HandoutViewModel[]>(HttpStatusCode.OK, vm);
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("handouts")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage UpdateHandout(long accountId, int id, HandoutViewModel item)
        {
            if (ModelState.IsValid)
            {
                var dbHandout = Db.AccountHandouts.Find(id);
                if (dbHandout == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (dbHandout.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                dbHandout.Description = item.Description;
                dbHandout.FileName = item.FileName;

                Db.SaveChanges();

                var vm = Mapper.Map<AccountHandout, HandoutViewModel>(dbHandout);
                return Request.CreateResponse<HandoutViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("handouts")]
        [SportsManagerAuthorize(Roles = "AccountAdmin, TeamAdmin")]
        public HttpResponseMessage UpdateHandout(long accountId, long teamSeasonId, int id, TeamHandout item)
        {
            if (ModelState.IsValid)
            {
                var team = Db.TeamsSeasons.Find(teamSeasonId);
                if (team == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                var dbHandout = Db.TeamHandouts.Find(id);
                if (dbHandout == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                dbHandout.Description = item.Description;
                Db.SaveChanges();

                var vm = Mapper.Map<TeamHandout, HandoutViewModel>(dbHandout);
                return Request.CreateResponse<HandoutViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("handouts")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> DeleteHandout(long accountId, long id)
        {
            var handout = await Db.AccountHandouts.FindAsync(id);
            if (handout == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (handout.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            Db.AccountHandouts.Remove(handout);
            await Db.SaveChangesAsync();

            await SportsManager.Models.Utils.Storage.Provider.DeleteDirectory(handout.HandoutURL);

            return Request.CreateResponse<long>(HttpStatusCode.OK, id);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("handouts")]
        [SportsManagerAuthorize(Roles = "AccountAdmin, TeamAdmin")]
        public async Task<HttpResponseMessage> DeleteHandout(long accountId, long teamSeasonId, long id)
        {
            var team = await Db.TeamsSeasons.FindAsync(teamSeasonId);
            if (team == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var handout = await Db.TeamHandouts.FindAsync(id);
            if (handout == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (handout.TeamId != team.TeamId || team.Team.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            Db.TeamHandouts.Remove(handout);
            await Db.SaveChangesAsync();

            await SportsManager.Models.Utils.Storage.Provider.DeleteDirectory(handout.HandoutURL);

            return Request.CreateResponse<long>(HttpStatusCode.OK, id);
        }
    }
}
