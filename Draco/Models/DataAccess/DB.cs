using ModelObjects;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Configuration;
using System.Data.Entity;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess
{
    internal class DB : DbContext
    {
        public DB()
            : base(ConfigurationManager.ConnectionStrings["webDBConnection"].ConnectionString)
        {
        }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Configurations.Add(new AccountConfiguration());
            modelBuilder.Configurations.Add(new AccountHandoutConfiguration());
            modelBuilder.Configurations.Add(new AccountSettingConfiguration());
            modelBuilder.Configurations.Add(new AccountTypeConfiguration());
            modelBuilder.Configurations.Add(new AccountWelcomeConfiguration());
            modelBuilder.Configurations.Add(new AffiliationConfiguration());
            modelBuilder.Configurations.Add(new AvailableFieldConfiguration());
            modelBuilder.Configurations.Add(new BatstatsumConfiguration());
            modelBuilder.Configurations.Add(new ContactConfiguration());
            modelBuilder.Configurations.Add(new ContactRoleConfiguration());
            modelBuilder.Configurations.Add(new CurrentSeasonConfiguration());
            modelBuilder.Configurations.Add(new DisplayLeagueLeaderConfiguration());
            modelBuilder.Configurations.Add(new DivisionDefConfiguration());
            modelBuilder.Configurations.Add(new DivisionSeasonConfiguration());
            modelBuilder.Configurations.Add(new FieldContactConfiguration());
            modelBuilder.Configurations.Add(new FieldstatsumConfiguration());
            modelBuilder.Configurations.Add(new GameEjectionConfiguration());
            modelBuilder.Configurations.Add(new GameRecapConfiguration());
            modelBuilder.Configurations.Add(new HofConfiguration());
            modelBuilder.Configurations.Add(new HofNominationConfiguration());
            modelBuilder.Configurations.Add(new HofNominationSetupConfiguration());
            modelBuilder.Configurations.Add(new LeagueConfiguration());
            modelBuilder.Configurations.Add(new LeagueEventConfiguration());
            modelBuilder.Configurations.Add(new LeagueFaqConfiguration());
            modelBuilder.Configurations.Add(new LeagueNewConfiguration());
            modelBuilder.Configurations.Add(new LeagueScheduleConfiguration());
            modelBuilder.Configurations.Add(new LeagueSeasonConfiguration());
            modelBuilder.Configurations.Add(new LeagueUmpireConfiguration());
            modelBuilder.Configurations.Add(new MemberBusinessConfiguration());
            modelBuilder.Configurations.Add(new MessageCategoryConfiguration());
            modelBuilder.Configurations.Add(new MessagePostConfiguration());
            modelBuilder.Configurations.Add(new MessageTopicConfiguration());
            modelBuilder.Configurations.Add(new PhotoGalleryConfiguration());
            modelBuilder.Configurations.Add(new PhotoGalleryAlbumConfiguration());
            modelBuilder.Configurations.Add(new PitchstatsumConfiguration());
            modelBuilder.Configurations.Add(new PlayerProfileConfiguration());
            modelBuilder.Configurations.Add(new PlayerRecapConfiguration());
            modelBuilder.Configurations.Add(new PlayerSeasonAffiliationDueConfiguration());
            modelBuilder.Configurations.Add(new PlayersWantedClassifiedConfiguration());
            modelBuilder.Configurations.Add(new PlayoffBracketConfiguration());
            modelBuilder.Configurations.Add(new PlayoffGameConfiguration());
            modelBuilder.Configurations.Add(new PlayoffSeedConfiguration());
            modelBuilder.Configurations.Add(new PlayoffSetupConfiguration());
            modelBuilder.Configurations.Add(new ProfileCategoryConfiguration());
            modelBuilder.Configurations.Add(new ProfileQuestionConfiguration());
            modelBuilder.Configurations.Add(new RosterConfiguration());
            modelBuilder.Configurations.Add(new RosterSeasonConfiguration());
            modelBuilder.Configurations.Add(new SeasonConfiguration());
            modelBuilder.Configurations.Add(new SponsorConfiguration());
            modelBuilder.Configurations.Add(new TeamConfiguration());
            modelBuilder.Configurations.Add(new TeamHandoutConfiguration());
            modelBuilder.Configurations.Add(new TeamNewConfiguration());
            modelBuilder.Configurations.Add(new TeamSeasonManagerConfiguration());
            modelBuilder.Configurations.Add(new TeamsSeasonConfiguration());
            modelBuilder.Configurations.Add(new TeamsWantedClassifiedConfiguration());
            modelBuilder.Configurations.Add(new VoteAnswerConfiguration());
            modelBuilder.Configurations.Add(new VoteOptionConfiguration());
            modelBuilder.Configurations.Add(new VoteQuestionConfiguration());
            modelBuilder.Configurations.Add(new WorkoutAnnouncementConfiguration());
            modelBuilder.Configurations.Add(new WorkoutRegistrationConfiguration());
        }

        public IDbSet<Account> Accounts { get; set; } // Accounts
        public IDbSet<AccountHandout> AccountHandouts { get; set; } // AccountHandouts
        public IDbSet<AccountSetting> AccountSettings { get; set; } // AccountSettings
        public IDbSet<AccountType> AccountTypes { get; set; } // AccountTypes
        public IDbSet<AccountWelcome> AccountWelcomes { get; set; } // AccountWelcome
        public IDbSet<Affiliation> Affiliations { get; set; } // Affiliations
        public IDbSet<AvailableField> AvailableFields { get; set; } // AvailableFields
        public IDbSet<Batstatsum> Batstatsums { get; set; } // batstatsum
        public IDbSet<Contact> Contacts { get; set; } // Contacts
        public IDbSet<ContactRole> ContactRoles { get; set; } // ContactRoles
        public IDbSet<CurrentSeason> CurrentSeasons { get; set; } // CurrentSeason
        public IDbSet<DisplayLeagueLeader> DisplayLeagueLeaders { get; set; } // DisplayLeagueLeaders
        public IDbSet<DivisionDef> DivisionDefs { get; set; } // DivisionDefs
        public IDbSet<DivisionSeason> DivisionSeasons { get; set; } // DivisionSeason
        public IDbSet<FieldContact> FieldContacts { get; set; } // FieldContacts
        public IDbSet<Fieldstatsum> Fieldstatsums { get; set; } // fieldstatsum
        public IDbSet<GameEjection> GameEjections { get; set; } // GameEjections
        public IDbSet<GameRecap> GameRecaps { get; set; } // GameRecap
        public IDbSet<Hof> Hofs { get; set; } // hof
        public IDbSet<HofNomination> HofNominations { get; set; } // HOFNomination
        public IDbSet<HofNominationSetup> HofNominationSetups { get; set; } // HOFNominationSetup
        public IDbSet<League> Leagues { get; set; } // League
        public IDbSet<LeagueEvent> LeagueEvents { get; set; } // LeagueEvents
        public IDbSet<LeagueFaq> LeagueFaqs { get; set; } // LeagueFAQ
        public IDbSet<LeagueNew> LeagueNews { get; set; } // LeagueNews
        public IDbSet<LeagueSchedule> LeagueSchedules { get; set; } // LeagueSchedule
        public IDbSet<LeagueSeason> LeagueSeasons { get; set; } // LeagueSeason
        public IDbSet<LeagueUmpire> LeagueUmpires { get; set; } // LeagueUmpires
        public IDbSet<MemberBusiness> MemberBusinesses { get; set; } // MemberBusiness
        public IDbSet<MessageCategory> MessageCategories { get; set; } // MessageCategory
        public IDbSet<MessagePost> MessagePosts { get; set; } // MessagePost
        public IDbSet<MessageTopic> MessageTopics { get; set; } // MessageTopic
        public IDbSet<PhotoGallery> PhotoGalleries { get; set; } // PhotoGallery
        public IDbSet<PhotoGalleryAlbum> PhotoGalleryAlbums { get; set; } // PhotoGalleryAlbum
        public IDbSet<Pitchstatsum> Pitchstatsums { get; set; } // pitchstatsum
        public IDbSet<PlayerProfile> PlayerProfiles { get; set; } // PlayerProfile
        public IDbSet<PlayerRecap> PlayerRecaps { get; set; } // PlayerRecap
        public IDbSet<PlayerSeasonAffiliationDue> PlayerSeasonAffiliationDues { get; set; } // PlayerSeasonAffiliationDues
        public IDbSet<PlayersWantedClassified> PlayersWantedClassifieds { get; set; } // PlayersWantedClassified
        public IDbSet<PlayoffBracket> PlayoffBrackets { get; set; } // PlayoffBracket
        public IDbSet<PlayoffGame> PlayoffGames { get; set; } // PlayoffGame
        public IDbSet<PlayoffSeed> PlayoffSeeds { get; set; } // PlayoffSeeds
        public IDbSet<PlayoffSetup> PlayoffSetups { get; set; } // PlayoffSetup
        public IDbSet<ProfileCategory> ProfileCategories { get; set; } // ProfileCategory
        public IDbSet<ProfileQuestion> ProfileQuestions { get; set; } // ProfileQuestion
        public IDbSet<Roster> Rosters { get; set; } // Roster
        public IDbSet<RosterSeason> RosterSeasons { get; set; } // RosterSeason
        public IDbSet<Season> Seasons { get; set; } // Season
        public IDbSet<Sponsor> Sponsors { get; set; } // Sponsors
        public IDbSet<Team> Teams { get; set; } // Teams
        public IDbSet<TeamHandout> TeamHandouts { get; set; } // TeamHandouts
        public IDbSet<TeamNew> TeamNews { get; set; } // TeamNews
        public IDbSet<TeamSeasonManager> TeamSeasonManagers { get; set; } // TeamSeasonManager
        public IDbSet<TeamsSeason> TeamsSeasons { get; set; } // TeamsSeason
        public IDbSet<TeamsWantedClassified> TeamsWantedClassifieds { get; set; } // TeamsWantedClassified
        public IDbSet<VoteAnswer> VoteAnswers { get; set; } // VoteAnswers
        public IDbSet<VoteOption> VoteOptions { get; set; } // VoteOptions
        public IDbSet<VoteQuestion> VoteQuestions { get; set; } // VoteQuestion
        public IDbSet<WorkoutAnnouncement> WorkoutAnnouncements { get; set; } // WorkoutAnnouncement
        public IDbSet<WorkoutRegistration> WorkoutRegistrations { get; set; } // WorkoutRegistration
    }

    internal class GolfDB : DbContext
    {
        public GolfDB()
            : base(ConfigurationManager.ConnectionStrings["webDBConnection"].ConnectionString)
        {
        }

        // TODO:
    }
}
