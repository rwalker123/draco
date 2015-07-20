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
    public class PlayerSurveyAPIController : DBApiController
    {
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("activesurveys")]
        public HttpResponseMessage GetActivePlayersWithSurveys(long accountId)
        {
            int pageSize = 20;

            var queryValues = Request.RequestUri.ParseQueryString();
            int pageNo = 0;
            String strPageNo = queryValues["pageNo"];
            if (!String.IsNullOrEmpty(strPageNo))
                int.TryParse(strPageNo, out pageNo);

            var currentSeasonId = m_db.CurrentSeasons.Where(cs => cs.AccountId == accountId).Select(cs => cs.SeasonId).SingleOrDefault();

            var profiles = (
                from pp in m_db.PlayerProfiles
                join c in m_db.Contacts on pp.PlayerId equals c.Id
                join r in m_db.Rosters on c.Id equals r.ContactId
                join rs in m_db.RosterSeasons on r.Id equals rs.PlayerId
                join ts in m_db.TeamsSeasons on rs.TeamSeasonId equals ts.Id
                join ls in m_db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                where r.AccountId == accountId && ls.SeasonId == currentSeasonId
                select c).Distinct()
                          .OrderBy(x => x.LastName)
                          .ThenBy(x => x.FirstName)
                          .Skip(pageNo * pageSize)
                          .Take(pageSize).AsEnumerable();

            var vm = Mapper.Map<IEnumerable<Contact>, ContactNameViewModel[]>(profiles);
            return Request.CreateResponse<ContactNameViewModel[]>(HttpStatusCode.OK, vm);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("randomteamsurvey")]
        public HttpResponseMessage GetRandomTeamPlayerWithSurveys(long accountId, long id)
        {
            // first get a random player on the team who has answered the survey.
            var currentSeasonId = m_db.CurrentSeasons.Where(cs => cs.AccountId == accountId).Select(cs => cs.SeasonId).SingleOrDefault();

            var qry = (from pp in m_db.PlayerProfiles
                    join c in m_db.Contacts on pp.PlayerId equals c.Id
                    join r in m_db.Rosters on c.Id equals r.ContactId
                    join rs in m_db.RosterSeasons on r.Id equals rs.PlayerId
                    join ts in m_db.TeamsSeasons on rs.TeamSeasonId equals ts.Id
                    join ls in m_db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                    where r.AccountId == accountId && ls.SeasonId == currentSeasonId &&
                    ts.Id == id && !rs.Inactive
                    select pp.PlayerId).Distinct();


            int count = qry.Count();
            int index = new Random().Next(count);

            var playerId = qry.Skip(index).FirstOrDefault();
            if (playerId != null)
            {
                // next get a random answer from the player.
                var playerAnswers = (from pc in m_db.ProfileCategories
                                     join pq in m_db.ProfileQuestions on pc.Id equals pq.CategoryId
                                     join pp in m_db.PlayerProfiles on pq.Id equals pp.QuestionId
                                     where pp.PlayerId == playerId && pp.Answer != null
                                     orderby pc.Priority, pq.QuestionNum
                                     select pp);

                count = playerAnswers.Count();
                index = new Random().Next(count);
                ProfileQuestionAnswer theAnswer = playerAnswers.Skip(index).FirstOrDefault();
                if (theAnswer != null)
                {
                    var vm = Mapper.Map<ProfileQuestionAnswer, ProfileAnswersViewModel>(theAnswer);
                    return Request.CreateResponse<ProfileAnswersViewModel>(HttpStatusCode.OK, vm);
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

                    return Request.CreateResponse<ProfileAnswersViewModel>(HttpStatusCode.OK, obj);
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
        public HttpResponseMessage UpdatePlayerQuestionAnswer(long accountId, long id, ProfileQuestionAnswer data)
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
