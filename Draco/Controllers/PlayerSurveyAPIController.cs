using AutoMapper;
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
    public class PlayerSurveyAPIController : DBApiController
    {
        public PlayerSurveyAPIController(DB db) : base(db)
        {
        }

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

            var currentSeasonId = this.GetCurrentSeasonId(accountId);

            var profiles = (
                from pp in Db.PlayerProfiles
                join c in Db.Contacts on pp.PlayerId equals c.Id
                join r in Db.Rosters on c.Id equals r.ContactId
                join rs in Db.RosterSeasons on r.Id equals rs.PlayerId
                join ts in Db.TeamsSeasons on rs.TeamSeasonId equals ts.Id
                join ls in Db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                where c.CreatorAccountId == accountId && ls.SeasonId == currentSeasonId
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
            var currentSeasonId = this.GetCurrentSeasonId(accountId);

            var qry = (from pp in Db.PlayerProfiles
                    join c in Db.Contacts on pp.PlayerId equals c.Id
                    join r in Db.Rosters on c.Id equals r.ContactId
                    join rs in Db.RosterSeasons on r.Id equals rs.PlayerId
                    join ts in Db.TeamsSeasons on rs.TeamSeasonId equals ts.Id
                    join ls in Db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                    where c.CreatorAccountId == accountId && ls.SeasonId == currentSeasonId &&
                    ts.Id == id && !rs.Inactive
                    select pp.PlayerId).Distinct();


            int count = qry.Count();
            int index = new Random().Next(count);

            var playerId = qry.OrderBy(x => x).Skip(index).FirstOrDefault();
            if (playerId > 0)
            {
                // next get a random answer from the player.
                var playerAnswers = (from pc in Db.ProfileCategories
                                     join pq in Db.ProfileQuestions on pc.Id equals pq.CategoryId
                                     join pp in Db.PlayerProfiles on pq.Id equals pp.QuestionId
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
            var currentSeasonId = this.GetCurrentSeasonId(accountId);

            var qry = (
                from pp in Db.PlayerProfiles
                join c in Db.Contacts on pp.PlayerId equals c.Id
                join r in Db.Rosters on c.Id equals r.ContactId
                join rs in Db.RosterSeasons on r.Id equals rs.PlayerId
                join ts in Db.TeamsSeasons on rs.TeamSeasonId equals ts.Id
                join ls in Db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                where c.CreatorAccountId == accountId && ls.SeasonId == currentSeasonId
                select pp).Distinct();

            int count = qry.Count();
            int index = new Random().Next(count);

            var playerProfile = qry.OrderBy(p => p.Id).Skip(index).FirstOrDefault();

            if (playerProfile != null)
            {
                // next get a random answer from the player.
                var playerAnswers = (from pc in Db.ProfileCategories
                                     join pq in Db.ProfileQuestions on pc.Id equals pq.CategoryId
                                     join pp in Db.PlayerProfiles on pq.Id equals pp.QuestionId
                                     where pp.PlayerId == playerProfile.PlayerId && pp.Answer != null
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
        [ActionName("playeranswers")]
        public HttpResponseMessage GetPlayerAnswers(long accountId, long id)
        {
            var playerAnswers = (from pc in Db.ProfileCategories
                                 join pq in Db.ProfileQuestions on pc.Id equals pq.CategoryId
                                 join pp in Db.PlayerProfiles on pq.Id equals pp.QuestionId
                                 where pp.PlayerId == id && pp.Answer != null
                                 orderby pc.Priority, pq.QuestionNum
                                 select pp).AsEnumerable();

            var vm = Mapper.Map<IEnumerable<ProfileQuestionAnswer>, ProfileAnswersViewModel[]>(playerAnswers);
            return Request.CreateResponse<ProfileAnswersViewModel[]>(HttpStatusCode.OK, vm);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("questions")]
        public HttpResponseMessage GetQuestionsWithCategories(long accountId)
        {
            var categories = (from pc in Db.ProfileCategories
                              where pc.AccountId == accountId
                              orderby pc.Priority
                              select pc);
            var vm = Mapper.Map<IEnumerable<ProfileCategoryItem>, ProfileCategoryViewModel[]>(categories);
            return Request.CreateResponse<ProfileCategoryViewModel[]>(HttpStatusCode.OK, vm);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("questions")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> AddQuestion(long accountId, long id, ProfileQuestionViewModel data)
        {
            if (ModelState.IsValid)
            {
                var dbCategory = await Db.ProfileCategories.FindAsync(id);
                if (dbCategory == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (dbCategory.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                var dbQuestion = new ProfileQuestionItem()
                {
                    ProfileCategory = dbCategory,
                    Question = data.Question,
                    QuestionNum = data.QuestionNum
                };

                Db.ProfileQuestions.Add(dbQuestion);
                await Db.SaveChangesAsync();

                var vm = Mapper.Map<ProfileQuestionItem, ProfileQuestionViewModel>(dbQuestion);
                return Request.CreateResponse<ProfileQuestionViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("questions")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> UpdateQuestion(long accountId, long id, ProfileQuestionViewModel data)
        {
            if (ModelState.IsValid)
            {
                var dbQuestion = await Db.ProfileQuestions.FindAsync(id);
                if (dbQuestion == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (dbQuestion.ProfileCategory.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                dbQuestion.QuestionNum = data.QuestionNum;
                dbQuestion.Question = data.Question;

                await Db.SaveChangesAsync();

                var vm = Mapper.Map<ProfileQuestionItem, ProfileQuestionViewModel>(dbQuestion);
                return Request.CreateResponse<ProfileQuestionViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("questions")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> DeleteQuestion(long accountId, long id)
        {
            var dbQuestion = await Db.ProfileQuestions.FindAsync(id);
            if (dbQuestion == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (dbQuestion.ProfileCategory.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            Db.ProfileQuestions.Remove(dbQuestion);
            await Db.SaveChangesAsync();

            return Request.CreateResponse(HttpStatusCode.OK);
        }


        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("questionAnswer")]
        public async Task<HttpResponseMessage> UpdatePlayerQuestionAnswer(long accountId, long id, ProfileAnswersViewModel data)
        {
            if (ModelState.IsValid)
            {
                var aspNetUserId = Globals.GetCurrentUserId();
                Contact contact = this.GetCurrentContact(accountId);

                var isAccountAdmin = this.IsAccountAdmin(accountId, aspNetUserId);
                if (contact.Id != id && !isAccountAdmin)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                var questionAnswer = (from pp in Db.PlayerProfiles
                                      where pp.PlayerId == data.PlayerId && pp.QuestionId == data.QuestionId
                                      select pp).SingleOrDefault();

                if (questionAnswer == null)
                {
                    if (String.IsNullOrEmpty(data.Answer))
                        return Request.CreateResponse(HttpStatusCode.BadRequest);

                    questionAnswer = new ProfileQuestionAnswer()
                    {
                        PlayerId = data.PlayerId,
                        QuestionId = data.QuestionId,
                        Answer = data.Answer
                    };

                    Db.PlayerProfiles.Add(questionAnswer);
                    await Db.SaveChangesAsync();
                }
                else
                {
                    if (questionAnswer.Contact.Id != id && !isAccountAdmin) // id passed in does not equal owner of question.
                        return Request.CreateResponse(HttpStatusCode.Forbidden);

                    // no answer, just delete the questionAnswer.
                    if (String.IsNullOrEmpty(data.Answer))
                    {
                        Db.PlayerProfiles.Remove(questionAnswer);
                        await Db.SaveChangesAsync();
                        return Request.CreateResponse(HttpStatusCode.NoContent);
                    }
                    else
                    {
                        questionAnswer.Answer = data.Answer;
                        await Db.SaveChangesAsync();
                    }
                }

                var vm = Mapper.Map<ProfileQuestionAnswer, ProfileAnswersViewModel>(questionAnswer);
                return Request.CreateResponse<ProfileAnswersViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("categories")]
        [SportsManagerAuthorize(Roles="AccountAdmin")]
        public async Task<HttpResponseMessage> AddCategory(long accountId, ProfileCategoryViewModel data)
        {
            if (ModelState.IsValid)
            {
                var dbCategory = new ProfileCategoryItem()
                {
                    AccountId = accountId,
                    CategoryName = data.CategoryName,
                    Priority = data.Priority
                };

                Db.ProfileCategories.Add(dbCategory);
                await Db.SaveChangesAsync();

                var vm = Mapper.Map<ProfileCategoryItem, ProfileCategoryViewModel>(dbCategory);
                return Request.CreateResponse<ProfileCategoryViewModel>(HttpStatusCode.OK, vm);
            }
            
            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("categories")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> UpdateCategory(long accountId, ProfileCategoryViewModel data)
        {
            if (ModelState.IsValid)
            {
                var dbCategory = await Db.ProfileCategories.FindAsync(data.Id);
                if (dbCategory == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (dbCategory.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);
                
                dbCategory.CategoryName = data.CategoryName;
                dbCategory.Priority = data.Priority;

                await Db.SaveChangesAsync();

                var vm = Mapper.Map<ProfileCategoryItem, ProfileCategoryViewModel>(dbCategory);
                return Request.CreateResponse<ProfileCategoryViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("categories")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public async Task<HttpResponseMessage> DeleteCategory(long accountId, long id)
        {
            var dbCategory = await Db.ProfileCategories.FindAsync(id);
            if (dbCategory == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (dbCategory.AccountId == accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            Db.ProfileCategories.Remove(dbCategory);
            await Db.SaveChangesAsync();

            return Request.CreateResponse(HttpStatusCode.OK);
        }
    }
}
