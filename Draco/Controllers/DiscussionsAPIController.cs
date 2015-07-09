using Microsoft.AspNet.Identity;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using SportsManager.Models;
using System;
using System.Linq;
using ModelObjects;
using SportsManager.ViewModels.API;

namespace SportsManager.Controllers
{
    public class DiscussionsAPIController : ApiController
    {
        private DB m_db;
        public DiscussionsAPIController(DB db)
        {
            m_db = db;
        }

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

            return Request.CreateResponse<IEnumerable<MessageCategoryViewModel>>(HttpStatusCode.OK, vm);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("categories")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage PostCategories(long accountId, ModelObjects.MessageCategory cat)
        {
            if (ModelState.IsValid)
            {
                cat.AccountId = accountId;

                if (DataAccess.MessageBoard.AddCategory(cat) > 0)
                    return Request.CreateResponse<ModelObjects.MessageCategory>(HttpStatusCode.OK, cat);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("categories")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage PutCategories(long accountId, ModelObjects.MessageCategory cat)
        {
            if (ModelState.IsValid)
            {
                cat.AccountId = accountId;

                if (DataAccess.MessageBoard.UpdateCategory(cat))
                    return Request.CreateResponse<ModelObjects.MessageCategory>(HttpStatusCode.OK, cat);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("categories")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage DeleteCategories(long accountId, long id)
        {
            if (DataAccess.MessageBoard.RemoveCategory(id))
                return Request.CreateResponse(HttpStatusCode.OK);

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }


        [AcceptVerbs("GET"), HttpGet]
        [ActionName("topics")]
        public HttpResponseMessage GetTopics(long accountId, long categoryId)
        {
            var topics = DataAccess.MessageBoard.GetTopicsWithDetails(categoryId);

            return Request.CreateResponse<IEnumerable<ModelObjects.MessageTopic>>(HttpStatusCode.OK, topics);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("topics")]
        public HttpResponseMessage PostTopic(long accountId, long categoryId, ModelObjects.MessageTopic topic)
        {
            if (ModelState.IsValid)
            {
                topic.CategoryId = categoryId;
                topic.ContactCreatorId = 0;
                var contact = DataAccess.Contacts.GetContact(Globals.GetCurrentUserId());
                if (contact != null)
                    topic.ContactCreatorId = contact.Id;

                if (DataAccess.MessageBoard.AddTopic(topic) > 0)
                {
                    topic.Name = DataAccess.Contacts.GetContactName(topic.CreatorContactId);
                    return Request.CreateResponse<ModelObjects.MessageTopic>(HttpStatusCode.OK, topic);
                }
            }
            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("topics")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage DeleteTopic(long accountId, long id)
        {
            if (DataAccess.MessageBoard.RemoveTopic(id))
                return Request.CreateResponse(HttpStatusCode.OK);

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("messages")]
        public HttpResponseMessage GetMessages(long accountId, long topicId)
        {
            var posts = DataAccess.MessageBoard.GetPosts(topicId);

            return Request.CreateResponse<IEnumerable<ModelObjects.MessagePost>>(HttpStatusCode.OK, posts);
        }


        [AcceptVerbs("POST"), HttpPost]
        [ActionName("messages")]
        public HttpResponseMessage PostMessage(long accountId, long topicId, ModelObjects.MessagePost post)
        {
            if (ModelState.IsValid)
            {
                var topic = DataAccess.MessageBoard.GetTopic(topicId);
                if (topic == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                post.TopicId = topic.Id;
                post.CategoryId = topic.CategoryId;
                post.ContactCreatorId = 0;
                var contact = DataAccess.Contacts.GetContact(Globals.GetCurrentUserId());
                if (contact != null)
                    post.ContactCreatorId = contact.Id;

                if (DataAccess.MessageBoard.AddPost(post) > 0)
                    return Request.CreateResponse<ModelObjects.MessagePost>(HttpStatusCode.OK, post);
            }
            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("messages")]
        public HttpResponseMessage PutMessage(long accountId, long topicId, long id, ModelObjects.MessagePost post)
        {
            if (ModelState.IsValid)
            {
                post.EditDate = DateTime.Now;
                if (DataAccess.MessageBoard.ModifyPost(accountId, post))
                    return Request.CreateResponse<ModelObjects.MessagePost>(HttpStatusCode.OK, post);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("messages")]
        public HttpResponseMessage DeleteMessage(long accountId, long topicId, long id)
        {
            bool topicRemoved;
            if (DataAccess.MessageBoard.RemoveMessagePost(accountId, id, out topicRemoved))
                return Request.CreateResponse<bool>(HttpStatusCode.OK, topicRemoved);

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("expirationdays")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage GetExpirationDays(long accountId)
        {
            var expirationDays = DataAccess.MessageBoard.GetExpirationDays(accountId);

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
                    DataAccess.MessageBoard.SetExpirationDays(accountId, numDays);

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
            if (isAdmin || DataAccess.Accounts.IsAccountAdmin(accountId, contact.UserId))
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
