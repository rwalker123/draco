using AutoMapper;
using Microsoft.AspNet.Identity;
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
    public class DiscussionsAPIController : DBApiController
    {
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("categories")]
        public HttpResponseMessage GetCategories(long accountId)
        {
            var categories = m_db.MessageCategories.Where(mc => mc.AccountId == accountId && !mc.IsTeam).ToList();

            String userId = Globals.GetCurrentUserId();
            Contact contact = m_db.Contacts.Where(c => c.UserId == userId).SingleOrDefault();

            bool isAdmin = false;

            if (contact == null && !String.IsNullOrEmpty(userId))
            {
                // check to see if in AspNetUserRoles as Administrator
                try
                {
                    var userManager = Globals.GetUserManager();
                    isAdmin = userManager.IsInRole(userId, "Administrator");
                }
                catch(Exception)
                {
                    // could fail if logged in with wrong account.
                }
            }
            if (contact != null || isAdmin)
            {
                var teamCats = GetContactTeamCategoriesWithDetails(accountId, contact, isAdmin);
                if (teamCats != null)
                    categories.AddRange(teamCats);

                var globalCats = GetContactGlobalCategoriesWithDetails(accountId, contact, isAdmin);
                if (globalCats != null)
                    categories.AddRange(globalCats);
            }

            var vm = Mapper.Map<IEnumerable<MessageCategory>, MessageCategoryViewModel[]>(categories);
            return Request.CreateResponse<MessageCategoryViewModel[]>(HttpStatusCode.OK, vm);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("categories")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage PostCategories(long accountId, MessageCategoryViewModel cat)
        {
            if (ModelState.IsValid && cat != null)
            {
                cat.AccountId = accountId;

                var dbCat = new MessageCategory()
                {
                    AccountId = cat.AccountId,
                    CategoryOrder = cat.Order,
                    CategoryName = cat.Name,
                    CategoryDescription = cat.Description ?? String.Empty,
                    AllowAnonymousPost = cat.AllowAnonymousPost,
                    AllowAnonymousTopic = cat.AllowAnonymousTopic,
                    IsModerated = cat.IsModerated,
                    IsTeam = cat.IsTeam
                };

                m_db.MessageCategories.Add(dbCat);
                m_db.SaveChanges();

                var vm = Mapper.Map<MessageCategory, MessageCategoryViewModel>(dbCat);
                return Request.CreateResponse<MessageCategoryViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("categories")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage PutCategories(long accountId, MessageCategoryViewModel cat)
        {
            if (ModelState.IsValid && cat != null)
            {
                cat.AccountId = accountId;

                var dbCat = m_db.MessageCategories.Find(cat.Id);
                if (dbCat == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                dbCat.CategoryOrder = cat.Order;
                dbCat.CategoryName = cat.Name;
                dbCat.CategoryDescription = cat.Description ?? String.Empty;
                dbCat.AllowAnonymousPost = cat.AllowAnonymousPost;
                dbCat.AllowAnonymousTopic = cat.AllowAnonymousTopic;
                dbCat.IsTeam = cat.IsTeam;
                dbCat.IsModerated = cat.IsModerated;

                m_db.SaveChanges();

                var vm = Mapper.Map<MessageCategory, MessageCategoryViewModel>(dbCat);
                return Request.CreateResponse<MessageCategoryViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("categories")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage DeleteCategories(long accountId, long id)
        {
            var cat = m_db.MessageCategories.Find(id);
            if (cat == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (cat.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            m_db.MessageCategories.Remove(cat);
            m_db.SaveChanges();

            return Request.CreateResponse(HttpStatusCode.OK);
        }


        [AcceptVerbs("GET"), HttpGet]
        [ActionName("topics")]
        public HttpResponseMessage GetTopics(long accountId, long categoryId)
        {
            var topics = (from mt in m_db.MessageTopics
                    where mt.CategoryId == categoryId
                    select mt).AsEnumerable();

            var vm = Mapper.Map<IEnumerable<MessageTopic>, MessageTopicViewModel[]>(topics);
            return Request.CreateResponse<MessageTopicViewModel[]>(HttpStatusCode.OK, vm);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("topics")]
        public HttpResponseMessage PostTopic(long accountId, long categoryId, MessageTopicViewModel topic)
        {
            if (ModelState.IsValid && topic != null)
            {
                topic.CategoryId = categoryId;
                topic.CreatorContactId = 0;
                var contact = m_db.Contacts.Where(c => c.UserId == Globals.GetCurrentUserId()).SingleOrDefault();
                if (contact != null)
                {
                    topic.CreatorContactId = contact.Id;
                }
                else
                {
                    bool allowAnon = (from mc in m_db.MessageCategories
                                      where mc.Id == topic.CategoryId
                                      select mc.AllowAnonymousTopic).SingleOrDefault();
                    if (!allowAnon)
                        return Request.CreateResponse(HttpStatusCode.Forbidden);
                }

                var dbTopic = new MessageTopic()
                {
                    CategoryId = topic.CategoryId,
                    ContactCreatorId = topic.CreatorContactId,
                    TopicCreateDate = topic.CreateDate,
                    Topic = topic.TopicTitle,
                    StickyTopic = topic.StickyTopic,
                    NumberOfViews = 0
                };

                m_db.MessageTopics.Add(dbTopic);
                m_db.SaveChanges();

                var vm = Mapper.Map<MessageTopic, MessageTopicViewModel>(dbTopic);
                return Request.CreateResponse<MessageTopicViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("topics")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage DeleteTopic(long accountId, long id)
        {
            var topic = m_db.MessageTopics.Find(id);
            if (topic == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (topic.MessageCategory.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            m_db.MessageTopics.Remove(topic);
            m_db.SaveChanges();

            return Request.CreateResponse(HttpStatusCode.OK);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("messages")]
        public HttpResponseMessage GetMessages(long accountId, long topicId)
        {
            var posts = (from mp in m_db.MessagePosts
                    where mp.TopicId == topicId
                    select mp).AsEnumerable();

            var vm = Mapper.Map<IEnumerable<MessagePost>, MessagePostViewModel[]>(posts);
            return Request.CreateResponse<MessagePostViewModel[]>(HttpStatusCode.OK, vm);
        }


        [AcceptVerbs("POST"), HttpPost]
        [ActionName("messages")]
        public HttpResponseMessage PostMessage(long accountId, long topicId, MessagePostViewModel post)
        {
            if (ModelState.IsValid && post != null)
            {
                var topic = m_db.MessageTopics.Find(topicId);
                if (topic == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (topic.MessageCategory.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                post.TopicId = topic.Id;
                post.CategoryId = topic.CategoryId;
                post.CreatorContactId = 0;
                var contact = m_db.Contacts.Where(c => c.UserId == Globals.GetCurrentUserId()).SingleOrDefault();
                if (contact != null)
                {
                    post.CreatorContactId = contact.Id;
                }
                else
                {
                    bool allowAnon = (from mc in m_db.MessageCategories
                                      where mc.Id == post.CategoryId
                                      select mc.AllowAnonymousTopic).SingleOrDefault();
                    if (!allowAnon)
                        return Request.CreateResponse(HttpStatusCode.Forbidden);
                }

                var dbPost = new MessagePost()
                {
                    TopicId = post.TopicId,
                    PostOrder = post.Order,
                    ContactCreatorId = post.CreatorContactId,
                    PostDate = post.CreateDate,
                    PostText = post.Text ?? String.Empty,
                    EditDate = post.EditDate,
                    PostSubject = post.Subject,
                    CategoryId = post.CategoryId
                };

                m_db.MessagePosts.Add(dbPost);

                var vm = Mapper.Map<MessagePost, MessagePostViewModel>(dbPost);
                return Request.CreateResponse<MessagePostViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("messages")]
        public HttpResponseMessage PutMessage(long accountId, long topicId, MessagePostViewModel post)
        {
            if (ModelState.IsValid && post != null)
            {
                post.EditDate = DateTime.Now;

                var dbPost = m_db.MessagePosts.Find(post.Id);
                if (dbPost == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (dbPost.TopicId != topicId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                if (dbPost.MessageCategory.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                // only the admin or original author can modify the post.
                var userId = Globals.GetCurrentUserId();
                if (!IsAccountAdmin(accountId, userId))
                {
                    var contactId = m_db.Contacts.Where(u => u.UserId == userId).Select(u => u.Id).SingleOrDefault();
                    if (dbPost.ContactCreatorId != contactId)
                    {
                        return Request.CreateResponse(HttpStatusCode.Forbidden);
                    }
                }

                dbPost.PostText = post.Text;
                dbPost.EditDate = post.EditDate;
                dbPost.PostSubject = post.Subject;

                m_db.SaveChanges();

                var vm = Mapper.Map<MessagePost, MessagePostViewModel>(dbPost);

                return Request.CreateResponse<MessagePostViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("messages")]
        public HttpResponseMessage DeleteMessage(long accountId, long topicId, long id)
        {
            bool topicRemoved;
            topicRemoved = false;

            var dbPost = m_db.MessagePosts.Find(id);
            if (dbPost == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (dbPost.MessageTopic.Id != topicId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            if (dbPost.MessageCategory.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            // only the admin or original author can modify the post.
            var userId = Globals.GetCurrentUserId();
            if (!IsAccountAdmin(accountId, userId))
            {
                var contactId = m_db.Contacts.Where(u => u.UserId == userId).Select(u => u.Id).SingleOrDefault();
                if (dbPost.ContactCreatorId != contactId)
                {
                    return Request.CreateResponse(HttpStatusCode.Forbidden);
                }
            }

            m_db.MessagePosts.Remove(dbPost);
            m_db.SaveChanges();

            bool anyTopics = (from mp in m_db.MessagePosts
                              where mp.TopicId == dbPost.TopicId
                              select mp).Any();
            if (!anyTopics)
            {
                var dbTopic = (from mt in m_db.MessageTopics
                               where mt.Id == dbPost.TopicId
                               select mt).SingleOrDefault();
                if (dbTopic != null)
                {
                    m_db.MessageTopics.Remove(dbTopic);
                    m_db.SaveChanges();
                    topicRemoved = true;
                }
            }

            return Request.CreateResponse<bool>(HttpStatusCode.OK, topicRemoved);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("expirationdays")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage GetExpirationDays(long accountId)
        {
            string cleanupDays = GetAccountSetting(accountId, "MessageBoardCleanup");
            int expirationDays = 30;
            Int32.TryParse(cleanupDays, out expirationDays);
            if (expirationDays <= 0)
                expirationDays = 30;

            return Request.CreateResponse<int>(HttpStatusCode.OK, expirationDays);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("expirationdays")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage PostExpirationDays(long accountId, string days)
        {
            int numDays = 0;
            if (Int32.TryParse(days, out numDays))
            {
                if (numDays > 0)
                {
                    SetAccountSetting(accountId, "MessageBoardCleanup", numDays.ToString());
                    return Request.CreateResponse<int>(HttpStatusCode.OK, numDays);
                }
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        private IEnumerable<MessageCategory> GetContactTeamCategoriesWithDetails(long accountId, Contact contact, bool isAdmin)
        {
            IQueryable<long> teamIds;

            if (isAdmin)
            {
                // admin can see all teams.
                teamIds = (from cs in m_db.CurrentSeasons
                           join ls in m_db.LeagueSeasons on cs.SeasonId equals ls.SeasonId
                           join l in m_db.Leagues on ls.LeagueId equals l.Id
                           join ts in m_db.TeamsSeasons on ls.Id equals ts.LeagueSeasonId
                           where cs.AccountId == accountId
                           select ts.TeamId).Distinct();
            }
            else
            {
                // non-admin can see teams they are on Roster, a manager, or a "TeamAdmin" or "TeamPhotoAdmin"
                teamIds = (from cs in m_db.CurrentSeasons
                           join ls in m_db.LeagueSeasons on cs.SeasonId equals ls.SeasonId
                           join l in m_db.Leagues on ls.LeagueId equals l.Id
                           join ts in m_db.TeamsSeasons on ls.Id equals ts.LeagueSeasonId
                           join rs in m_db.RosterSeasons on ts.Id equals rs.TeamSeasonId
                           join r in m_db.Rosters on rs.PlayerId equals r.Id
                           where cs.AccountId == accountId && r.ContactId == contact.Id && !rs.Inactive
                           select ts.TeamId).Union(
                               (from cs in m_db.CurrentSeasons
                                join ls in m_db.LeagueSeasons on cs.SeasonId equals ls.SeasonId
                                join l in m_db.Leagues on ls.LeagueId equals l.Id
                                join ts in m_db.TeamsSeasons on ls.Id equals ts.LeagueSeasonId
                                join tsm in m_db.TeamSeasonManagers on ts.Id equals tsm.TeamSeasonId
                                where cs.AccountId == accountId && tsm.ContactId == contact.Id
                                select ts.TeamId)
                               ).Union(
                               (from cr in m_db.ContactRoles
                                join c in m_db.Contacts on cr.ContactId equals c.Id
                                join ur in m_db.AspNetRoles on cr.RoleId equals ur.Id
                                where c.CreatorAccountId == accountId && cr.ContactId == contact.Id &&
                                (ur.Name == "TeamAdmin" || ur.Name == "TeamPhotoAdmin")
                                select cr.RoleData)
                               ).Distinct();
            }

            List<MessageCategory> cats = new List<MessageCategory>();

            if (!teamIds.Any())
                return cats;

            foreach (var teamId in teamIds)
            {
                MessageCategory messageCategory = (from mc in m_db.MessageCategories
                                                   where mc.IsTeam && mc.AccountId == teamId
                                                   select mc).SingleOrDefault();

                if (messageCategory == null)
                {
                    messageCategory = new MessageCategory()
                    {
                        AccountId = teamId,
                        CategoryOrder = 0,
                        CategoryName = "{0} Chat",
                        CategoryDescription = "Discussion forum available only to logged in team members",
                        AllowAnonymousPost = false,
                        AllowAnonymousTopic = false,
                        IsTeam = true,
                        IsModerated = false
                    };

                    m_db.MessageCategories.Add(messageCategory);
                    m_db.SaveChanges();
                }

                cats.Add(messageCategory);

            }

            return cats;
        }

        private IQueryable<MessageCategory> GetContactGlobalCategoriesWithDetails(long accountId, Contact contact, bool isAdmin)
        {
            if (isAdmin || IsAccountAdmin(accountId, contact.UserId))
            {
                return m_db.MessageCategories.Where(mc => mc.AccountId == 0);
            }

            return null;
        }

        private String GetTeamNameFromTeamId(long teamId)
        {
            var team = m_db.Teams.Find(teamId);
            if (team == null)
                return null;

            var currentSeason = m_db.CurrentSeasons.Where(cs => cs.AccountId == team.AccountId).SingleOrDefault();
            if (currentSeason == null)
                return null;

            var currentLeagues = m_db.LeagueSeasons.Where(ls => ls.SeasonId == currentSeason.SeasonId).Select(ls => ls.Id);

            var teamSeason = m_db.TeamsSeasons.Where(ts => ts.TeamId == team.Id && currentLeagues.Contains(ts.LeagueSeasonId)).SingleOrDefault();
            if (teamSeason == null)
                return null;

            return (from ls in m_db.LeagueSeasons
                    join l in m_db.Leagues on ls.LeagueId equals l.Id
                    where ls.Id == teamSeason.LeagueSeasonId
                    select l.Name + " " + teamSeason.Name).SingleOrDefault();
        }

    }
}
