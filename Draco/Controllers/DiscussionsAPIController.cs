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
using System.Threading.Tasks;
using System.Web.Http;

namespace SportsManager.Controllers
{
    public class DiscussionsAPIController : DBApiController
    {
        public DiscussionsAPIController(DB db) : base(db)
        {
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("categories")]
        public HttpResponseMessage GetCategories(long accountId)
        {
            var categories = Db.MessageCategories.Where(mc => mc.AccountId == accountId && !mc.IsTeam).ToList();

            String userId = Globals.GetCurrentUserId();
            Contact contact = this.GetCurrentContact(accountId);

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
        public async Task<HttpResponseMessage> PostCategories(long accountId, MessageCategoryViewModel cat)
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

                Db.MessageCategories.Add(dbCat);
                await Db.SaveChangesAsync();

                var vm = Mapper.Map<MessageCategory, MessageCategoryViewModel>(dbCat);
                return Request.CreateResponse<MessageCategoryViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("categories")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> PutCategories(long accountId, MessageCategoryViewModel cat)
        {
            if (ModelState.IsValid && cat != null)
            {
                cat.AccountId = accountId;

                var dbCat = await Db.MessageCategories.FindAsync(cat.Id);
                if (dbCat == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                dbCat.CategoryOrder = cat.Order;
                dbCat.CategoryName = cat.Name;
                dbCat.CategoryDescription = cat.Description ?? String.Empty;
                dbCat.AllowAnonymousPost = cat.AllowAnonymousPost;
                dbCat.AllowAnonymousTopic = cat.AllowAnonymousTopic;
                dbCat.IsTeam = cat.IsTeam;
                dbCat.IsModerated = cat.IsModerated;

                await Db.SaveChangesAsync();

                var vm = Mapper.Map<MessageCategory, MessageCategoryViewModel>(dbCat);
                return Request.CreateResponse<MessageCategoryViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("categories")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> DeleteCategories(long accountId, long id)
        {
            var cat = await Db.MessageCategories.FindAsync(id);
            if (cat == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (cat.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            Db.MessageCategories.Remove(cat);
            await Db.SaveChangesAsync();

            return Request.CreateResponse(HttpStatusCode.OK);
        }


        [AcceptVerbs("GET"), HttpGet]
        [ActionName("topics")]
        public HttpResponseMessage GetTopics(long accountId, long categoryId)
        {
            var topics = (from mt in Db.MessageTopics
                    where mt.CategoryId == categoryId
                    select mt).AsEnumerable();

            var vm = Mapper.Map<IEnumerable<MessageTopic>, MessageTopicViewModel[]>(topics);
            return Request.CreateResponse<MessageTopicViewModel[]>(HttpStatusCode.OK, vm);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("topics")]
        public async Task<HttpResponseMessage> PostTopic(long accountId, long categoryId, MessageTopicViewModel topic)
        {
            if (ModelState.IsValid && topic != null)
            {
                topic.CategoryId = categoryId;
                topic.CreatorContactId = 0;
                Contact contact = this.GetCurrentContact(accountId);
                if (contact != null)
                {
                    topic.CreatorContactId = contact.Id;
                }
                else
                {
                    bool allowAnon = (from mc in Db.MessageCategories
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

                Db.MessageTopics.Add(dbTopic);
                await Db.SaveChangesAsync();

                var vm = Mapper.Map<MessageTopic, MessageTopicViewModel>(dbTopic);
                return Request.CreateResponse<MessageTopicViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("topics")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> DeleteTopic(long accountId, long id)
        {
            var topic = await Db.MessageTopics.FindAsync(id);
            if (topic == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (topic.MessageCategory.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            Db.MessageTopics.Remove(topic);
            await Db.SaveChangesAsync();

            return Request.CreateResponse(HttpStatusCode.OK);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("messages")]
        public HttpResponseMessage GetMessages(long accountId, long topicId)
        {
            var posts = (from mp in Db.MessagePosts
                    where mp.TopicId == topicId
                    select mp).AsEnumerable();

            var vm = Mapper.Map<IEnumerable<MessagePost>, MessagePostViewModel[]>(posts);
            return Request.CreateResponse<MessagePostViewModel[]>(HttpStatusCode.OK, vm);
        }


        [AcceptVerbs("POST"), HttpPost]
        [ActionName("messages")]
        public async Task<HttpResponseMessage> PostMessage(long accountId, long topicId, MessagePostViewModel post)
        {
            if (ModelState.IsValid && post != null)
            {
                var topic = await Db.MessageTopics.FindAsync(topicId);
                if (topic == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (topic.MessageCategory.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                post.TopicId = topic.Id;
                post.CategoryId = topic.CategoryId;
                post.CreatorContactId = 0;
                Contact contact = this.GetCurrentContact(accountId);
                if (contact != null)
                {
                    post.CreatorContactId = contact.Id;
                }
                else
                {
                    bool allowAnon = (from mc in Db.MessageCategories
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

                Db.MessagePosts.Add(dbPost);
                await Db.SaveChangesAsync();

                var vm = Mapper.Map<MessagePost, MessagePostViewModel>(dbPost);
                return Request.CreateResponse<MessagePostViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("messages")]
        public async Task<HttpResponseMessage> PutMessage(long accountId, long topicId, MessagePostViewModel post)
        {
            if (ModelState.IsValid && post != null)
            {
                post.EditDate = DateTime.Now;

                var dbPost = await Db.MessagePosts.FindAsync(post.Id);
                if (dbPost == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (dbPost.TopicId != topicId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                if (dbPost.MessageCategory.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                // only the admin or original author can modify the post.
                var userId = Globals.GetCurrentUserId();
                if (!this.IsAccountAdmin(accountId, userId))
                {
                    var contactId = Db.Contacts.Where(u => u.UserId == userId && u.CreatorAccountId == accountId).Select(u => u.Id).SingleOrDefault();
                    if (dbPost.ContactCreatorId != contactId)
                    {
                        return Request.CreateResponse(HttpStatusCode.Forbidden);
                    }
                }

                dbPost.PostText = post.Text;
                dbPost.EditDate = post.EditDate;
                dbPost.PostSubject = post.Subject;

                await Db.SaveChangesAsync();

                var vm = Mapper.Map<MessagePost, MessagePostViewModel>(dbPost);

                return Request.CreateResponse<MessagePostViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("messages")]
        public async Task<HttpResponseMessage> DeleteMessage(long accountId, long topicId, long id)
        {
            var dbPost = await Db.MessagePosts.FindAsync(id);
            if (dbPost == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (dbPost.MessageTopic.Id != topicId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            if (dbPost.MessageCategory.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            // only the admin or original author can modify the post.
            var userId = Globals.GetCurrentUserId();
            if (!this.IsAccountAdmin(accountId, userId))
            {
                var contactId = Db.Contacts.Where(u => u.UserId == userId && u.CreatorAccountId == accountId).Select(u => u.Id).SingleOrDefault();
                if (dbPost.ContactCreatorId != contactId)
                {
                    return Request.CreateResponse(HttpStatusCode.Forbidden);
                }
            }

            Db.MessagePosts.Remove(dbPost);
            await Db.SaveChangesAsync();

            bool topicRemoved = this.CleanupEmptyMessageTopics(dbPost.TopicId);
            return Request.CreateResponse<bool>(HttpStatusCode.OK, topicRemoved);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("expirationdays")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage GetExpirationDays(long accountId)
        {
            string cleanupDays = this.GetAccountSetting(accountId, "MessageBoardCleanup");
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
                    this.SetAccountSetting(accountId, "MessageBoardCleanup", numDays.ToString());
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
                teamIds = (from cs in Db.CurrentSeasons
                           join ls in Db.LeagueSeasons on cs.SeasonId equals ls.SeasonId
                           join l in Db.Leagues on ls.LeagueId equals l.Id
                           join ts in Db.TeamsSeasons on ls.Id equals ts.LeagueSeasonId
                           where cs.AccountId == accountId
                           select ts.TeamId).Distinct();
            }
            else
            {
                // non-admin can see teams they are on Roster, a manager, or a "TeamAdmin" or "TeamPhotoAdmin"
                teamIds = (from cs in Db.CurrentSeasons
                           join ls in Db.LeagueSeasons on cs.SeasonId equals ls.SeasonId
                           join l in Db.Leagues on ls.LeagueId equals l.Id
                           join ts in Db.TeamsSeasons on ls.Id equals ts.LeagueSeasonId
                           join rs in Db.RosterSeasons on ts.Id equals rs.TeamSeasonId
                           join r in Db.Rosters on rs.PlayerId equals r.Id
                           where cs.AccountId == accountId && r.ContactId == contact.Id && !rs.Inactive
                           select ts.TeamId).Union(
                               (from cs in Db.CurrentSeasons
                                join ls in Db.LeagueSeasons on cs.SeasonId equals ls.SeasonId
                                join l in Db.Leagues on ls.LeagueId equals l.Id
                                join ts in Db.TeamsSeasons on ls.Id equals ts.LeagueSeasonId
                                join tsm in Db.TeamSeasonManagers on ts.Id equals tsm.TeamSeasonId
                                where cs.AccountId == accountId && tsm.ContactId == contact.Id
                                select ts.TeamId)
                               ).Union(
                               (from cr in Db.ContactRoles
                                join c in Db.Contacts on cr.ContactId equals c.Id
                                join ur in Db.AspNetRoles on cr.RoleId equals ur.Id
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
                MessageCategory messageCategory = (from mc in Db.MessageCategories
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

                    Db.MessageCategories.Add(messageCategory);
                    Db.SaveChanges();
                }

                cats.Add(messageCategory);

            }

            return cats;
        }

        private IQueryable<MessageCategory> GetContactGlobalCategoriesWithDetails(long accountId, Contact contact, bool isAdmin)
        {
            if (isAdmin || this.IsAccountAdmin(accountId, contact.UserId))
            {
                return Db.MessageCategories.Where(mc => mc.AccountId == 0);
            }

            return null;
        }

        private String GetTeamNameFromTeamId(long teamId)
        {
            var team = Db.Teams.Find(teamId);
            if (team == null)
                return null;

            var currentSeason = this.GetCurrentSeasonId(team.AccountId);
            if (currentSeason == 0)
                return null;

            var currentLeagues = Db.LeagueSeasons.Where(ls => ls.SeasonId == currentSeason).Select(ls => ls.Id);

            var teamSeason = Db.TeamsSeasons.Where(ts => ts.TeamId == team.Id && currentLeagues.Contains(ts.LeagueSeasonId)).SingleOrDefault();
            if (teamSeason == null)
                return null;

            return (from ls in Db.LeagueSeasons
                    join l in Db.Leagues on ls.LeagueId equals l.Id
                    where ls.Id == teamSeason.LeagueSeasonId
                    select l.Name + " " + teamSeason.Name).SingleOrDefault();
        }

    }
}
