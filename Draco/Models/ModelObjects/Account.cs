using SportsManager.Models.Utils;
using System;
using System.Collections.Generic;

namespace ModelObjects
{
    /// <summary>
    /// Summary description for Account
    /// </summary>
    public class Account
    {
        public enum eAccountType
        {
            Baseball = 1,
            Bowling = 2,
            Golf = 3,
            FitnessClub = 4,
            GolfIndividual = 5
        }

        private string m_smallLogoName = "SmallLogo.png";
        private string m_largeLogoName = "LargeLogo.png";

        public long Id { get; set; } // Id (Primary key)
        public String OwnerUserId { get; set; }
        public string Name { get; set; } // Name
        public int FirstYear { get; set; } // FirstYear
        public long AccountTypeId { get; set; } // AccountTypeId
        public long AffiliationId { get; set; } // AffiliationId
        public string TimeZoneId { get; set; } // TimeZoneId
        public string TwitterAccountName { get; set; } // TwitterAccountName
        public string TwitterOauthToken { get; set; } // TwitterOauthToken
        public string TwitterOauthSecretKey { get; set; } // TwitterOauthSecretKey
        public string YouTubeUserId { get; set; } // YouTubeUserId
        public string FacebookFanPage { get; set; } // FacebookFanPage
        public string TwitterWidgetScript { get; set; } // TwitterWidgetScript
        public string DefaultVideo { get; set; } // DefaultVideo
        public bool AutoPlayVideo { get; set; } // AutoPlayVideo

        // Reverse navigation
        public virtual CurrentSeason CurrentSeason { get; set; } // CurrentSeason.FK_CurrentSeason_Accounts
        public virtual HOFNominationSetup HofNominationSetup { get; set; } // HOFNominationSetup.FK_HOFNominationSetup_Accounts
        public virtual ICollection<AccountHandout> AccountHandouts { get; set; } // AccountHandouts.FK_AccountHandouts_Accounts
        public virtual ICollection<AccountSetting> AccountSettings { get; set; } // Many to many mapping
        public virtual ICollection<AccountURL> AccountsURL { get; set; } // Many to many mapping
        public virtual ICollection<AccountWelcome> AccountWelcomes { get; set; } // AccountWelcome.FK_AccountWelcome_Accounts
        public virtual ICollection<Field> AvailableFields { get; set; } // AvailableFields.FK_AvailableFields_Accounts
        public virtual ICollection<DivisionDefinition> DivisionDefs { get; set; } // DivisionDefs.FK_DivisionDefs_Accounts
        //public virtual ICollection<GolfLeagueCours> GolfLeagueCours { get; set; } // Many to many mapping
        //public virtual ICollection<GolfLeagueSetup> GolfLeagueSetups { get; set; } // GolfLeagueSetup.FK_GolfLeagueSetup_Accounts
        public virtual ICollection<HOFMember> Hofs { get; set; } // hof.FK_hof_Accounts
        public virtual ICollection<HOFNomination> HofNominations { get; set; } // HOFNomination.FK_HOFNomination_Accounts
        public virtual ICollection<LeagueDefinition> Leagues { get; set; } // League.FK_League_Accounts
        public virtual ICollection<LeagueFAQItem> LeagueFaqs { get; set; } // LeagueFAQ.FK_LeagueFAQ_Accounts
        public virtual ICollection<LeagueNewsItem> LeagueNews { get; set; } // LeagueNews.FK_LeagueNews_Accounts
        public virtual ICollection<Umpire> LeagueUmpires { get; set; } // LeagueUmpires.FK_LeagueUmpires_Accounts
        public virtual ICollection<PhotoGalleryItem> PhotoGalleries { get; set; } // PhotoGallery.FK_PhotoGallery_Accounts
        public virtual ICollection<PlayersWantedClassified> PlayersWantedClassifieds { get; set; } // PlayersWantedClassified.FK_PlayersWantedClassified_Accounts
        public virtual ICollection<ProfileCategoryItem> ProfileCategories { get; set; } // ProfileCategory.FK_ProfileCategory_Accounts
        public virtual ICollection<Player> Rosters { get; set; } // Roster.FK_Roster_Accounts
        public virtual ICollection<Season> Seasons { get; set; } // Season.FK_Season_Accounts
        public virtual ICollection<Sponsor> Sponsors { get; set; } // Sponsors.FK_Sponsors_Accounts
        public virtual ICollection<Team> Teams { get; set; } // Teams.FK_Teams_Accounts
        public virtual ICollection<TeamsWantedClassified> TeamsWantedClassifieds { get; set; } // TeamsWantedClassified.FK_TeamsWantedClassified_Accounts
        public virtual ICollection<VoteQuestion> VoteQuestions { get; set; } // VoteQuestion.FK_VoteQuestion_Accounts
        public virtual ICollection<WorkoutAnnouncement> WorkoutAnnouncements { get; set; } // WorkoutAnnouncement.FK_WorkoutAnnouncement_Accounts

        // Foreign keys
        public virtual AccountType AccountType { get; set; } // FK_AccountTypes_Accounts
        public virtual Affiliation Affiliation { get; set; } // FK_Affiliations_Accounts

        public Account()
        {
            DefaultVideo = "";
            AutoPlayVideo = false;
            AccountHandouts = new List<AccountHandout>();
            AccountSettings = new List<AccountSetting>();
            AccountWelcomes = new List<AccountWelcome>();
            AvailableFields = new List<Field>();
            DivisionDefs = new List<DivisionDefinition>();
            Hofs = new List<HOFMember>();
            HofNominations = new List<HOFNomination>();
            Leagues = new List<LeagueDefinition>();
            LeagueFaqs = new List<LeagueFAQItem>();
            LeagueNews = new List<LeagueNewsItem>();
            LeagueUmpires = new List<Umpire>();
            PhotoGalleries = new List<PhotoGalleryItem>();
            PlayersWantedClassifieds = new List<PlayersWantedClassified>();
            ProfileCategories = new List<ProfileCategoryItem>();
            Rosters = new List<Player>();
            Seasons = new List<Season>();
            Sponsors = new List<Sponsor>();
            Teams = new List<Team>();
            TeamsWantedClassifieds = new List<TeamsWantedClassified>();
            VoteQuestions = new List<VoteQuestion>();
            WorkoutAnnouncements = new List<WorkoutAnnouncement>();
        }


		public TimeZoneInfo TimeZoneInfo
		{
			get
			{
				try
				{
					if (String.IsNullOrEmpty(TimeZoneId) ||
						TimeZoneId == "0")
						return null;
					else
						return TimeZoneInfo.FindSystemTimeZoneById(TimeZoneId);
				}
				catch
				{
					return null;
				}
			}
		}

		public string TimeZoneDisplayName
		{
			get
			{
				TimeZoneInfo timeZoneInfo = TimeZoneInfo;

				if (timeZoneInfo != null)
					return timeZoneInfo.DisplayName;

				return string.Empty;
			}
		}

        public bool HasLargeLogo
        {
            get
            {
                return Storage.Provider.Exists(Globals.UploadDirRoot + "Accounts/" + Id + "/Logo/" + m_largeLogoName);
            }
        }
		public string LargeLogoURL
		{
			get
			{
                return Storage.Provider.GetUrl(Globals.UploadDirRoot + "Accounts/" + Id + "/Logo/" + m_largeLogoName);
			}
		}

		public string SmallLogoURL
		{
			get
			{
                return Storage.Provider.GetUrl(Globals.UploadDirRoot + "Accounts/" + Id + "/Logo/" + m_smallLogoName);
			}
		}
	}
}