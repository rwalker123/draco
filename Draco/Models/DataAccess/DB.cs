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
            // TODO: Add Account, League, and Contacts Relationships...Alot of them

            modelBuilder.Entity<DivisionSeason>().HasRequired(current => current.DivisionDefinition)
                .WithMany(c=>c.DivisionSeasons)
                .HasForeignKey(c => c.DivisionId)
                .WillCascadeOnDelete(true);

            modelBuilder.Entity<LeagueSeason>().HasRequired(current => current.LeagueDefinition)
                .WithMany(c => c.LeagueSeasons)
                .HasForeignKey(c => c.LeagueId)
                .WillCascadeOnDelete(true);

            modelBuilder.Entity<Game>().HasRequired(c => c.LeagueSeason)
                .WithMany(c => c.Games)
                .HasForeignKey(c => c.LeagueId)
                .WillCascadeOnDelete(true);

            modelBuilder.Entity<GameRecap>().HasRequired(c => c.Game)
                .WithMany(c => c.GameRecaps)
                .HasForeignKey(c => c.GameId)
                .WillCascadeOnDelete(true);

            modelBuilder.Entity<Game>().HasOptional(c => c.Field)
                .WithMany()
                .HasForeignKey(c => c.FieldId);

            modelBuilder.Entity<Game>().HasRequired(c => c.HomeTeam)
                .WithMany(c => c.Games)
                .HasForeignKey(c => c.HomeTeamId)
                .WillCascadeOnDelete(true);

            modelBuilder.Entity<Game>().HasRequired(c => c.AwayTeam)
                .WithMany(c => c.Games)
                .HasForeignKey(c => c.AwayTeamId)
                .WillCascadeOnDelete(true);

            modelBuilder.Entity<Umpire>().HasRequired(u => u.Contact)
                .WithMany()
                .HasForeignKey(u => u.ContactId)
                .WillCascadeOnDelete(true);

            modelBuilder.Entity<MemberBusiness>().HasRequired(m => m.Contact)
                .WithOptional(m => m.MemberBusiness)
                .WillCascadeOnDelete(true);

            modelBuilder.Entity<PhotoGalleryItem>().HasRequired(p => p.Account)
                .WithMany(a => a.Photos)
                .HasForeignKey(p => p.AccountId)
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<PhotoGalleryItem>().HasRequired(p => p.Album)
                .WithMany(a => a.Photos)
                .HasForeignKey(p => p.AlbumId)
                .WillCascadeOnDelete(true);

            modelBuilder.Entity<PhotoGalleryAlbum>().HasRequired(p => p.Account)
                .WithMany(a => a.PhotoAlbums)
                .HasForeignKey(p => p.AccountId)
                .WillCascadeOnDelete(true);

            modelBuilder.Entity<PlayerProfile>()
                .HasRequired(e => e.Contact)
                .WithMany(e => e.Profiles)
                .HasForeignKey(e => e.PlayerId)
                .WillCascadeOnDelete(true);

            modelBuilder.Entity<PlayerProfile>()
                .HasRequired(e => e.Question)
                .WithMany(e => e.PlayerAnswers)
                .HasForeignKey(e => e.QuestionId)
                .WillCascadeOnDelete(true);

            // TODO: Add Column order?
            //[Column(Order = 2)]
            //[DatabaseGenerated(DatabaseGeneratedOption.None)]
            modelBuilder.Entity<PlayerRecap>()
                .HasKey(p => p.PlayerId)
                .HasKey(p => p.TeamId)
                .HasKey(p => p.GameId);

            // rename some columns to match data model.
            modelBuilder.Entity<Game>()
                .Property(p => p.HomeTeamId)
                .HasColumnName("HTeamId");

            modelBuilder.Entity<Game>()
                .Property(p => p.AwayTeamId)
                .HasColumnName("VTeamId");

            modelBuilder.Entity<Game>()
                .Property(p => p.HomeScore)
                .HasColumnName("HScore");

            modelBuilder.Entity<Game>()
                .Property(p => p.AwayScore)
                .HasColumnName("VScore");

            modelBuilder.Entity<GamePitchStats>()
                .Property(p => p.D)
                .HasColumnName("2B");

            modelBuilder.Entity<GamePitchStats>()
                .Property(p => p.T)
                .HasColumnName("3B");

            modelBuilder.Entity<GamePitchStats>()
                .Property(p => p.AB)
                .HasDatabaseGeneratedOption(DatabaseGeneratedOption.Computed);

            modelBuilder.Entity<GamePitchStats>()
                .Property(p => p.TB)
                .HasDatabaseGeneratedOption(DatabaseGeneratedOption.Computed);

            modelBuilder.Entity<GamePitchStats>()
                .Property(p => p.WHIPNumerator)
                .HasDatabaseGeneratedOption(DatabaseGeneratedOption.Computed);

            modelBuilder.Entity<GamePitchStats>()
                .Property(p => p.IPNumerator)
                .HasDatabaseGeneratedOption(DatabaseGeneratedOption.Computed);

            base.OnModelCreating(modelBuilder);
        }

        public DbSet<AccountHandout> AccountHandouts { get; set; }
        public DbSet<Account> Accounts { get; set; }
        public DbSet<AccountSetting> AccountSettings { get; set; }
        public DbSet<AccountType> AccountTypes { get; set; }
        public DbSet<AccountWelcome> AccountWelcome { get; set; }
        public DbSet<Affiliation> Affiliations { get; set; }
        public DbSet<Field> AvailableFields { get; set; }

        public DbSet<GameBatStats> batstatsum { get; set; }
        public DbSet<ContactRole> ContactRoles { get; set; }
        public DbSet<Contact> Contacts { get; set; }
        public DbSet<CurrentSeason> CurrentSeason { get; set; }
        public DbSet<DisplayLeagueLeader> DisplayLeagueLeaders { get; set; }
        public DbSet<DivisionDefinition> DivisionDefs { get; set; }
        public DbSet<DivisionSeason> DivisionSeason { get; set; }

        public DbSet<FieldContact> FieldContacts { get; set; }
        public DbSet<GameFieldStats> fieldstatsum { get; set; }
        public DbSet<GameEjection> GameEjections { get; set; }
        public DbSet<GameRecap> GameRecap { get; set; }
        public DbSet<HOFMember> hof { get; set; }
        public DbSet<HOFNomination> HOFNomination { get; set; }
        public DbSet<HOFNominationSetup> HOFNominationSetup { get; set; }
        public DbSet<LeagueDefinition> League { get; set; }
        public DbSet<LeagueSeason> LeagueSeason { get; set; }

        public DbSet<LeagueEvent> LeagueEvents { get; set; }
        public DbSet<LeagueFAQItem> LeagueFAQ { get; set; }
        public DbSet<LeagueNewsItem> LeagueNews { get; set; }
        public DbSet<Game> LeagueSchedule { get; set; }

        public DbSet<Umpire> LeagueUmpires { get; set; }

        public DbSet<MemberBusiness> MemberBusiness { get; set; }

        public DbSet<MessageCategory> MessageCategory { get; set; }
        public DbSet<MessagePost> MessagePost { get; set; }
        public DbSet<MessageTopic> MessageTopic { get; set; }

        public DbSet<PhotoGalleryItem> PhotoGallery { get; set; }
        public DbSet<PhotoGalleryAlbum> PhotoGalleryAlbum { get; set; }
        public DbSet<GamePitchStats> pitchstatsum { get; set; }

        public DbSet<PlayerProfile> PlayerProfile { get; set; }

        public DbSet<PlayerRecap> PlayerRecap { get; set; }

        public DbSet<PlayerSeasonAffiliationDue> PlayerSeasonAffiliationDues { get; set; }

        // validate with DB
        public DbSet<PlayersWantedClassified> PlayersWantedClassified { get; set; }
        public DbSet<PlayoffBracket> PlayoffBracket { get; set; }
        public DbSet<PlayoffGame> PlayoffGame { get; set; }
        public DbSet<PlayoffSeed> PlayoffSeeds { get; set; }
        public DbSet<PlayoffSetup> PlayoffSetup { get; set; }
        public DbSet<ProfileCategoryItem> ProfileCategory { get; set; }
        public DbSet<ProfileQuestionItem> ProfileQuestion { get; set; }
        // TODO: contruct correctly with virtual connection..
        public DbSet<TeamRoster> Roster { get; set; }
        public DbSet<TeamRosterSeason> RosterSeason { get; set; }
        public DbSet<Season> Season { get; set; }
        public DbSet<Sponsor> Sponsors { get; set; }
        public DbSet<TeamHandout> TeamHandouts { get; set; }
        public DbSet<TeamNewsItem> TeamNews { get; set; }
        // TODO: contruct correctly with virtual connection..
        public DbSet<Team> Teams { get; set; }
        public DbSet<TeamSeason> TeamsSeason { get; set; }
        public DbSet<TeamManager> TeamSeasonManager { get; set; }
        public DbSet<TeamsWantedClassified> TeamsWantedClassified { get; set; }
        public DbSet<VoteResults> VoteAnswers { get; set; }
        public DbSet<VoteOption> VoteOptions { get; set; }
        public DbSet<VoteQuestion> VoteQuestion { get; set; }
        public DbSet<WorkoutAnnouncement> WorkoutAnnouncement { get; set; }
        public DbSet<WorkoutRegistrant> WorkoutRegistration { get; set; }
        
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
