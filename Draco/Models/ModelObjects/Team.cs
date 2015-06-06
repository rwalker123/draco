using SportsManager.Models.Utils;
using System.Collections.Generic;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for Team
	/// </summary>
	public class Team 
	{
		private readonly string m_teamPhotoName = "TeamPhoto.jpg";
		private readonly string m_submittedPhotoName = "SubmittedTeamPhoto.jpg";
		private readonly string m_teamLogoName = "TeamLogo.png";
		private readonly string m_submittedLogoName = "SubmittedTeamLogo.png";

        public long Id { get; set; } // id (Primary key)
        public long AccountId { get; set; } // AccountId
        public string WebAddress { get; set; } // WebAddress
        public string YouTubeUserId { get; set; } // YouTubeUserId
        public string DefaultVideo { get; set; } // DefaultVideo
        public bool AutoPlayVideo { get; set; } // AutoPlayVideo

        // Reverse navigation
        public virtual ICollection<AccountWelcome> AccountWelcomes { get; set; } // AccountWelcome.FK_AccountWelcome_Teams
        public virtual ICollection<Sponsor> Sponsors { get; set; } // Sponsors.FK_Sponsors_Teams
        public virtual ICollection<TeamHandout> TeamHandouts { get; set; } // TeamHandouts.FK_TeamHandouts_Teams
        public virtual ICollection<TeamNewsItem> TeamNews { get; set; } // TeamNews.FK_TeamNews_Teams
        public virtual ICollection<TeamSeason> TeamsSeasons { get; set; } // TeamsSeason.FK_TeamsSeason_Teams

        // Foreign keys
        public virtual Account Account { get; set; } // FK_Teams_Accounts

        public Team()
        {
            DefaultVideo = "";
            AutoPlayVideo = false;
            AccountWelcomes = new List<AccountWelcome>();
            Sponsors = new List<Sponsor>();
            TeamHandouts = new List<TeamHandout>();
            TeamNews = new List<TeamNewsItem>();
            TeamsSeasons = new List<TeamSeason>();
        }

		private string TeamDir
		{
			get
			{
				return (Globals.UploadDirRoot + "Teams/" + Id + "/");
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
	}
}