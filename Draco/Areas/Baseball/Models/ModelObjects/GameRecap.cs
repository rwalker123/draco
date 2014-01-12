using System;

namespace ModelObjects
{

	/// <summary>
	/// Summary description for GameRecap
	/// </summary>
	public class GameRecap
	{
		private long m_gameId;
		private long m_teamId;
		private string m_recap;

		public GameRecap()
		{
		}

		public GameRecap(long gameId, long teamId, string recap)
		{
			m_gameId = gameId;
			m_teamId = teamId;
			m_recap = recap;
		}

		public long GameId
		{
			get { return m_gameId; }
			set { m_gameId = value; }
		}

		public long TeamId
		{
			get { return m_teamId; }
			set { m_teamId = value; }
		}

		public string Recap
		{
			get { return m_recap; }
			set { m_recap = value; }
		}
	}
}