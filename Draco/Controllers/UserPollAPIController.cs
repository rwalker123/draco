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
        public HttpResponseMessage GetUserPolls(long accountId)
        {
            var userPolls = DataAccess.Votes.GetActiveVotesWithResults(accountId);
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
            var result = DataAccess.Votes.EnterVote(vr.QuestionId, vr.OptionId, vr.ContactId);
            if (result)
                return Request.CreateResponse(HttpStatusCode.NoContent);
            else
                return Request.CreateResponse(HttpStatusCode.BadRequest);
        }

    }
}
