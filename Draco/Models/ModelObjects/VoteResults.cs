using System;

namespace ModelObjects
{
/// <summary>
/// Summary description for VoteResults
/// </summary>
	public class VoteResults
	{
        public VoteResults()
        {
        }

		public VoteResults(long optionId, string optionText, int totalVotes)
		{
			OptionId = optionId;
			TotalVotes = totalVotes;
			OptionText = optionText;
		}

		public long OptionId
		{
			get;
			set;
		}

		public int TotalVotes
		{
			get;
			set;
		}

		public string OptionText
		{
			get;
			set;
		}
	}
}
