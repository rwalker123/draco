using System;
using System.Configuration;
using System.Collections.Generic;

namespace ModelObjects
{
/// <summary>
/// Summary description for PlayerProfile
/// </summary>
	public class PlayerProfile
	{
		private long m_id;

		public PlayerProfile()
		{
		}

		public PlayerProfile(long playerId)
		{
			m_id = playerId;
		}

		public long PlayerId
		{
			get { return m_id; }
			set { m_id = value; }
		}

        public string LastName
        {
            get;
            set;
        }

        public string FirstName
        {
            get;
            set;
        }

        public string MiddleName
        {
            get;
            set;
        }

        public string PhotoUrl
        {
            get
            {
                return Contact.GetPhotoURL(m_id);
            }
        }
	}
}
