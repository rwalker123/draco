using Microsoft.AspNet.Identity;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using SportsManager.Models;
using System;

namespace SportsManager.Controllers
{
    public class DiscussionsAPIController : ApiController
    {
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("categories")]
        public HttpResponseMessage GetCategories(long accountId)
        {
            List<ModelObjects.MessageCategory> categories = new List<ModelObjects.MessageCategory>();

            categories.AddRange(DataAccess.MessageBoard.GetCategoriesWithDetails(accountId));

            String userId = Globals.GetCurrentUserId();
            ModelObjects.Contact contact = DataAccess.Contacts.GetContact(userId);

            bool isAdmin = false;

            if (contact == null && !String.IsNullOrEmpty(userId))
            {
                // check to see if in AspNetUserRoles as Administrator
                var userManager = Globals.GetUserManager();
                isAdmin = userManager.IsInRole(userId, "Administrator");
            }
            if (contact != null || isAdmin)
            {
                categories.AddRange(DataAccess.MessageBoard.GetContactTeamCategoriesWithDetails(accountId, contact));
                categories.AddRange(DataAccess.MessageBoard.GetContactGlobalCategoriesWithDetails(accountId, contact));
            }

            return Request.CreateResponse<IEnumerable<ModelObjects.MessageCategory>>(HttpStatusCode.OK, categories);
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
                topic.CreatorContactId = 0;
                var contact = DataAccess.Contacts.GetContact(Globals.GetCurrentUserId());
                if (contact != null)
                    topic.CreatorContactId = contact.Id;

                if (DataAccess.MessageBoard.AddTopic(topic) > 0)
                {
                    topic.CreatorName = DataAccess.Contacts.GetContactName(topic.CreatorContactId);
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
                post.CreatorContactId = 0;
                var contact = DataAccess.Contacts.GetContact(Globals.GetCurrentUserId());
                if (contact != null)
                    post.CreatorContactId = contact.Id;

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
    }
}
