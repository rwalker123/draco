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

		public long OptionId { get; set; }
		public int TotalVotes { get; set; }
		public string OptionText { get; set; }
	}
}
