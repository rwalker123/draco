using SportsManager.Models;
using System;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace SportsManager.Controllers
{
    public class AnnouncementAPIController : ApiController
    {
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("Announcement")]
        public HttpResponseMessage GetAnnouncement(long accountId, long id)
        {
            var newsItem = DataAccess.LeagueNews.GetNewsItem(id);
            if (newsItem != null)
            {
                // 
                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(newsItem.Text)
                };
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "Announcement", id = newsItem.Id, accountId = accountId }));
                return response;
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("Announcement")]
        public HttpResponseMessage TeamAnnouncement(long accountId, long teamSeasonId, long id)
        {
            var newsItem = DataAccess.TeamNews.GetTeamAnnouncement(id);
            if (newsItem != null)
            {
                // 
                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(newsItem.Text)
                };
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "Announcement", id = newsItem.Id, accountId = accountId }));
                return response;
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }
        }


        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("POST"), HttpPost]
        public HttpResponseMessage Announcement(long accountId, ModelObjects.LeagueNewsItem announcementData)
        {
            if (ModelState.IsValid && announcementData != null)
            {
                announcementData.Date = DateTime.Now;

                DataAccess.LeagueNews.AddNews(announcementData);

                // Create a 201 response.
                //var response = Request.CreateResponse<ModelObjects.LeagueNewsItem>(HttpStatusCode.Created, announcementData);
                var response = new HttpResponseMessage(HttpStatusCode.Created)
                {
                    Content = new StringContent(announcementData.Id.ToString())
                };
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "Announcement", accountId = accountId, id = announcementData.Id }));
                return response;
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("PUT"), HttpPut]
        public HttpResponseMessage Announcement(long accountId, long id, ModelObjects.LeagueNewsItem announcementData)
        {
            if (id != 0 && ModelState.IsValid && announcementData != null)
            {
                announcementData.Date = DateTime.Now;

                bool foundAnnouncement = DataAccess.LeagueNews.ModifyNews(announcementData);

                if (!foundAnnouncement)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                // Create a 200 response.
                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(announcementData.Id.ToString())
                };
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "Announcement", accountId = accountId, id = announcementData.Id }));
                return response;
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin, LeagueAdmin, TeamAdmin")]
        [AcceptVerbs("POST"), HttpPost]
        [ActionName("Announcement")]
        public HttpResponseMessage TeamAnnouncement(long accountId, long teamSeasonId, ModelObjects.LeagueNewsItem announcementData)
        {
            if (ModelState.IsValid && announcementData != null)
            {
                announcementData.Date = DateTime.Now;

                // convert teamSeasonId to teamId
                var team = DataAccess.Teams.GetTeam(teamSeasonId);
                if (team == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                // need to use the teamId not team Season.
                announcementData.AccountId = team.TeamId;

                DataAccess.TeamNews.AddTeamAnnouncement(announcementData);

                // Create a 201 response.
                //var response = Request.CreateResponse<ModelObjects.LeagueNewsItem>(HttpStatusCode.Created, announcementData);
                var response = new HttpResponseMessage(HttpStatusCode.Created)
                {
                    Content = new StringContent(announcementData.Id.ToString())
                };
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "Announcement", accountId = accountId, id = announcementData.Id }));
                return response;
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin, LeagueAdmin, TeamAdmin")]
        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("Announcement")]
        public HttpResponseMessage TeamAnnouncement(long accountId, long teamSeasonId, long id, ModelObjects.LeagueNewsItem announcementData)
        {
            if (id != 0 && ModelState.IsValid && announcementData != null)
            {
                announcementData.Date = DateTime.Now;

                // convert teamSeasonId to teamId
                var team = DataAccess.Teams.GetTeam(teamSeasonId);
                if (team == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                // need to use the teamId not team Season.
                announcementData.AccountId = team.TeamId;

                bool foundAnnouncement = DataAccess.TeamNews.ModifyTeamAnnouncement(announcementData);

                if (!foundAnnouncement)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                // Create a 200 response.
                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(announcementData.Id.ToString())
                };
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "Announcement", accountId = accountId, id = announcementData.Id }));
                return response;
            }
            else
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
        }


        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("DELETE"), HttpDelete]
        public HttpResponseMessage Announcement(long accountid, long id)
        {
            if (id > 0)
            {
                DataAccess.LeagueNews.RemoveNews(id);

                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(id.ToString())
                };

                return response;
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin, LeagueAdmin, TeamAdmin")]
        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("Announcement")]
        public HttpResponseMessage DeleteTeamAnnouncement(long accountId, long teamSeasonId, long id)
        {
            if (id > 0)
            {
                DataAccess.TeamNews.RemoveTeamAnnouncement(id);

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
