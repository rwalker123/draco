using System;
using System.Collections.Generic;

namespace SportsManager.ViewModels.API
{
    public class VoteQuestionResultsViewModel
    {
        public long Id { get; set; }
        public long AccountId { get; set; }
        public bool Active { get; set; }
        public String Question { get; set; }
        public IEnumerable<VoteResultsViewModel> Results { get; set; } //= GetVoteResults(vq.Id),
        public IEnumerable<VoteOptionViewModel> Options { get; set; }
        public bool HasVoted { get; set; } // = HasVoted(vq.Id, contactId),
        public long OptionSelected { get; set; } // = UserVoteOption(vq.Id, contactId)
    }
}