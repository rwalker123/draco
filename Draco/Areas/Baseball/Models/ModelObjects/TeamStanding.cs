using System;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for TeamStanding
	/// </summary>
	public class TeamStanding : IComparable
	{
		private long m_teamId = 0;
		private long m_divisionId = 0;
		private String m_teamName = String.Empty;

		private int m_wins = 0;
		private int m_losses = 0;
		private int m_ties = 0;
		private int m_totalGames = 0;
		private int m_divWins = 0;
		private int m_divLosses = 0;
		private int m_divTies = 0;
		private int m_totalDivGames = 0;

		public TeamStanding()
		{
		}

		public TeamStanding(long teamId, long divisionId, String teamName)
		{
			m_teamId = teamId;
			m_divisionId = divisionId;
			m_teamName = teamName;
		}

		public int Wins
		{
			get { return m_wins; }
		}

		public int Losses
		{
			get { return m_losses; }
		}

		public int Ties
		{
			get { return m_ties; }
		}

		public int TotalGames
		{
			get { return m_totalGames; }
		}

		public double DivisionWinningPct
		{
			get
			{
				double wins = (double)m_divWins + (double)m_divTies / 2.0;
				return (m_totalDivGames > 0) ? wins / (double)m_totalDivGames : 0;
			}
		}

		public double WinningPct
		{
			get
			{
				double wins = (double)m_wins + (double)m_ties / 2.0;
				return (m_totalGames > 0) ? wins / (double)m_totalGames : 0;
			}
		}

		public int DivisionWins
		{
			get { return m_divWins; }
		}

		public int DivisionLosses
		{
			get { return m_divLosses; }
		}

		public int DivisionTies
		{
			get { return m_divTies; }
		}

		public int TotalDivisionGames
		{
			get { return m_totalDivGames; }
		}

		public String TeamName
		{
			get { return m_teamName; }
		}

		public long TeamId
		{
			get { return m_teamId; }
		}

		public long DivisionId
		{
			get { return m_divisionId; }
		}

		public int CompareTo(Object o)
		{
			TeamStanding t = (TeamStanding)o;

			double gameDifference = ((m_wins - t.Wins) * .5) - ((m_losses - t.Losses) * .5);
			double divDifference = ((m_divWins - t.DivisionWins) * .5) - ((m_divLosses - t.DivisionLosses) * .5);

			if (gameDifference > 0)
				return -1;
			else if (gameDifference < 0)
				return 1;
			else if (WinningPct < t.WinningPct)
				return 1;
			else if (WinningPct > t.WinningPct)
				return -1;
			else if (divDifference > 0)
				return -1;
			else if (divDifference < 0)
				return 1;
			else if (DivisionWinningPct < t.DivisionWinningPct)
				return 1;
			else if (DivisionWinningPct > t.DivisionWinningPct)
				return -1;
			else
				return 0;
		}

		public void AddGameResult(bool homeTeam, TeamStanding opponent, int homeScore, int awayScore, int gameStatus)
		{
			int ourScore = (homeTeam) ? homeScore : awayScore;
			int oppScore = (homeTeam) ? awayScore : homeScore;

			m_totalGames++;

            if (gameStatus == 5) // Did not report
                m_losses++;
            else if (ourScore > oppScore)
                m_wins++;
            else if (ourScore < oppScore)
                m_losses++;
            else if (gameStatus == 4) // forfeit, if tie score, then both teams get a loss (i.e. double forfeit)
                m_losses++;
            else
				m_ties++;

			if (opponent != null && opponent.DivisionId == m_divisionId)
			{
				m_totalDivGames++;

				if (gameStatus == 5)
					m_divLosses++;
				else if (ourScore > oppScore)
					m_divWins++;
				else if (ourScore < oppScore)
					m_divLosses++;
				else
					m_divTies++;
			}

		}
	}
}


