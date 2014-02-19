using SportsManager.Models.Utils;
using System;
using System.Collections.Generic;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for Team
	/// </summary>
	public class Team : IComparable<Team>
	{
		private int m_wins = -1;
		private int m_losses = -1;
		private int m_ties = -1;

		private readonly string m_teamPhotoName = "TeamPhoto.jpg";
		private readonly string m_submittedPhotoName = "SubmittedTeamPhoto.jpg";
		private readonly string m_teamLogoName = "TeamLogo.png";
		private readonly string m_submittedLogoName = "SubmittedTeamLogo.png";

		public Team()
		{
		}

		public Team(long teamSeasonId, long leagueId, string teamName, long divisionId, long teamId, long accountId)
		{
			LeagueId = leagueId;
			AccountId = accountId;
			Id = teamSeasonId;
			DivisionId = divisionId;
			Name = teamName;
			TeamId = teamId;
		}

		public long Id
		{
			get;
			set;
		}

		public long TeamId
		{
			get;
			set;
		}

		public long AccountId
		{
			get;
			set;
		}

		public string Name
		{
			get;
			set;
		}

		public long LeagueId
		{
			get;
			set;
		}

		public long DivisionId
		{
			get;
			set;
		}

		private string TeamDir
		{
			get
			{
				return (Globals.UploadDirRoot + "Teams/" + TeamId + @"/Logo/");
			}
		}

		public string TeamPhotoURL
		{
			get
			{
			    return Storage.Provider.GetUrl(TeamDir + m_teamPhotoName);
			}
		}

		public string SubmittedPhotoURL
		{
			get
			{
				return Storage.Provider.GetUrl(TeamDir + m_submittedPhotoName);
			}
		}

		public string TeamLogoURL
		{
			get
			{
				return Storage.Provider.GetUrl(TeamDir + m_teamLogoName);
			}
		}

		public string SubmittedLogoURL
		{
			get
			{
				return Storage.Provider.GetUrl(TeamDir + m_submittedLogoName);
			}
		}

		public int GetWins()
		{
			if (m_wins == -1)
				GetTeamRecord();

			return m_wins;
		}

		public int GetLosses()
		{
			if (m_losses == -1)
				GetTeamRecord();

			return m_losses;
		}

		public int GetTies()
		{
			if (m_ties == -1)
				GetTeamRecord();

			return m_ties;
		}

		private void GetTeamRecord()
		{
			m_wins = 0;
			m_losses = 0;
			m_ties = 0;

			List<Game> l = DataAccess.Schedule.GetTeamSchedule(LeagueId, Id);

			foreach (Game g in l)
			{
				if (g.GameStatus == 1 || g.GameStatus == 4)
				{
					int ourScore = (g.HomeTeamId == Id) ? g.HomeScore : g.AwayScore;
					int oppScore = (g.HomeTeamId == Id) ? g.AwayScore : g.HomeScore;

					if (ourScore > oppScore)
						m_wins++;
					else if (ourScore < oppScore)
						m_losses++;
					else
						m_ties++;
				}
				else if (g.GameStatus == 5)
				{
					m_losses++;
				}
			}
		}

		#region IComparable<Team> Members

		public int CompareTo(Team other)
		{
			return String.Compare(this.Name, other.Name);
		}

		#endregion
	}
}