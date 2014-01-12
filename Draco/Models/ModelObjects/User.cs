using System;
using System.Web.Security;

namespace ModelObjects
{
/// <summary>
/// Summary description for User
/// </summary>
	public class User
	{
		private MembershipUser m_user = null;

		public User()
		{
			m_user = new MembershipUser(String.Empty, String.Empty, null, String.Empty, String.Empty, String.Empty, true, false, DateTime.Now, DateTime.Now, DateTime.Now, DateTime.Now, DateTime.Now);
        }

		public User(MembershipUser user)
		{
			m_user = user;
		}

		public string UserName
		{
			get { return m_user.UserName; }
		}

		public MembershipUser MembershipUser
		{
			get { return m_user; }
		}

		public DateTime CreationDate
		{
			get { return m_user.CreationDate; }
		}

		public string EMail
		{
			get { return m_user.Email; }
			set { m_user.Email = value; }
		}

		public bool IsOnline
		{
			get { return m_user.IsOnline; }
		}

		public DateTime LastLoginDate
		{
			get { return m_user.LastLoginDate; }
		}
	}
}
