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
		private Dictionary<long, string> m_answers = new Dictionary<long, string>();
        private Contact m_contact = new Contact();

		public PlayerProfile()
		{
		}

		public PlayerProfile(long playerId)
		{
			m_id = playerId;
            m_contact = DataAccess.Contacts.GetContact(m_id);
		}

		public long PlayerId
		{
			get { return m_id; }
			set { m_id = value; }
		}

        public string PlayerName
        {
            get
            {
                return m_contact.FullName;
            }
        }

		public void SetAnswer(long qid, string answer)
		{
			m_answers.Add(qid, answer);
		}

        public Dictionary<long, string> GetAnswers()
		{
			return m_answers;
		}
	}
}
