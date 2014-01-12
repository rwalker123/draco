using System;

namespace ModelObjects
{
/// <summary>
/// Summary description for VoteOption
/// </summary>
	public class VoteOption
	{
		private long m_id;
		private long m_questionId;
		private string m_text = String.Empty;
		private int m_priority = 0;

		public VoteOption()
		{
		}

		public VoteOption(long id, long questionId, string optionText, int priority)
		{
			m_questionId = questionId;
			m_id = id;
			m_text = optionText;
			m_priority = priority;
		}

		public long QuestionId
		{
			get { return m_questionId; }
			set { m_questionId = value; }
		}

		public long Id
		{
			get { return m_id; }
			set { m_id = value; }
		}

		public string OptionText
		{
			get { return m_text; }
			set { m_text = value; }
		}

		public int Priority
		{
			get { return m_priority; }
			set { m_priority = value; }
		}

	}
}
