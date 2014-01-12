using System;
using System.Configuration;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for ProfileQuestionAnswer
	/// </summary>
	public class ProfileQuestionAnswer
	{
		private long m_playerId;
		private string m_question;
		private string m_answer;

		public ProfileQuestionAnswer()
		{
		}

		public ProfileQuestionAnswer(long playerId, string question, string answer)
		{
			m_playerId = playerId;
			m_question = question;
			m_answer = answer;
		}

		public long PlayerId
		{
			get { return m_playerId; }
			set { m_playerId = value; }
		}

		public string Question
		{
			get { return m_question; }
			set { m_question = value; }
		}

		public string Answer
		{
			get { return m_answer; }
			set { m_answer = value; }
		}
	}
}