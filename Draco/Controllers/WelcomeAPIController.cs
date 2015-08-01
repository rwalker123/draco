using AutoMapper;
using ModelObjects;
using SportsManager.Models;
using SportsManager.ViewModels.API;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace SportsManager.Controllers
{
    public class WelcomeAPIController : DBApiController
    {
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("WelcomeText")]
        public HttpResponseMessage GetWelcomeText(long accountId, long id)
        {
            var welcomeText = m_db.AccountWelcomes.Find(id);
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
        public HttpResponseMessage TeamGetWelcomeText(long accountId, long teamSeasonId, long id)
        {
            var welcomeText = m_db.AccountWelcomes.Find(id);
            if (welcomeText != null)
            {
                var teamSeason = m_db.TeamsSeasons.Find(teamSeasonId);
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
            var welcomeTexts = (from aw in m_db.AccountWelcomes
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
        public HttpResponseMessage TeamGetWelcomeTextHeaders(long accountId, long teamSeasonId)
        {
            var welcomeTexts = (from aw in m_db.AccountWelcomes
                                where aw.AccountId == accountId && aw.TeamId == teamSeasonId
                                orderby aw.OrderNo
                                select aw).AsEnumerable();

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
        public HttpResponseMessage TeamPostWelcomeText(long accountId, long teamSeasonId, WelcomeTextViewModel welcomeData)
        {
            if (ModelState.IsValid)
            {
                var teamSeason = m_db.TeamsSeasons.Find(teamSeasonId);
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

                m_db.AccountWelcomes.Add(dbData);
                m_db.SaveChanges();

                var vm = Mapper.Map<AccountWelcome, WelcomeTextViewModel>(dbData);
                return Request.CreateResponse<WelcomeTextViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("POST"), HttpPost]
        [ActionName("WelcomeText")]
        public HttpResponseMessage PostWelcomeText(long accountId, WelcomeTextViewModel welcomeData)
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

                m_db.AccountWelcomes.Add(dbData);
                m_db.SaveChanges();

                var vm = Mapper.Map<AccountWelcome, WelcomeTextViewModel>(dbData);
                return Request.CreateResponse<WelcomeTextViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin, LeagueAdmin, TeamAdmin")]
        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("WelcomeText")]
        public HttpResponseMessage PutTeamWelcomeText(long accountId, long teamSeasonId, long id, ModelObjects.AccountWelcome welcomeData)
        {
            if (ModelState.IsValid)
            {
                var teamSeason = m_db.TeamsSeasons.Find(teamSeasonId);
                if (teamSeason == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (teamSeason.Team.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                var dbData = m_db.AccountWelcomes.Find(id);
                if (dbData == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (dbData.TeamId != teamSeason.TeamId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                dbData.CaptionMenu = welcomeData.CaptionMenu;
                dbData.OrderNo = welcomeData.OrderNo;
                dbData.WelcomeText = welcomeData.WelcomeText;

                m_db.SaveChanges();

                var vm = Mapper.Map<AccountWelcome, WelcomeTextViewModel>(dbData);
                return Request.CreateResponse<WelcomeTextViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("WelcomeText")]
        public HttpResponseMessage PutWelcomeText(long accountId, long id, ModelObjects.AccountWelcome welcomeData)
        {
            if (id != 0 && ModelState.IsValid)
            {
                var dbData = m_db.AccountWelcomes.Find(id);
                if (dbData == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (dbData.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                dbData.CaptionMenu = welcomeData.CaptionMenu;
                dbData.OrderNo = welcomeData.OrderNo;
                dbData.WelcomeText = welcomeData.WelcomeText;

                m_db.SaveChanges();

                var vm = Mapper.Map<AccountWelcome, WelcomeTextViewModel>(dbData);
                return Request.CreateResponse<WelcomeTextViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin, LeagueAdmin, TeamAdmin")]
        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("WelcomeText")]
        public HttpResponseMessage TeamDeleteWelcomeText(long accountId, long teamSeasonId, long id)
        {
            var teamSeason = m_db.TeamsSeasons.Find(teamSeasonId);
            if (teamSeason == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (teamSeason.Team.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            var dbData = m_db.AccountWelcomes.Find(id);
            if (dbData == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (dbData.TeamId != teamSeason.TeamId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            m_db.AccountWelcomes.Remove(dbData);
            m_db.SaveChanges();
            return Request.CreateResponse<long>(HttpStatusCode.OK, id);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("WelcomeText")]
        public HttpResponseMessage DeleteWelcomeText(long accountId, long id)
        {
            var dbData = m_db.AccountWelcomes.Find(id);
            if (dbData == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (dbData.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            m_db.AccountWelcomes.Remove(dbData);
            m_db.SaveChanges();
            return Request.CreateResponse<long>(HttpStatusCode.OK, id);
        }
    }
}
