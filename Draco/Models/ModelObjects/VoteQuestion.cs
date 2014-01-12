using System;

namespace ModelObjects
{
/// <summary>
/// Summary description for VoteQuestion
/// </summary>
	public class VoteQuestion
	{
		private long m_id;
		private long m_accountId;
		private string m_question = String.Empty;
		private bool m_active = false;

		public VoteQuestion()
		{
		}

		public VoteQuestion(long id, string question, bool active, long accountId)
		{
			m_id = id;
			m_accountId = accountId;
			m_question = question;
			m_active = active;
		}

		public long Id
		{
			get { return m_id; }
			set { m_id = value; }
		}

		public long AccountId
		{
			get { return m_accountId; }
			set { m_accountId = value; }
		}

		public string Question
		{
			get { return m_question; }
			set { m_question = value; }
		}

		public bool Active
		{
			get { return m_active; }
			set { m_active = value; }
		}

		public bool GetVoteStatus(System.Web.HttpCookieCollection cookies)
		{
			bool rc = false;
			string voteCookieName = "MSBLQ" + m_id;

			try
			{
				foreach( System.Web.HttpCookie c in cookies )
				{
					if (c.Name == voteCookieName)
					{
						rc = (Int32.Parse(c.Value) > 0) ? true : false;
						break;
					}
				}
			}
			catch (Exception)
			{
			}

			return rc;
		}
	}
}