using System;
using System.Collections.Generic;

namespace ModelObjects
{
/// <summary>
/// Summary description for League
/// </summary>
	public class VideoAccount
	{
        private long m_id;
		private long m_accountId;
        private string m_videoAccountId;
        private string m_videoAccountKey;
		private string m_accountName = String.Empty;
        private List<string> m_videos = new List<string>();

		public VideoAccount()
		{
		}

        public VideoAccount(long id, long accountId, string accountName, string videoAccountId, string videoAccountKey)
		{
            m_id = id;
            m_accountId = accountId;
            m_videoAccountId = videoAccountId;
            m_videoAccountKey = videoAccountKey;
            m_accountName = accountName;
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

		public string Name
		{
			get { return m_accountName; }
			set { m_accountName = value; }
		}

        public string VideoAccountId
        {
            get { return m_videoAccountId; }
            set { m_videoAccountId = value; }
        }

        public string VideoAccountKey
        {
            get { return m_videoAccountKey; }
            set { m_videoAccountKey = value; }
        }

        public List<string> Videos
        {
            get { return m_videos; }
        }
	}
}
