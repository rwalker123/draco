using System;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for LeagueLeaderStat
	/// </summary>
	public class LeagueLeaderStat
	{
		private string m_fieldName;
		private long m_playerId;
		private long m_teamId;
		private double m_fieldTotal;
		private int m_tieCount = 0;

		public LeagueLeaderStat()
		{
		}

		public LeagueLeaderStat(int tieCount, double fieldTotal)
		{
			m_fieldName = "TIE";
			m_playerId = 0;
			m_teamId = 0;
			m_fieldTotal = fieldTotal;
			m_tieCount = tieCount;
		}

		public LeagueLeaderStat(string fieldName, long playerId, long teamId, double fieldTotal)
		{
			m_fieldName = fieldName;
			m_playerId = playerId;
			m_fieldTotal = fieldTotal;
			m_teamId = teamId;
		}

		public string FieldName
		{
			get { return m_fieldName; }
			set { m_fieldName = value; }
		}

		public long PlayerId
		{
			get { return m_playerId; }
			set { m_playerId = value; }
		}

		public double FieldTotal
		{
			get { return m_fieldTotal; }
			set { m_fieldTotal = value; }
		}

		public long TeamId
		{
			get { return m_teamId; }
			set { m_teamId = value; }
		}

		public int TieCount
		{
			get { return m_tieCount; }
			set { m_tieCount = value; }
		}
	}
}