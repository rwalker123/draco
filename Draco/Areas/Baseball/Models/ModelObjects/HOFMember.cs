using System;
using System.Configuration;

namespace ModelObjects
{
/// <summary>
/// Summary description for HOFMember
/// </summary>
	public class HOFMember
	{
		private long m_id;
		private long m_accountId;
		private Contact m_contactInfo;
		private int m_yearInducted = 1999;
		private string m_bio = String.Empty;

		public HOFMember()
		{
			m_contactInfo = new Contact();
		}
	
		public HOFMember(long id, int yearInducted, Contact contactInfo, string bio, long accountId)
		{
			m_id = id;
			m_accountId = accountId;
			m_contactInfo = contactInfo;
			m_yearInducted = yearInducted;
			m_bio = bio;
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

		public string FirstName
		{
			get { return m_contactInfo.FirstName; }
			set { m_contactInfo.FirstName = value; }
		}

		public string LastName
		{
			get { return m_contactInfo.LastName; }
			set { m_contactInfo.LastName = value; }
		}

		public string MiddleName
		{
			get { return m_contactInfo.MiddleName; }
			set { m_contactInfo.MiddleName = value; }
		}

		public string FullName
		{
			get { return m_contactInfo.FullName; }
		}

		public int YearInducted
		{
			get { return m_yearInducted; }
			set { m_yearInducted = value; }
		}
	
		public string Biography
		{
			get { return m_bio; }
			set { m_bio = value; }
		}

		public string PhotoURL
		{
			get { return m_contactInfo.LargePhotoURL; }
		}

		public Contact ContactInfo
		{
			get { return m_contactInfo; }
			set { m_contactInfo = value; }
		}

        public string FullNameFirst
        {
            get { return m_contactInfo.FullNameFirst; }
        }
	}
}