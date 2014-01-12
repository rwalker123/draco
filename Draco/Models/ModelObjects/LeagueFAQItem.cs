using System;

namespace ModelObjects
{
/// <summary>
/// Summary description for LeagueFAQItem
/// </summary>
	public class LeagueFAQItem
	{
		private long m_faqId = 0;
		private long m_accountId = 0;
		private string m_faqQuestion;
		private string m_faqAnswer;

		public LeagueFAQItem()
		{
		}

		public LeagueFAQItem(long faqId, string faqQuestion, string faqAnswer, long accountId)
		{
			m_accountId = accountId;
			m_faqId = faqId;
			m_faqQuestion = faqQuestion;
			m_faqAnswer = faqAnswer;
		}

		public long Id
		{
			get { return m_faqId; }
			set { m_faqId = value; }
		}

		public long AccountId
		{
			get { return m_accountId; }
			set { m_accountId = value; }
		}

		public string Question
		{
			get { return m_faqQuestion; }
			set { m_faqQuestion = value; }
		}

		public string Answer
		{
			get { return m_faqAnswer; }
			set { m_faqAnswer = value; }
		}
	}
}