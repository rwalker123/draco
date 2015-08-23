using AutoMapper;
using ModelObjects;
using SportsManager.Models;
using SportsManager.ViewModels.API;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace SportsManager.Controllers
{
    public class AnnouncementAPIController : DBApiController
    {
        public AnnouncementAPIController(DB db) : base(db)
        {
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("Announcements")]
        public HttpResponseMessage GetAnnouncements(long accountId)
        {
            var news = Db.LeagueNews.Where(ln => ln.AccountId == accountId).OrderByDescending(ln => ln.Date);

            var vm = Mapper.Map<IEnumerable<LeagueNewsItem>, IEnumerable<NewsViewModel>>(news);
            return ProcessNews(vm);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("TeamAnnouncements")]
        public HttpResponseMessage GetTeamAnnouncements(long accountId, long teamSeasonId)
        {
            var teamSeason = Db.TeamsSeasons.Find(teamSeasonId);
            if (teamSeason == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var news = teamSeason.Team.TeamNews.OrderByDescending(tn => tn.Date);
            var vm = Mapper.Map<IEnumerable<TeamNewsItem>, IEnumerable<NewsViewModel>>(news);
            return ProcessNews(vm);
        }

        private HttpResponseMessage ProcessNews(IEnumerable<NewsViewModel> allNews)
        {
            var specialAnnouncments = new List<NewsViewModel>();
            var headlineLinks = new List<NewsViewModel>();
            var otherLinks = new List<NewsViewModel>();

            int NumHeadlineLinks = 3;

            foreach (var news in allNews)
            {
                if (news.SpecialAnnounce)
                {
                    specialAnnouncments.Add(news);
                }
                else if (headlineLinks.Count < NumHeadlineLinks)
                {
                    news.Text = String.Empty; // don't send back text improve performance.
                    headlineLinks.Add(news);
                }
                else
                {
                    news.Text = String.Empty; // don't send back text improve performance.
                    otherLinks.Add(news);
                }
            }

            var newsResponse = new
            {
                SpecialNews = specialAnnouncments,
                OtherNews = headlineLinks,
                OlderNews = otherLinks
            };

            return Request.CreateResponse(HttpStatusCode.OK, newsResponse);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("Announcement")]
        public HttpResponseMessage GetAnnouncement(long accountId, long id)
        {
            var newsItem = Db.LeagueNews.Find(id);
            if (newsItem != null)
            {
                var vm = Mapper.Map<LeagueNewsItem, NewsViewModel>(newsItem);
                return Request.CreateResponse<NewsViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("Announcement")]
        public HttpResponseMessage TeamAnnouncement(long accountId, long teamSeasonId, long id)
        {
            var newsItem = Db.TeamNews.Find(id);
            if (newsItem != null)
            {
                var vm = Mapper.Map<TeamNewsItem, NewsViewModel>(newsItem);
                return Request.CreateResponse<NewsViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }


        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("POST"), HttpPost]
        public HttpResponseMessage Announcement(long accountId, NewsViewModel announcementData)
        {
            if (ModelState.IsValid)
            {
                var newsItem = new LeagueNewsItem()
                {
                    AccountId = accountId,
                    Date = DateTime.Now,
                    SpecialAnnounce = announcementData.SpecialAnnounce,
                    Text = announcementData.Text ?? String.Empty,
                    Title = announcementData.Title ?? "Title"
                };

                Db.LeagueNews.Add(newsItem);
                Db.SaveChanges();

                var vm = Mapper.Map<LeagueNewsItem, NewsViewModel>(newsItem);
                var response = Request.CreateResponse<NewsViewModel>(HttpStatusCode.Created, vm);
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "Announcement", accountId = accountId, id = newsItem.Id }));
                return response;
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("PUT"), HttpPut]
        public HttpResponseMessage Announcement(long accountId, long id, NewsViewModel announcementData)
        {
            if (ModelState.IsValid)
            {
                var newsItem = Db.LeagueNews.Find(id);
                if (newsItem == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                newsItem.Date = DateTime.Now;
                newsItem.Text = announcementData.Text ?? String.Empty;
                newsItem.Title = announcementData.Title ?? "Title";
                newsItem.SpecialAnnounce = announcementData.SpecialAnnounce;
                Db.SaveChanges();

                // Create a 200 response.
                var vm = Mapper.Map<LeagueNewsItem, NewsViewModel>(newsItem);
                var response = Request.CreateResponse<NewsViewModel>(HttpStatusCode.OK, vm);
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "Announcement", accountId = accountId, id = newsItem.Id }));
                return response;
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin, LeagueAdmin, TeamAdmin")]
        [AcceptVerbs("POST"), HttpPost]
        [ActionName("Announcement")]
        public HttpResponseMessage TeamAnnouncement(long accountId, long teamSeasonId, NewsViewModel announcementData)
        {
            if (ModelState.IsValid)
            {
                announcementData.Date = DateTime.Now;

                // convert teamSeasonId to teamId
                var teamSeason = Db.TeamsSeasons.Find(teamSeasonId);
                if (teamSeason == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                var newsItem = new TeamNewsItem()
                {
                    Date = DateTime.Now,
                    SpecialAnnounce = announcementData.SpecialAnnounce,
                    TeamId = teamSeason.TeamId,
                    Text = announcementData.Text ?? String.Empty,
                    Title = announcementData.Title ?? "Title"
                };

                Db.TeamNews.Add(newsItem);
                Db.SaveChanges();

                // Create a 201 response.
                var vm = Mapper.Map<TeamNewsItem, NewsViewModel>(newsItem);
                var response = Request.CreateResponse<NewsViewModel>(HttpStatusCode.Created, vm);
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "Announcement", accountId = accountId, id = newsItem.Id }));
                return response;
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin, LeagueAdmin, TeamAdmin")]
        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("Announcement")]
        public HttpResponseMessage TeamAnnouncement(long accountId, long teamSeasonId, long id, NewsViewModel announcementData)
        {
            if (ModelState.IsValid)
            {
                // convert teamSeasonId to teamId
                var teamSeason = Db.TeamsSeasons.Find(teamSeasonId);
                if (teamSeason == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                var newsItem = Db.TeamNews.Find(id);
                if (newsItem.TeamId != teamSeason.TeamId)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                newsItem.Date = DateTime.Now;
                newsItem.Title = announcementData.Title ?? "Title";
                newsItem.Text = announcementData.Text ?? String.Empty;
                newsItem.SpecialAnnounce = announcementData.SpecialAnnounce;

                Db.SaveChanges();

                // Create a 200 response.
                var vm = Mapper.Map<TeamNewsItem, NewsViewModel>(newsItem);
                var response = Request.CreateResponse<NewsViewModel>(HttpStatusCode.OK, vm);
                response.Headers.Location =
                    new Uri(Url.Link("ActionApi", new { action = "Announcement", accountId = accountId, id = newsItem.Id }));
                return response;
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }


        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        [AcceptVerbs("DELETE"), HttpDelete]
        public HttpResponseMessage Announcement(long accountid, long id)
        {
            var newsItem = Db.LeagueNews.Find(id);
            if (newsItem == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (newsItem.AccountId != accountid)
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            Db.LeagueNews.Remove(newsItem);
            Db.SaveChanges();

            return new HttpResponseMessage(HttpStatusCode.OK);
        }

        [SportsManagerAuthorize(Roles = "AccountAdmin, LeagueAdmin, TeamAdmin")]
        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("Announcement")]
        public HttpResponseMessage DeleteTeamAnnouncement(long accountId, long teamSeasonId, long id)
        {
            var newsItem = Db.TeamNews.Find(id);
            if (newsItem == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            var teamSeason = Db.TeamsSeasons.Find(teamSeasonId);
            if (teamSeason == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (newsItem.TeamId != teamSeason.TeamId)
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            Db.TeamNews.Remove(newsItem);
            Db.SaveChanges();

            return new HttpResponseMessage(HttpStatusCode.OK);
        }

    }
}
