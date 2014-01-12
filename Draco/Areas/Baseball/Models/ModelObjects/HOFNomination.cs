using System;

namespace ModelObjects
{

/// <summary>
/// Summary description for HOFNomination
/// </summary>
	public class HOFNomination
	{
		private long   m_id;
		private long   m_accountId;
		private String m_nominator = String.Empty;
		private String m_email = String.Empty;
		private String m_phoneNumber = String.Empty;
		private String m_nominee = String.Empty;
		private String m_reason = String.Empty;

		public HOFNomination()
		{
		}

		public HOFNomination( long id, string nominator, string email, string phoneNumber, string nominee, string reason, long accountId )
		{
			m_id = id;
			m_nominator = nominator;
			m_email = email;
			m_phoneNumber = phoneNumber;
			m_nominee = nominee;
			m_reason = reason;
			m_accountId = accountId;
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
		
		public string Nominator
		{
			get { return m_nominator; }
			set { m_nominator = value; }
		}

		public string EMail
		{
			get { return m_email; }
			set { m_email = value; }
		}

		public string PhoneNumber
		{
			get { return m_phoneNumber; }
			set { m_phoneNumber = value; }
		}

		public string Nominee
		{
			get { return m_nominee; }
			set { m_nominee = value; }
		}

		public string Reason
		{
			get { return m_reason; }
			set { m_reason = value; }
		}
	}
}