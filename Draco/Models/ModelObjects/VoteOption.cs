using System.Collections.Generic;

namespace ModelObjects
{
/// <summary>
/// Summary description for VoteOption
/// </summary>
	public class VoteOption
	{
        public long Id { get; set; } // id (Primary key)
        public long QuestionId { get; set; } // QuestionId
        public string OptionText { get; set; } // OptionText
        public int Priority { get; set; } // Priority

        // Reverse navigation
        public virtual ICollection<VoteAnswer> VoteAnswers { get; set; } // VoteAnswers.FK_VoteAnswers_VoteOptions

        // Foreign keys
        public virtual VoteQuestion VoteQuestion { get; set; } // FK_VoteOptions_VoteQuestion

        public VoteOption()
        {
            VoteAnswers = new List<VoteAnswer>();
        }
    }
}
