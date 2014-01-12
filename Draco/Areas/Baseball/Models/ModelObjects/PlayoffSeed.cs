using System;
using System.Runtime.Serialization;

namespace ModelObjects
{
/// <summary>
/// Summary description for PlayoffSeed
/// </summary>
    public class PlayoffSeed
	{
		private long m_id = 0;
		private long m_playoffId = 0;
		private long m_teamId = 0;
		private int m_seedNo = 0;

		public PlayoffSeed()
		{
		}

		public PlayoffSeed(long id, long playoffId, long teamId, int seedNo)
		{
			m_id = id;
			m_playoffId = playoffId;
			m_teamId = teamId;
			m_seedNo = seedNo;
		}

        public long Id
		{
			get
			{
				return m_id;
			}

			set
			{
				m_id = value;
			}
		}

        public long PlayoffId
		{
			get
			{
				return m_playoffId;
			}

			set
			{
				m_playoffId = value;
			}
		}

        public long TeamId
		{
			get
			{
				return m_teamId;
			}

			set
			{
				m_teamId = value;
			}
		}

        public int SeedNo
		{
			get
			{
				return m_seedNo;
			}

			set
			{
				m_seedNo = value;
			}
		}

        public string TeamName
        {
            get
            {
                return DataAccess.Teams.GetTeamName(m_teamId);
            }
            set
            {
            }
        }

	}
}