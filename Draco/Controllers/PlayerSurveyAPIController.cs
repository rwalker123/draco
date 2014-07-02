using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Collections.Generic;
using ModelObjects;
using SportsManager.Models;
using System;

namespace SportsManager.Controllers
{
    public class PlayerSurveyAPIController : ApiController
    {
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("activesurveys")]
        public HttpResponseMessage GetActivePlayersWithSurveys(long accountId)
        {
            var playersWithProfiles = DataAccess.ProfileAdmin.GetPlayersWithProfiles(accountId);
 
            return Request.CreateResponse<IQueryable<ModelObjects.PlayerProfile>>(HttpStatusCode.OK, playersWithProfiles);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("randomteamsurvey")]
        public HttpResponseMessage GetRandomTeamPlayerWithSurveys(long accountId, long id)
        {
            var playerProfile = DataAccess.ProfileAdmin.GetTeamProfileSpotlight(accountId, id);
            if (playerProfile != null)
            {
                var playerAnswers = DataAccess.ProfileAdmin.GetPlayerQuestionAnswer(accountId, playerProfile.PlayerId);
                int count = playerAnswers.Count();
                int index = new Random().Next(count);
                ProfileQuestionAnswer theAnswer = playerAnswers.Skip(index).FirstOrDefault();
                if (theAnswer != null)
                {
                    ProfileQuestionItem theQuestion = DataAccess.ProfileAdmin.GetQuestion(theAnswer.QuestionId);

                    var obj = new
                    {
                        PlayerProfile = playerProfile,
                        Answer = theAnswer,
                        Question = theQuestion
                    };

                    return Request.CreateResponse(HttpStatusCode.OK, obj);
                }
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("randomsurvey")]
        public HttpResponseMessage GetRandomPlayerSurveys(long accountId)
        {
            var playerProfile = DataAccess.ProfileAdmin.GetProfileSpotlight(accountId);
            if (playerProfile != null)
            {
                var playerAnswers = DataAccess.ProfileAdmin.GetPlayerQuestionAnswer(accountId, playerProfile.PlayerId);
                int count = playerAnswers.Count();
                int index = new Random().Next(count);
                ProfileQuestionAnswer theAnswer = playerAnswers.Skip(index).FirstOrDefault();
                if (theAnswer != null)
                {
                    ProfileQuestionItem theQuestion = DataAccess.ProfileAdmin.GetQuestion(theAnswer.QuestionId);

                    var obj = new
                    {
                        PlayerProfile = playerProfile,
                        Answer = theAnswer,
                        Question = theQuestion
                    };

                    return Request.CreateResponse(HttpStatusCode.OK, obj);
                }
            }

            return Request.CreateResponse(HttpStatusCode.NotFound);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("playeranswers")]
        public HttpResponseMessage GetPlayerAnswers(long accountId, long id)
        {
            var playerAnswers = DataAccess.ProfileAdmin.GetPlayerQuestionAnswer(accountId, id);

            return Request.CreateResponse<IQueryable<ModelObjects.ProfileQuestionAnswer>>(HttpStatusCode.OK, playerAnswers);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("questions")]
        public HttpResponseMessage GetQuestionsWithCategories(long accountId)
        {
            var categories = DataAccess.ProfileAdmin.GetCategories(accountId);

            return Request.CreateResponse<IQueryable<ModelObjects.ProfileCategoryItem>>(HttpStatusCode.OK, categories);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("questions")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage AddQuestion(long accountId, long id, ProfileQuestionItem data)
        {
            if (ModelState.IsValid && data != null)
            {
                if (DataAccess.ProfileAdmin.AddQuestion(data))
                    return Request.CreateResponse<ProfileQuestionItem>(HttpStatusCode.OK, data);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("questions")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage UpdateQuestion(long accountId, long id, ProfileQuestionItem data)
        {
            if (ModelState.IsValid && data != null)
            {
                if (DataAccess.ProfileAdmin.ModifyQuestion(data))
                    return Request.CreateResponse<ProfileQuestionItem>(HttpStatusCode.OK, data);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("questions")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage DeleteQuestion(long accountId, long id)
        {
            if (DataAccess.ProfileAdmin.RemoveQuestion(id))
                return Request.CreateResponse(HttpStatusCode.OK);

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }


        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("questionAnswer")]
        public HttpResponseMessage GetQuestionsWithCategories(long accountId, long id, ProfileQuestionAnswer data)
        {
            var aspNetUserId = Globals.GetCurrentUserId();
            var currentContactId = DataAccess.Contacts.GetContactId(aspNetUserId);
            if (currentContactId != id && !DataAccess.Accounts.IsAccountAdmin(accountId, aspNetUserId))
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            if (DataAccess.ProfileAdmin.UpdatePlayerQuestionAnswer(accountId, data))
                return Request.CreateResponse<ProfileQuestionAnswer>(HttpStatusCode.OK, data);
            else
                return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("categories")]
        [SportsManagerAuthorize(Roles="AccountAdmin")]
        public HttpResponseMessage AddCategory(long accountId, ProfileCategoryItem data)
        {
            if (ModelState.IsValid && data != null)
            {
                if (DataAccess.ProfileAdmin.AddCategory(data))
                    return Request.CreateResponse<ProfileCategoryItem>(HttpStatusCode.OK, data);
            }
            
            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("categories")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage UpdateCategory(long accountId, ProfileCategoryItem data)
        {
            if (ModelState.IsValid && data != null)
            {
                if (DataAccess.ProfileAdmin.ModifyCategory(data))
                    return Request.CreateResponse<ProfileCategoryItem>(HttpStatusCode.OK, data);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("categories")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage DeleteCategory(long accountId, long id)
        {
            if (DataAccess.ProfileAdmin.RemoveCategory(id))
                return Request.CreateResponse(HttpStatusCode.OK);

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }
    }
}
