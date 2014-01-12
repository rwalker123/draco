using System;

namespace ModelObjects
{
/// <summary>
/// Summary description for LeagueLeaderConfig
/// </summary>
	public class LeagueLeaderConfig
	{
		private string m_fieldName;
		private long    m_id;
		private int    m_fieldLimit;
		private long    m_leagueId;
		private int    m_noLeftRight; // 0 - don't display on home page, 1 - display on left panel of home page, 2 - display on right...

		public LeagueLeaderConfig()
		{
		}

		public LeagueLeaderConfig( long id, long leagueId, String fieldName, int limit, int noLeftRight )
		{
			m_fieldName = fieldName;
			m_id = id;
			m_fieldLimit = limit;
			m_leagueId = leagueId;
			m_noLeftRight = noLeftRight;
		}
	
		public long Id
		{
			get { return m_id; }
			set { m_id = value; }
		}
	
		public string FieldName
		{
			get { return m_fieldName; }
			set { m_fieldName = value; }
		}
	
		public int FieldLimit
		{
			get { return m_fieldLimit; }
			set { m_fieldLimit = value; }
		}
	
		public long LeagueId
		{
			get { return m_leagueId; }
			set { m_leagueId = value; }
		}
	
		public int NoLeftRight
		{
			get { return m_noLeftRight; }
			set { m_noLeftRight = value; }
		}
	}
}