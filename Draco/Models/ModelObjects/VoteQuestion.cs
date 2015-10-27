using System.Collections.Generic;

namespace ModelObjects
{
/// <summary>
/// Summary description for VoteQuestion
/// </summary>
	public class VoteQuestion
	{
        public long Id { get; set; } // id (Primary key)
        public long AccountId { get; set; } // AccountId
        public string Question { get; set; } // Question
        public bool Active { get; set; } // Active

        // Reverse navigation
        public virtual ICollection<VoteAnswer> VoteAnswers { get; set; } // VoteAnswers.FK_VoteAnswers_VoteQuestion
        public virtual ICollection<VoteOption> VoteOptions { get; set; } // VoteOptions.FK_VoteOptions_VoteQuestion

        // Foreign keys
        public virtual Account Account { get; set; } // FK_VoteQuestion_Accounts

        public VoteQuestion()
        {
            VoteAnswers = new List<VoteAnswer>();
            VoteOptions = new List<VoteOption>();
        }
    }
}