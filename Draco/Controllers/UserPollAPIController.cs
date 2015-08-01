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
    public class UserPollAPIController : DBApiController
    {
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("activepolls")]
        public HttpResponseMessage GetActiveUserPolls(long accountId)
        {
            var userPolls = (from vq in m_db.VoteQuestions
                             where vq.AccountId == accountId && vq.Active
                             select vq);

            var vm = Mapper.Map<IEnumerable<VoteQuestion>, VoteQuestionResultsViewModel[]>(userPolls);
            return Request.CreateResponse<VoteQuestionResultsViewModel[]>(HttpStatusCode.OK, vm);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("polls")]
        public HttpResponseMessage GetUserPolls(long accountId)
        {
            var userPolls = (from vq in m_db.VoteQuestions
                             where vq.AccountId == accountId
                             select vq);
            var vm = Mapper.Map<IEnumerable<VoteQuestion>, VoteQuestionResultsViewModel[]>(userPolls);
            return Request.CreateResponse<VoteQuestionResultsViewModel[]>(HttpStatusCode.OK, vm);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("recordVote")]
        public HttpResponseMessage RecordVote(long accountId, long id, RecordVoteResultViewModel vr)
        {
            var contact = GetCurrentContact();

            // only current signed in user can vote.
            if (contact == null || vr.ContactId != contact.Id)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            var voteQuestion = m_db.VoteQuestions.Find(id);
            if (voteQuestion == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (voteQuestion.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            var voteOption = m_db.VoteOptions.Find(vr.OptionId);
            if (voteOption == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (voteOption.QuestionId != id)
                return Request.CreateResponse(HttpStatusCode.BadRequest);

            var dbVoteAnswer = voteQuestion.VoteAnswers.Where(va => va.ContactId == contact.Id).SingleOrDefault();
            if (dbVoteAnswer == null)
            {
                dbVoteAnswer = new VoteAnswer()
                {
                    OptionId = vr.OptionId,
                    QuestionId = id,
                    ContactId = contact.Id
                };

                m_db.VoteAnswers.Add(dbVoteAnswer);
            }
            else
            {
                dbVoteAnswer.OptionId = vr.OptionId;
            }

            m_db.SaveChanges();

            return Request.CreateResponse(HttpStatusCode.NoContent);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("polls")]
        [SportsManagerAuthorize(Roles="AccountAdmin")]
        public HttpResponseMessage DeletePoll(long accountId, long id)
        {
            var dbVoteQuestion = m_db.VoteQuestions.Find(id);
            if (dbVoteQuestion == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);

            if (dbVoteQuestion.AccountId != accountId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            m_db.VoteQuestions.Remove(dbVoteQuestion);
            m_db.SaveChanges();

            return Request.CreateResponse(HttpStatusCode.OK);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("polls")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage UpdatePoll(long accountId, long id, VoteQuestionViewModel poll)
        {
            if (ModelState.IsValid)
            {
                poll.AccountId = accountId;
                poll.Id = id;

                var dbQuestion = m_db.VoteQuestions.Find(id);
                if (dbQuestion == null)
                    return Request.CreateResponse(HttpStatusCode.NotFound);

                if (dbQuestion.AccountId != accountId)
                    return Request.CreateResponse(HttpStatusCode.Forbidden);

                dbQuestion.Question = poll.Question;
                dbQuestion.Active = poll.Active;

                var existingVoteOptions = new List<long>(dbQuestion.VoteOptions.Select(vo => vo.Id));

                var optionIndex = 0;
                foreach (var option in poll.Options)
                {
                    if (option.Id > 0)
                    {
                        if (existingVoteOptions.Contains(option.Id))
                            existingVoteOptions.Remove(option.Id);

                        var dbOption = m_db.VoteOptions.Find(option.Id);
                        if (dbOption == null)
                            return Request.CreateResponse(HttpStatusCode.NotFound);

                        if (dbOption.QuestionId != id)
                            return Request.CreateResponse(HttpStatusCode.BadRequest);

                        dbOption.OptionText = option.OptionText;
                        dbOption.Priority = optionIndex++;
                    }
                    else
                    {
                        var vo = new VoteOption()
                        {
                            QuestionId = id,
                            OptionText = option.OptionText,
                            Priority = optionIndex++
                        };

                        m_db.VoteOptions.Add(vo);
                    }
                }

                // delete any remaining options.
                foreach (var oldOptionId in existingVoteOptions)
                {
                    var oldOption = m_db.VoteOptions.Find(oldOptionId);
                    if (oldOption != null)
                        m_db.VoteOptions.Remove(oldOption);
                }

                m_db.SaveChanges();

                var vm = Mapper.Map<VoteQuestion, VoteQuestionResultsViewModel>(dbQuestion);
                return Request.CreateResponse<VoteQuestionResultsViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("polls")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage CreatePoll(long accountId, VoteQuestionViewModel newPoll)
        {
            if (ModelState.IsValid)
            {
                var dbVoteQuestion = new VoteQuestion()
                {
                    AccountId = accountId,
                    Question = newPoll.Question,
                    Active = newPoll.Active
                };

                m_db.VoteQuestions.Add(dbVoteQuestion);

                // add the options
                int optionIndex = 0;
                foreach (var option in newPoll.Options)
                {
                    var vo = new VoteOption()
                    {
                        VoteQuestion = dbVoteQuestion,
                        OptionText = option.OptionText,
                        Priority = optionIndex++
                    };

                    m_db.VoteOptions.Add(vo);
                }

                m_db.SaveChanges();

                var vm = Mapper.Map<VoteQuestion, VoteQuestionResultsViewModel>(dbVoteQuestion);
                return Request.CreateResponse<VoteQuestionResultsViewModel>(HttpStatusCode.OK, vm);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }
    }
}
