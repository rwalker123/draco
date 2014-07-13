using SportsManager.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace SportsManager.Controllers
{
    public class UserPollAPIController : ApiController
    {
        [AcceptVerbs("GET"), HttpGet]
        [ActionName("activepolls")]
        public HttpResponseMessage GetActiveUserPolls(long accountId)
        {
            var userPolls = DataAccess.Votes.GetActiveVotesWithResults(accountId);
            return Request.CreateResponse<IEnumerable<ModelObjects.VoteQuestion>>(HttpStatusCode.OK, userPolls);
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("polls")]
        public HttpResponseMessage GetUserPolls(long accountId)
        {
            var userPolls = DataAccess.Votes.GetVotesWithResults(accountId);
            return Request.CreateResponse<IEnumerable<ModelObjects.VoteQuestion>>(HttpStatusCode.OK, userPolls);
        }

        public class RecordVoteResult 
        {
            public long ContactId { get; set; }
            public long QuestionId { get; set; }
            public long OptionId { get; set; }
        };

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("recordVote")]
        public HttpResponseMessage RecordVote(long accountId, long id, RecordVoteResult vr)
        {
            var currentContactId = DataAccess.Contacts.GetContactId(Globals.GetCurrentUserId());

            // only current signed in user can vote.
            if (vr.ContactId != currentContactId)
                return Request.CreateResponse(HttpStatusCode.Forbidden);

            var result = DataAccess.Votes.EnterVote(vr.QuestionId, vr.OptionId, vr.ContactId);
            if (result)
                return Request.CreateResponse(HttpStatusCode.NoContent);
            else
                return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("DELETE"), HttpDelete]
        [ActionName("polls")]
        [SportsManagerAuthorize(Roles="AccountAdmin")]
        public HttpResponseMessage DeletePoll(long accountId, long id)
        {
            var result = DataAccess.Votes.RemoveVoteQuestion(accountId, id);
            if (result)
                return Request.CreateResponse(HttpStatusCode.OK);
            else
                return Request.CreateResponse(HttpStatusCode.NotFound);
        }

        [AcceptVerbs("PUT"), HttpPut]
        [ActionName("polls")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage UpdatePoll(long accountId, long id, ModelObjects.VoteQuestion poll)
        {
            if (ModelState.IsValid && poll != null && !String.IsNullOrEmpty(poll.Question))
            {
                poll.AccountId = accountId;
                poll.Id = id;

                var updated = DataAccess.Votes.ModifyVoteQuestion(poll);
                if (updated)
                {
                    var voteQuestion = DataAccess.Votes.GetVoteWithResults(accountId, poll.Id);
                    return Request.CreateResponse<ModelObjects.VoteQuestion>(HttpStatusCode.OK, voteQuestion);
                }

            }
            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

        [AcceptVerbs("POST"), HttpPost]
        [ActionName("polls")]
        [SportsManagerAuthorize(Roles = "AccountAdmin")]
        public HttpResponseMessage CreatePoll(long accountId, ModelObjects.VoteQuestion newPoll)
        {
            if (ModelState.IsValid && newPoll != null && !String.IsNullOrEmpty(newPoll.Question))
            {
                newPoll.AccountId = accountId;

                var created = DataAccess.Votes.AddVoteQuestion(newPoll);
                if (created)
                {
                    return Request.CreateResponse<ModelObjects.VoteQuestion>(HttpStatusCode.OK, newPoll);
                }

            }
            return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

    }
}
