using System;
using System.Runtime.Serialization;

namespace ModelObjects
{
/// <summary>
/// Summary description for PlayoffSetup
/// </summary>
	public class PlayoffSetup
	{
		private long m_id = 0;
		private long m_leagueId = 0;
		private int m_numTeams = 0;
		private bool m_active = false;
		private string m_description = String.Empty;

		public PlayoffSetup()
		{
		}

		public PlayoffSetup(long id, long leagueId, int numTeams, String description, bool active)
		{
			m_id = id;
			m_leagueId = leagueId;
			m_numTeams = numTeams;
			m_description = description;
			m_active = active;
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

        public long LeagueId
		{
			get
			{
				return m_leagueId;
			}

			set
			{
				m_leagueId = value;
			}
		}

        public string LeagueName
        {
            get
            {
                return DataAccess.Leagues.GetLeagueName(m_leagueId);
            }
            set
            {
            }
        }

        public int NumTeams
		{
			get
			{
				return m_numTeams;
			}

			set
			{
				m_numTeams = value;
			}
		}

        public bool Active
		{
			get
			{
				return m_active;
			}

			set
			{
				m_active = value;
			}
		}

        public string Description
		{
			get
			{
				return m_description;
			}

			set
			{
				m_description = value;
			}
		}

	}
}