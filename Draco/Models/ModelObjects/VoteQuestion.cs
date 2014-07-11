using System;

namespace ModelObjects
{
/// <summary>
/// Summary description for VoteQuestion
/// </summary>
	public class VoteQuestion
	{
		public VoteQuestion()
		{
		}

		public VoteQuestion(long id, string question, bool active, long accountId)
		{
			Id = id;
			AccountId = accountId;
			Question = question;
			Active = active;
		}

		public long Id
		{
			get;
			set;
		}

		public long AccountId
		{
			get;
			set;
		}

		public string Question
		{
			get;
			set;
		}

		public bool Active
		{
			get;
			set;
		}

		public bool GetVoteStatus(System.Web.HttpCookieCollection cookies)
		{
			bool rc = false;
			string voteCookieName = "MSBLQ" + Id;

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