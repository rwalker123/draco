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
    public class WelcomeAPIController : DBApiController
    {
        public WelcomeAPIController(DB db) : base(db)
        {
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("WelcomeText")]
        public async Task<HttpResponseMessage> GetWelcomeText(long accountId, long id)
        {
            var welcomeText = await Db.AccountWelcomes.FindAsync(id);
            if (welcomeText != null)
            {
                if (welcomeText.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                var vm = Mapper.Map<AccountWelcome, WelcomeTextViewModel>(welcomeText);
                return Request.CreateResponse<WelcomeTextViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }


        [AcceptVerbs("GET"), HttpGet]
        [ActionName("WelcomeText")]
        public async Task<HttpResponseMessage> TeamGetWelcomeText(long accountId, long teamSeasonId, long id)
        {
            var welcomeText = await Db.AccountWelcomes.FindAsync(id);
            if (welcomeText != null)
            {
                var teamSeason = await Db.TeamsSeasons.FindAsync(teamSeasonId);
                if (teamSeason == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (welcomeText.AccountId != accountId || welcomeText.TeamId != teamSeason.TeamId)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                var vm = Mapper.Map<AccountWelcome, WelcomeTextViewModel>(welcomeText);
                return Request.CreateResponse<WelcomeTextViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("WelcomeTextHeaders")]
        public HttpResponseMessage GetWelcomeTextHeaders(long accountId)
        {
            var welcomeTexts = (from aw in Db.AccountWelcomes
                                where aw.AccountId == accountId && (!aw.TeamId.HasValue || aw.TeamId == 0)
                                orderby aw.OrderNo
                                select aw).AsEnumerable();

            if (welcomeTexts != null)
            {
                var vm = Mapper.Map<IEnumerable<AccountWelcome>, WelcomeHeaderViewModel[]>(welcomeTexts);
                return Request.CreateResponse<WelcomeHeaderViewModel[]>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }


        [AcceptVerbs("GET"), HttpGet]
        [ActionName("WelcomeTextHeaders")]
        public async Task<HttpResponseMessage> TeamGetWelcomeTextHeaders(long accountId, long teamSeasonId)
        {
            var teamSeason = await Db.TeamsSeasons.FindAsync(teamSeasonId);
            if (teamSeason == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (teamSeason.Team.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            var welcomeTexts = teamSeason.Team.AccountWelcomes.OrderBy(aw => aw.OrderNo);

            if (welcomeTexts != null)
            {
                var vm = Mapper.Map<IEnumerable<AccountWelcome>, WelcomeHeaderViewModel[]>(welcomeTexts);
                return Request.CreateResponse<WelcomeHeaderViewModel[]>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin, LeagueAdmin, TeamAdmin")]
        [AcceptVerbs("POST"), HttpPost]
        [ActionName("WelcomeText")]
        public async Task<HttpResponseMessage> TeamPostWelcomeText(long accountId, long teamSeasonId, WelcomeTextViewModel welcomeData)
        {
            if (ModelState.IsValid)
            {
                var teamSeason = await Db.TeamsSeasons.FindAsync(teamSeasonId);
                if (teamSeason == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (teamSeason.Team.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                var dbData = new AccountWelcome()
                {
                    AccountId = accountId,
                    Team = teamSeason.Team,
                    CaptionMenu = welcomeData.CaptionMenu,
                    OrderNo = welcomeData.OrderNo,
                    WelcomeText = welcomeData.WelcomeText
                };

                Db.AccountWelcomes.Add(dbData);
                await Db.SaveChangesAsync();

                var vm = Mapper.Map<AccountWelcome, WelcomeTextViewModel>(dbData);
                return Request.CreateResponse<WelcomeTextViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("POST"), HttpPost]
        [ActionName("WelcomeText")]
        public async Task<HttpResponseMessage> PostWelcomeText(long accountId, WelcomeTextViewModel welcomeData)
        {
            if (ModelState.IsValid)
            {
                var dbData = new AccountWelcome()
                {
                    AccountId = accountId,
                    TeamId = 0,
                    CaptionMenu = welcomeData.CaptionMenu,
                    OrderNo = welcomeData.OrderNo,
                    WelcomeText = welcomeData.WelcomeText
                };

                Db.AccountWelcomes.Add(dbData);
                await Db.SaveChangesAsync();

                var vm = Mapper.Map<AccountWelcome, WelcomeTextViewModel>(dbData);
                return Request.CreateResponse<WelcomeTextViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin, LeagueAdmin, TeamAdmin")]
        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("WelcomeText")]
        public async Task<HttpResponseMessage> PutTeamWelcomeText(long accountId, long teamSeasonId, long id, WelcomeTextViewModel welcomeData)
        {
            if (ModelState.IsValid)
            {
                var teamSeason = await Db.TeamsSeasons.FindAsync(teamSeasonId);
                if (teamSeason == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (teamSeason.Team.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                var dbData = await Db.AccountWelcomes.FindAsync(id);
                if (dbData == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (dbData.TeamId != teamSeason.TeamId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                dbData.CaptionMenu = welcomeData.CaptionMenu;
                dbData.OrderNo = welcomeData.OrderNo;
                dbData.WelcomeText = welcomeData.WelcomeText;

                await Db.SaveChangesAsync();

                var vm = Mapper.Map<AccountWelcome, WelcomeTextViewModel>(dbData);
                return Request.CreateResponse<WelcomeTextViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("WelcomeText")]
        public async Task<HttpResponseMessage> PutWelcomeText(long accountId, long id, WelcomeTextViewModel welcomeData)
        {
            if (id != 0 && ModelState.IsValid)
            {
                var dbData = await Db.AccountWelcomes.FindAsync(id);
                if (dbData == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (dbData.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                dbData.CaptionMenu = welcomeData.CaptionMenu;
                dbData.OrderNo = welcomeData.OrderNo;
                dbData.WelcomeText = welcomeData.WelcomeText;

                await Db.SaveChangesAsync();

                var vm = Mapper.Map<AccountWelcome, WelcomeTextViewModel>(dbData);
                return Request.CreateResponse<WelcomeTextViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin, LeagueAdmin, TeamAdmin")]
        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("WelcomeText")]
        public async Task<HttpResponseMessage> TeamDeleteWelcomeText(long accountId, long teamSeasonId, long id)
        {
            var teamSeason = await Db.TeamsSeasons.FindAsync(teamSeasonId);
            if (teamSeason == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (teamSeason.Team.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            var dbData = await Db.AccountWelcomes.FindAsync(id);
            if (dbData == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (dbData.TeamId != teamSeason.TeamId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            Db.AccountWelcomes.Remove(dbData);
            await Db.SaveChangesAsync();
            return Request.CreateResponse<long>(HttpStatusCode.OK, id);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("WelcomeText")]
        public async Task<HttpResponseMessage> DeleteWelcomeText(long accountId, long id)
        {
            var dbData = await Db.AccountWelcomes.FindAsync(id);
            if (dbData == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (dbData.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            Db.AccountWelcomes.Remove(dbData);
            await Db.SaveChangesAsync();
            return Request.CreateResponse<long>(HttpStatusCode.OK, id);
        }
    }
}
