using System;

namespace ModelObjects
{
/// <summary>
/// Summary description for VoteResults
/// </summary>
	public class VoteResults
	{
		private long m_optionId;
		private int m_totalVotes;
		private string m_optionText;

		public VoteResults(long optionId, string optionText, int totalVotes)
		{
			m_optionId = optionId;
			m_totalVotes = totalVotes;
			m_optionText = optionText;
		}

		public long OptionId
		{
			get { return m_optionId; }
			set { m_optionId = value; }
		}

		public int TotalVotes
		{
			get { return m_totalVotes; }
			set { m_totalVotes = value; }
		}

		public string OptionText
		{
			get { return m_optionText; }
			set { m_optionText = value; }
		}
	}
}
