using SportsManager.Models.Utils;
using System;
using System.Linq;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for Team
	/// </summary>
	public class Team : IComparable<Team>
	{
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
				return (Globals.UploadDirRoot + "Teams/" + TeamId + "/");
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


		#region IComparable<Team> Members

		public int CompareTo(Team other)
		{
			return String.Compare(this.Name, other.Name);
		}

		#endregion
	}
}