using System;

namespace ModelObjects
{
/// <summary>
/// Summary description for ProfileQuestionItem
/// </summary>
	public class ProfileQuestionItem
	{
		private long m_id;
		private long m_catId = 0;
		private int m_questNum = 0;
		private string m_question = String.Empty;

		public ProfileQuestionItem()
		{
		}

		public ProfileQuestionItem(long id, long catId, string question, int num)
		{
			m_id = id;
			m_catId = catId;
			m_question = question;
			m_questNum = num;
		}

		public long Id
		{
			get { return m_id; }
			set { m_id = value; }
		}

		public long CategoryId
		{
			get { return m_catId; }
			set { m_catId = value; }
		}

		public string Question
		{
			get { return m_question; }
			set { m_question = value; }
		}

		public int QuestionNum
		{
			get { return m_questNum; }
			set { m_questNum = value; }
		}
	}
}