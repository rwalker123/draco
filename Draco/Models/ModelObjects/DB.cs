using System;
using System.ComponentModel.DataAnnotations.Schema;
using System.Configuration;
using System.Data.Entity;
using System.Data.Entity.ModelConfiguration;

namespace ModelObjects
{
    public interface IUnitOfWork : IDisposable
    {
        DbSet<T> Set<T>() where T : class;
        void Commit();
    }

    public class UnitOfWork : IUnitOfWork
    {
        readonly DB _context;
        private bool _isDisposed;

        public UnitOfWork(DB context)
        {
            _context = context;
        }

        public DbSet<T> Set<T>() where T : class
        {
            return _context.Set<T>();
        }

        public void Commit()
        {
            _context.SaveChanges();
        }

        public void Dispose()
        {
            if (_isDisposed)
                return;

            _isDisposed = true;
            _context.Dispose();
        }
    }

    public class DB : DbContext
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
            //modelBuilder.Configurations.Add(new FieldstatsumConfiguration());
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

        public DbSet<Account> Accounts { get; set; } // Accounts
        public DbSet<AccountHandout> AccountHandouts { get; set; } // AccountHandouts
        public DbSet<AccountSetting> AccountSettings { get; set; } // AccountSettings
        public DbSet<AccountType> AccountTypes { get; set; } // AccountTypes
        public DbSet<AccountWelcome> AccountWelcomes { get; set; } // AccountWelcome
        public DbSet<Affiliation> Affiliations { get; set; } // Affiliations
        public DbSet<AspNetRole> AspNetRoles { get; set; } // AspNetRoles
        public DbSet<AspNetUser> AspNetUsers { get; set; } // AspNetUsers
        public DbSet<Field> AvailableFields { get; set; } // AvailableFields
        public DbSet<GameBatStats> Batstatsums { get; set; } // batstatsum
        public DbSet<Contact> Contacts { get; set; } // Contacts
        public DbSet<ContactRole> ContactRoles { get; set; } // ContactRoles
        public DbSet<CurrentSeason> CurrentSeasons { get; set; } // CurrentSeason
        public DbSet<DisplayLeagueLeader> DisplayLeagueLeaders { get; set; } // DisplayLeagueLeaders
        public DbSet<DivisionDefinition> DivisionDefs { get; set; } // DivisionDefs
        public DbSet<DivisionSeason> DivisionSeasons { get; set; } // DivisionSeason
        public DbSet<FieldContact> FieldContacts { get; set; } // FieldContacts
        //public DbSet<Fieldstatsum> Fieldstatsums { get; set; } // fieldstatsum
        public DbSet<GameEjection> GameEjections { get; set; } // GameEjections
        public DbSet<GameRecap> GameRecaps { get; set; } // GameRecap
        public DbSet<HOFMember> Hofs { get; set; } // hof
        public DbSet<HOFNomination> HofNominations { get; set; } // HOFNomination
        public DbSet<HOFNominationSetup> HofNominationSetups { get; set; } // HOFNominationSetup
        public DbSet<LeagueDefinition> Leagues { get; set; } // League
        public DbSet<LeagueEvent> LeagueEvents { get; set; } // LeagueEvents
        public DbSet<LeagueFAQItem> LeagueFaqs { get; set; } // LeagueFAQ
        public DbSet<LeagueNewsItem> LeagueNews { get; set; } // LeagueNews
        public DbSet<Game> LeagueSchedules { get; set; } // LeagueSchedule
        public DbSet<LeagueSeason> LeagueSeasons { get; set; } // LeagueSeason
        public DbSet<Umpire> LeagueUmpires { get; set; } // LeagueUmpires
        public DbSet<MemberBusiness> MemberBusinesses { get; set; } // MemberBusiness
        public DbSet<MessageCategory> MessageCategories { get; set; } // MessageCategory
        public DbSet<MessagePost> MessagePosts { get; set; } // MessagePost
        public DbSet<MessageTopic> MessageTopics { get; set; } // MessageTopic
        public DbSet<PhotoGalleryItem> PhotoGalleries { get; set; } // PhotoGallery
        public DbSet<PhotoGalleryAlbum> PhotoGalleryAlbums { get; set; } // PhotoGalleryAlbum
        public DbSet<GamePitchStats> Pitchstatsums { get; set; } // pitchstatsum
        public DbSet<ProfileQuestionAnswer> PlayerProfiles { get; set; } // PlayerProfile
        public DbSet<PlayerRecap> PlayerRecaps { get; set; } // PlayerRecap
        public DbSet<PlayerSeasonAffiliationDue> PlayerSeasonAffiliationDues { get; set; } // PlayerSeasonAffiliationDues
        public DbSet<PlayersWantedClassified> PlayersWantedClassifieds { get; set; } // PlayersWantedClassified
        public DbSet<PlayoffBracket> PlayoffBrackets { get; set; } // PlayoffBracket
        public DbSet<PlayoffGame> PlayoffGames { get; set; } // PlayoffGame
        public DbSet<PlayoffSeed> PlayoffSeeds { get; set; } // PlayoffSeeds
        public DbSet<PlayoffSetup> PlayoffSetups { get; set; } // PlayoffSetup
        public DbSet<ProfileCategoryItem> ProfileCategories { get; set; } // ProfileCategory
        public DbSet<ProfileQuestionItem> ProfileQuestions { get; set; } // ProfileQuestion
        public DbSet<Player> Rosters { get; set; } // Roster
        public DbSet<PlayerSeason> RosterSeasons { get; set; } // RosterSeason
        public DbSet<Season> Seasons { get; set; } // Season
        public DbSet<Sponsor> Sponsors { get; set; } // Sponsors
        public DbSet<Team> Teams { get; set; } // Teams
        public DbSet<TeamHandout> TeamHandouts { get; set; } // TeamHandouts
        public DbSet<TeamNewsItem> TeamNews { get; set; } // TeamNews
        public DbSet<TeamManager> TeamSeasonManagers { get; set; } // TeamSeasonManager
        public DbSet<TeamSeason> TeamsSeasons { get; set; } // TeamsSeason
        public DbSet<TeamsWantedClassified> TeamsWantedClassifieds { get; set; } // TeamsWantedClassified
        public DbSet<VoteAnswer> VoteAnswers { get; set; } // VoteAnswers
        public DbSet<VoteOption> VoteOptions { get; set; } // VoteOptions
        public DbSet<VoteQuestion> VoteQuestions { get; set; } // VoteQuestion
        public DbSet<WorkoutAnnouncement> WorkoutAnnouncements { get; set; } // WorkoutAnnouncement
        public DbSet<WorkoutRegistrant> WorkoutRegistrations { get; set; } // WorkoutRegistration
    }

    internal class GolfDB : DbContext
    {
        public GolfDB()
            : base(ConfigurationManager.ConnectionStrings["webDBConnection"].ConnectionString)
        {
        }

        // TODO:
    }

#region Configurations
    internal class AccountConfiguration : EntityTypeConfiguration<Account>
    {
        public AccountConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".Accounts");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("Id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.OwnerId).HasColumnName("OwnerId").IsRequired();
            Property(x => x.Name).HasColumnName("Name").IsRequired().IsUnicode(false).HasMaxLength(75);
            Property(x => x.Url).HasColumnName("URL").IsRequired().IsUnicode(false).HasMaxLength(200);
            Property(x => x.FirstYear).HasColumnName("FirstYear").IsRequired();
            Property(x => x.AccountTypeId).HasColumnName("AccountTypeId").IsRequired();
            Property(x => x.AffiliationId).HasColumnName("AffiliationId").IsRequired();
            Property(x => x.TimeZoneId).HasColumnName("TimeZoneId").IsRequired().IsUnicode(false).HasMaxLength(50);
            Property(x => x.TwitterAccountName).HasColumnName("TwitterAccountName").IsRequired().IsUnicode(false).HasMaxLength(50);
            Property(x => x.TwitterOauthToken).HasColumnName("TwitterOauthToken").IsRequired().IsUnicode(false).HasMaxLength(50);
            Property(x => x.TwitterOauthSecretKey).HasColumnName("TwitterOauthSecretKey").IsRequired().IsUnicode(false).HasMaxLength(50);
            Property(x => x.YouTubeUserId).HasColumnName("YouTubeUserId").IsOptional().IsUnicode(false).HasMaxLength(50);
            Property(x => x.FacebookFanPage).HasColumnName("FacebookFanPage").IsOptional().IsUnicode(false).HasMaxLength(50);
            Property(x => x.TwitterWidgetScript).HasColumnName("TwitterWidgetScript").IsOptional().IsUnicode(false).HasMaxLength(512);
            Property(x => x.DefaultVideo).HasColumnName("DefaultVideo").IsRequired().IsUnicode(false).HasMaxLength(50);
            Property(x => x.AutoPlayVideo).HasColumnName("AutoPlayVideo").IsRequired();

            // Foreign keys
            HasRequired(a => a.AccountType).WithMany(b => b.Accounts).HasForeignKey(c => c.AccountTypeId); // FK_AccountTypes_Accounts
            HasRequired(a => a.Affiliation).WithMany(b => b.Accounts).HasForeignKey(c => c.AffiliationId); // FK_Affiliations_Accounts
        }
    }

    // AccountHandouts
    internal class AccountHandoutConfiguration : EntityTypeConfiguration<AccountHandout>
    {
        public AccountHandoutConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".AccountHandouts");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("Id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.Description).HasColumnName("Description").IsRequired().IsUnicode(false).HasMaxLength(255);
            Property(x => x.FileName).HasColumnName("FileName").IsRequired().IsUnicode(false).HasMaxLength(255);
            Property(x => x.AccountId).HasColumnName("AccountId").IsRequired();

            // Foreign keys
            HasRequired(a => a.Account).WithMany(b => b.AccountHandouts).HasForeignKey(c => c.AccountId); // FK_AccountHandouts_Accounts
        }
    }

    // AccountSettings
    internal class AccountSettingConfiguration : EntityTypeConfiguration<AccountSetting>
    {
        public AccountSettingConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".AccountSettings");
            HasKey(x => new { x.AccountId, x.SettingKey });

            Property(x => x.AccountId).HasColumnName("AccountId").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.None);
            Property(x => x.SettingKey).HasColumnName("SettingKey").IsRequired().IsUnicode(false).HasMaxLength(25).HasDatabaseGeneratedOption(DatabaseGeneratedOption.None);
            Property(x => x.SettingValue).HasColumnName("SettingValue").IsRequired().IsUnicode(false).HasMaxLength(25);

            // Foreign keys
            HasRequired(a => a.Account).WithMany(b => b.AccountSettings).HasForeignKey(c => c.AccountId); // FK_AccountSettings_Accounts
        }
    }

    // AccountTypes
    internal class AccountTypeConfiguration : EntityTypeConfiguration<AccountType>
    {
        public AccountTypeConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".AccountTypes");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("Id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.None);
            Property(x => x.Name).HasColumnName("Name").IsRequired().IsUnicode(false).HasMaxLength(75);
            Property(x => x.FilePath).HasColumnName("FilePath").IsRequired().IsUnicode(false).HasMaxLength(255);
            Property(x => x.FacebookAppId).HasColumnName("FacebookAppId").IsRequired().IsUnicode(false).HasMaxLength(50);
            Property(x => x.FacebookSecretKey).HasColumnName("FacebookSecretKey").IsRequired().IsUnicode(false).HasMaxLength(50);
            Property(x => x.TwitterAppId).HasColumnName("TwitterAppId").IsRequired().IsUnicode(false).HasMaxLength(50);
            Property(x => x.TwitterSecret).HasColumnName("TwitterSecret").IsRequired().IsUnicode(false).HasMaxLength(50);
        }
    }

    // AccountWelcome
    internal class AccountWelcomeConfiguration : EntityTypeConfiguration<AccountWelcome>
    {
        public AccountWelcomeConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".AccountWelcome");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("Id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.AccountId).HasColumnName("AccountId").IsRequired();
            Property(x => x.OrderNo).HasColumnName("OrderNo").IsRequired();
            Property(x => x.CaptionMenu).HasColumnName("CaptionMenu").IsRequired().IsUnicode(false).HasMaxLength(50);
            Property(x => x.WelcomeText).HasColumnName("WelcomeText").IsRequired().IsUnicode(false);
            Property(x => x.TeamId).HasColumnName("TeamId").IsOptional();

            // Foreign keys
            HasRequired(a => a.Account).WithMany(b => b.AccountWelcomes).HasForeignKey(c => c.AccountId); // FK_AccountWelcome_Accounts
            HasOptional(a => a.Team).WithMany(b => b.AccountWelcomes).HasForeignKey(c => c.TeamId); // FK_AccountWelcome_Teams
        }
    }

    // Affiliations
    internal class AffiliationConfiguration : EntityTypeConfiguration<Affiliation>
    {
        public AffiliationConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".Affiliations");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("Id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.Name).HasColumnName("Name").IsRequired().IsUnicode(false).HasMaxLength(75);
        }
    }

    // AspNetRoles
    internal class AspNetRoleConfiguration : EntityTypeConfiguration<AspNetRole>
    {
        public AspNetRoleConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".AspNetRoles");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("Id").IsRequired().HasMaxLength(128).HasDatabaseGeneratedOption(DatabaseGeneratedOption.None);
            Property(x => x.Name).HasColumnName("Name").IsRequired();
            HasMany(t => t.AspNetUsers).WithMany(t => t.AspNetRoles).Map(m =>
            {
                m.ToTable("AspNetUserRoles", schema);
                m.MapLeftKey("RoleId");
                m.MapRightKey("UserId");
            });
        }
    }

    // AspNetUsers
    internal class AspNetUserConfiguration : EntityTypeConfiguration<AspNetUser>
    {
        public AspNetUserConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".AspNetUsers");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("Id").IsRequired().HasMaxLength(128).HasDatabaseGeneratedOption(DatabaseGeneratedOption.None);
            Property(x => x.Email).HasColumnName("Email").IsOptional().HasMaxLength(256);
            Property(x => x.EmailConfirmed).HasColumnName("EmailConfirmed").IsRequired();
            Property(x => x.PasswordHash).HasColumnName("PasswordHash").IsOptional();
            Property(x => x.SecurityStamp).HasColumnName("SecurityStamp").IsOptional();
            Property(x => x.PhoneNumber).HasColumnName("PhoneNumber").IsOptional();
            Property(x => x.PhoneNumberConfirmed).HasColumnName("PhoneNumberConfirmed").IsRequired();
            Property(x => x.TwoFactorEnabled).HasColumnName("TwoFactorEnabled").IsRequired();
            Property(x => x.LockoutEndDateUtc).HasColumnName("LockoutEndDateUtc").IsOptional();
            Property(x => x.LockoutEnabled).HasColumnName("LockoutEnabled").IsRequired();
            Property(x => x.AccessFailedCount).HasColumnName("AccessFailedCount").IsRequired();
            Property(x => x.UserName).HasColumnName("UserName").IsOptional().HasMaxLength(256);
        }
    }

    // AvailableFields
    internal class AvailableFieldConfiguration : EntityTypeConfiguration<Field>
    {
        public AvailableFieldConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".AvailableFields");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.AccountId).HasColumnName("AccountId").IsRequired();
            Property(x => x.Name).HasColumnName("Name").IsRequired().IsUnicode(false).HasMaxLength(25);
            Property(x => x.ShortName).HasColumnName("ShortName").IsRequired().IsUnicode(false).HasMaxLength(5);
            Property(x => x.Comment).HasColumnName("Comment").IsRequired().IsUnicode(false).HasMaxLength(255);
            Property(x => x.Address).HasColumnName("Address").IsRequired().IsUnicode(false).HasMaxLength(255);
            Property(x => x.City).HasColumnName("City").IsRequired().IsUnicode(false).HasMaxLength(25);
            Property(x => x.State).HasColumnName("State").IsRequired().IsUnicode(false).HasMaxLength(25);
            Property(x => x.ZipCode).HasColumnName("ZipCode").IsRequired().IsUnicode(false).HasMaxLength(10);
            Property(x => x.Directions).HasColumnName("Directions").IsRequired().IsUnicode(false).HasMaxLength(255);
            Property(x => x.RainoutNumber).HasColumnName("RainoutNumber").IsRequired().IsUnicode(false).HasMaxLength(15);
            Property(x => x.Latitude).HasColumnName("Latitude").IsRequired().IsUnicode(false).HasMaxLength(25);
            Property(x => x.Longitude).HasColumnName("Longitude").IsRequired().IsUnicode(false).HasMaxLength(25);

            // Foreign keys
            HasRequired(a => a.Account).WithMany(b => b.AvailableFields).HasForeignKey(c => c.AccountId); // FK_AvailableFields_Accounts
        }
    }

    // batstatsum
    internal class BatstatsumConfiguration : EntityTypeConfiguration<GameBatStats>
    {
        public BatstatsumConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".batstatsum");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.PlayerId).HasColumnName("PlayerId").IsRequired();
            Property(x => x.GameId).HasColumnName("GameId").IsRequired();
            Property(x => x.TeamId).HasColumnName("TeamId").IsRequired();
            Property(x => x.Ab).HasColumnName("AB").IsRequired();
            Property(x => x.H).HasColumnName("H").IsRequired();
            Property(x => x.R).HasColumnName("R").IsRequired();
            Property(x => x.C2B).HasColumnName("2B").IsRequired();
            Property(x => x.C3B).HasColumnName("3B").IsRequired();
            Property(x => x.Hr).HasColumnName("HR").IsRequired();
            Property(x => x.Rbi).HasColumnName("RBI").IsRequired();
            Property(x => x.So).HasColumnName("SO").IsRequired();
            Property(x => x.Bb).HasColumnName("BB").IsRequired();
            Property(x => x.Re).HasColumnName("RE").IsRequired();
            Property(x => x.Hbp).HasColumnName("HBP").IsRequired();
            Property(x => x.Intr).HasColumnName("INTR").IsRequired();
            Property(x => x.Sf).HasColumnName("SF").IsRequired();
            Property(x => x.Sh).HasColumnName("SH").IsRequired();
            Property(x => x.Sb).HasColumnName("SB").IsRequired();
            Property(x => x.Cs).HasColumnName("CS").IsRequired();
            Property(x => x.Lob).HasColumnName("LOB").IsRequired();
            Property(x => x.Tb).HasColumnName("TB").IsOptional().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Computed);
            Property(x => x.Pa).HasColumnName("PA").IsOptional().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Computed);
            Property(x => x.ObaDenominator).HasColumnName("OBADenominator").IsOptional().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Computed);
            Property(x => x.ObaNumerator).HasColumnName("OBANumerator").IsOptional().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Computed);

            // Foreign keys
            HasRequired(a => a.RosterSeason).WithMany(b => b.Batstatsums).HasForeignKey(c => c.PlayerId); // FK_batstatsum_RosterSeason
            HasRequired(a => a.LeagueSchedule).WithMany(b => b.Batstatsums).HasForeignKey(c => c.GameId); // FK_batstatsum_LeagueSchedule
            HasRequired(a => a.TeamsSeason).WithMany(b => b.Batstatsums).HasForeignKey(c => c.TeamId); // FK_batstatsum_TeamsSeason
        }
    }

    // Contacts
    internal class ContactConfiguration : EntityTypeConfiguration<Contact>
    {
        public ContactConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".Contacts");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("Id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.UserId).HasColumnName("UserId").IsOptional().HasMaxLength(128);
            Property(x => x.LastName).HasColumnName("LastName").IsRequired().IsUnicode(false).HasMaxLength(25);
            Property(x => x.FirstName).HasColumnName("FirstName").IsRequired().IsUnicode(false).HasMaxLength(25);
            Property(x => x.MiddleName).HasColumnName("MiddleName").IsOptional().IsUnicode(false).HasMaxLength(25);
            Property(x => x.Phone1).HasColumnName("Phone1").IsOptional().IsUnicode(false).HasMaxLength(14);
            Property(x => x.Phone2).HasColumnName("Phone2").IsOptional().IsUnicode(false).HasMaxLength(14);
            Property(x => x.Phone3).HasColumnName("Phone3").IsOptional().IsUnicode(false).HasMaxLength(14);
            Property(x => x.CreatorAccountId).HasColumnName("CreatorAccountId").IsRequired();
            Property(x => x.StreetAddress).HasColumnName("StreetAddress").IsOptional().IsUnicode(false).HasMaxLength(75);
            Property(x => x.City).HasColumnName("City").IsOptional().IsUnicode(false).HasMaxLength(25);
            Property(x => x.State).HasColumnName("State").IsOptional().IsUnicode(false).HasMaxLength(25);
            Property(x => x.Zip).HasColumnName("Zip").IsOptional().IsUnicode(false).HasMaxLength(15);
            Property(x => x.FirstYear).HasColumnName("FirstYear").IsOptional();
            Property(x => x.DateOfBirth).HasColumnName("DateOfBirth").IsRequired();
            Property(x => x.IsFemale).HasColumnName("IsFemale").IsOptional();
            Property(x => x.Email).HasColumnName("Email").IsOptional().IsUnicode(false).HasMaxLength(50);

            // Foreign keys
            HasOptional(a => a.AspNetUser).WithMany(b => b.Contacts).HasForeignKey(c => c.UserId); // FK_Contacts_AspNetUsers
        }
    }

    // ContactRoles
    internal class ContactRoleConfiguration : EntityTypeConfiguration<ContactRole>
    {
        public ContactRoleConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".ContactRoles");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("Id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.ContactId).HasColumnName("ContactId").IsRequired();
            Property(x => x.RoleId).HasColumnName("RoleId").IsRequired().HasMaxLength(128);
            Property(x => x.RoleData).HasColumnName("RoleData").IsRequired();
            Property(x => x.AccountId).HasColumnName("AccountId").IsRequired();

            // Foreign keys
            HasRequired(a => a.Contact).WithMany(b => b.ContactRoles).HasForeignKey(c => c.ContactId); // FK_ContactRoles_Contacts
        }
    }

    // CurrentSeason
    internal class CurrentSeasonConfiguration : EntityTypeConfiguration<CurrentSeason>
    {
        public CurrentSeasonConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".CurrentSeason");
            HasKey(x => x.AccountId);

            Property(x => x.SeasonId).HasColumnName("SeasonId").IsRequired();
            Property(x => x.AccountId).HasColumnName("AccountId").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.None);

            // Foreign keys
            HasRequired(a => a.Account).WithOptional(b => b.CurrentSeason); // FK_CurrentSeason_Accounts
        }
    }

    // DisplayLeagueLeaders
    internal class DisplayLeagueLeaderConfiguration : EntityTypeConfiguration<DisplayLeagueLeader>
    {
        public DisplayLeagueLeaderConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".DisplayLeagueLeaders");
            HasKey(x => new { x.FieldName, x.AccountId, x.TeamId, x.IsBatLeader });

            Property(x => x.FieldName).HasColumnName("FieldName").IsRequired().IsUnicode(false).HasMaxLength(50).HasDatabaseGeneratedOption(DatabaseGeneratedOption.None);
            Property(x => x.AccountId).HasColumnName("AccountId").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.None);
            Property(x => x.TeamId).HasColumnName("TeamId").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.None);
            Property(x => x.IsBatLeader).HasColumnName("IsBatLeader").IsRequired();
        }
    }

    // DivisionDefs
    internal class DivisionDefConfiguration : EntityTypeConfiguration<DivisionDefinition>
    {
        public DivisionDefConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".DivisionDefs");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.AccountId).HasColumnName("AccountId").IsRequired();
            Property(x => x.Name).HasColumnName("Name").IsRequired().IsUnicode(false).HasMaxLength(25);

            // Foreign keys
            HasRequired(a => a.Account).WithMany(b => b.DivisionDefs).HasForeignKey(c => c.AccountId); // FK_DivisionDefs_Accounts
        }
    }

    // DivisionSeason
    internal class DivisionSeasonConfiguration : EntityTypeConfiguration<DivisionSeason>
    {
        public DivisionSeasonConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".DivisionSeason");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.DivisionId).HasColumnName("DivisionId").IsRequired();
            Property(x => x.LeagueSeasonId).HasColumnName("LeagueSeasonId").IsRequired();
            Property(x => x.Priority).HasColumnName("Priority").IsRequired();

            // Foreign keys
            HasRequired(a => a.DivisionDef).WithMany(b => b.DivisionSeasons).HasForeignKey(c => c.DivisionId); // FK_DivisionSeason_DivisionDefs
            HasRequired(a => a.LeagueSeason).WithMany(b => b.DivisionSeasons).HasForeignKey(c => c.LeagueSeasonId); // FK_DivisionSeason_LeagueSeason
        }
    }

    // FieldContacts
    internal class FieldContactConfiguration : EntityTypeConfiguration<FieldContact>
    {
        public FieldContactConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".FieldContacts");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("Id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.FieldId).HasColumnName("FieldId").IsRequired();
            Property(x => x.ContactId).HasColumnName("ContactId").IsRequired();

            // Foreign keys
            HasRequired(a => a.AvailableField).WithMany(b => b.FieldContacts).HasForeignKey(c => c.FieldId); // FK_FieldContacts_AvailableFields
            HasRequired(a => a.Contact).WithMany(b => b.FieldContacts).HasForeignKey(c => c.ContactId); // FK_FieldContacts_Contacts
        }
    }

    // fieldstatsum
    //internal class FieldstatsumConfiguration : EntityTypeConfiguration<GameFieldStats>
    //{
    //    public FieldstatsumConfiguration(string schema = "dbo")
    //    {
    //        ToTable(schema + ".fieldstatsum");
    //        HasKey(x => x.Id);

    //        Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
    //        Property(x => x.PlayerId).HasColumnName("PlayerId").IsRequired();
    //        Property(x => x.GameId).HasColumnName("GameId").IsRequired();
    //        Property(x => x.TeamId).HasColumnName("TeamId").IsRequired();
    //        Property(x => x.Pos).HasColumnName("POS").IsRequired();
    //        Property(x => x.Ip).HasColumnName("IP").IsRequired();
    //        Property(x => x.Ip2).HasColumnName("IP2").IsRequired();
    //        Property(x => x.Po).HasColumnName("PO").IsRequired();
    //        Property(x => x.A).HasColumnName("A").IsRequired();
    //        Property(x => x.E).HasColumnName("E").IsRequired();
    //        Property(x => x.Pb).HasColumnName("PB").IsRequired();
    //        Property(x => x.Sb).HasColumnName("SB").IsRequired();
    //        Property(x => x.Cs).HasColumnName("CS").IsRequired();

    //        // Foreign keys
    //        HasRequired(a => a.PlayerSeason).WithMany(b => b.Fieldstatsums).HasForeignKey(c => c.PlayerId); // FK_fieldstatsum_RosterSeason
    //        HasRequired(a => a.Game).WithMany(b => b.Fieldstatsums).HasForeignKey(c => c.GameId); // FK_fieldstatsum_LeagueSchedule
    //        HasRequired(a => a.TeamSeason).WithMany(b => b.Fieldstatsums).HasForeignKey(c => c.TeamId); // FK_fieldstatsum_TeamsSeason
    //    }
    //}

    // GameEjections
    internal class GameEjectionConfiguration : EntityTypeConfiguration<GameEjection>
    {
        public GameEjectionConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".GameEjections");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.LeagueSeasonId).HasColumnName("leagueSeasonId").IsRequired();
            Property(x => x.GameId).HasColumnName("gameId").IsRequired();
            Property(x => x.PlayerSeasonId).HasColumnName("playerSeasonId").IsRequired();
            Property(x => x.UmpireId).HasColumnName("umpireId").IsRequired();
            Property(x => x.Comments).HasColumnName("comments").IsRequired().HasMaxLength(1073741823);

            // Foreign keys
            HasRequired(a => a.LeagueSeason).WithMany(b => b.GameEjections).HasForeignKey(c => c.LeagueSeasonId); // FK_GameEjections_LeagueSeason
            HasRequired(a => a.LeagueSchedule).WithMany(b => b.GameEjections).HasForeignKey(c => c.GameId); // FK_GameEjections_LeagueSchedule
            HasRequired(a => a.RosterSeason).WithMany(b => b.GameEjections).HasForeignKey(c => c.PlayerSeasonId); // FK_GameEjections_RosterSeason
            HasRequired(a => a.LeagueUmpire).WithMany(b => b.GameEjections).HasForeignKey(c => c.UmpireId); // FK_GameEjections_LeagueUmpires
        }
    }

    // GameRecap
    internal class GameRecapConfiguration : EntityTypeConfiguration<GameRecap>
    {
        public GameRecapConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".GameRecap");
            HasKey(x => new { x.GameId, x.TeamId });

            Property(x => x.GameId).HasColumnName("GameId").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.None);
            Property(x => x.TeamId).HasColumnName("TeamId").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.None);
            Property(x => x.Recap).HasColumnName("Recap").IsRequired().IsUnicode(false);

            // Foreign keys
            HasRequired(a => a.LeagueSchedule).WithMany(b => b.GameRecaps).HasForeignKey(c => c.GameId); // FK_GameRecap_LeagueSchedule
            HasRequired(a => a.TeamsSeason).WithMany(b => b.GameRecaps).HasForeignKey(c => c.TeamId); // FK_GameRecap_TeamsSeason
        }
    }
#if GOLF
    // GolfCourse
    internal class GolfCourseConfiguration : EntityTypeConfiguration<GolfCourse>
    {
        public GolfCourseConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".GolfCourse");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("Id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.Name).HasColumnName("Name").IsRequired().IsUnicode(false).HasMaxLength(100);
            Property(x => x.Designer).HasColumnName("Designer").IsOptional().IsUnicode(false).HasMaxLength(50);
            Property(x => x.YearBuilt).HasColumnName("YearBuilt").IsOptional();
            Property(x => x.NumberOfHoles).HasColumnName("NumberOfHoles").IsRequired();
            Property(x => x.Address).HasColumnName("Address").IsOptional().IsUnicode(false).HasMaxLength(50);
            Property(x => x.City).HasColumnName("City").IsOptional().IsUnicode(false).HasMaxLength(50);
            Property(x => x.State).HasColumnName("State").IsOptional().IsUnicode(false).HasMaxLength(50);
            Property(x => x.Zip).HasColumnName("Zip").IsOptional().IsUnicode(false).HasMaxLength(20);
            Property(x => x.Country).HasColumnName("Country").IsOptional().IsUnicode(false).HasMaxLength(30);
            Property(x => x.MensPar1).HasColumnName("MensPar1").IsRequired();
            Property(x => x.MensPar2).HasColumnName("MensPar2").IsRequired();
            Property(x => x.MensPar3).HasColumnName("MensPar3").IsRequired();
            Property(x => x.MensPar4).HasColumnName("MensPar4").IsRequired();
            Property(x => x.MensPar5).HasColumnName("MensPar5").IsRequired();
            Property(x => x.MensPar6).HasColumnName("MensPar6").IsRequired();
            Property(x => x.MensPar7).HasColumnName("MensPar7").IsRequired();
            Property(x => x.MensPar8).HasColumnName("MensPar8").IsRequired();
            Property(x => x.MensPar9).HasColumnName("MensPar9").IsRequired();
            Property(x => x.MensPar10).HasColumnName("MensPar10").IsRequired();
            Property(x => x.MensPar11).HasColumnName("MensPar11").IsRequired();
            Property(x => x.MensPar12).HasColumnName("MensPar12").IsRequired();
            Property(x => x.MensPar13).HasColumnName("MensPar13").IsRequired();
            Property(x => x.MensPar14).HasColumnName("MensPar14").IsRequired();
            Property(x => x.MensPar15).HasColumnName("MensPar15").IsRequired();
            Property(x => x.MensPar16).HasColumnName("MensPar16").IsRequired();
            Property(x => x.MensPar17).HasColumnName("MensPar17").IsRequired();
            Property(x => x.MensPar18).HasColumnName("MensPar18").IsRequired();
            Property(x => x.WomansPar1).HasColumnName("WomansPar1").IsRequired();
            Property(x => x.WomansPar2).HasColumnName("WomansPar2").IsRequired();
            Property(x => x.WomansPar3).HasColumnName("WomansPar3").IsRequired();
            Property(x => x.WomansPar4).HasColumnName("WomansPar4").IsRequired();
            Property(x => x.WomansPar5).HasColumnName("WomansPar5").IsRequired();
            Property(x => x.WomansPar6).HasColumnName("WomansPar6").IsRequired();
            Property(x => x.WomansPar7).HasColumnName("WomansPar7").IsRequired();
            Property(x => x.WomansPar8).HasColumnName("WomansPar8").IsRequired();
            Property(x => x.WomansPar9).HasColumnName("WomansPar9").IsRequired();
            Property(x => x.WomansPar10).HasColumnName("WomansPar10").IsRequired();
            Property(x => x.WomansPar11).HasColumnName("WomansPar11").IsRequired();
            Property(x => x.WomansPar12).HasColumnName("WomansPar12").IsRequired();
            Property(x => x.WomansPar13).HasColumnName("WomansPar13").IsRequired();
            Property(x => x.WomansPar14).HasColumnName("WomansPar14").IsRequired();
            Property(x => x.WomansPar15).HasColumnName("WomansPar15").IsRequired();
            Property(x => x.WomansPar16).HasColumnName("WomansPar16").IsRequired();
            Property(x => x.WomansPar17).HasColumnName("WomansPar17").IsRequired();
            Property(x => x.WomansPar18).HasColumnName("WomansPar18").IsRequired();
            Property(x => x.MensHandicap1).HasColumnName("MensHandicap1").IsRequired();
            Property(x => x.MensHandicap2).HasColumnName("MensHandicap2").IsRequired();
            Property(x => x.MensHandicap3).HasColumnName("MensHandicap3").IsRequired();
            Property(x => x.MensHandicap4).HasColumnName("MensHandicap4").IsRequired();
            Property(x => x.MensHandicap5).HasColumnName("MensHandicap5").IsRequired();
            Property(x => x.MensHandicap6).HasColumnName("MensHandicap6").IsRequired();
            Property(x => x.MensHandicap7).HasColumnName("MensHandicap7").IsRequired();
            Property(x => x.MensHandicap8).HasColumnName("MensHandicap8").IsRequired();
            Property(x => x.MensHandicap9).HasColumnName("MensHandicap9").IsRequired();
            Property(x => x.MensHandicap10).HasColumnName("MensHandicap10").IsRequired();
            Property(x => x.MensHandicap11).HasColumnName("MensHandicap11").IsRequired();
            Property(x => x.MensHandicap12).HasColumnName("MensHandicap12").IsRequired();
            Property(x => x.MensHandicap13).HasColumnName("MensHandicap13").IsRequired();
            Property(x => x.MensHandicap14).HasColumnName("MensHandicap14").IsRequired();
            Property(x => x.MensHandicap15).HasColumnName("MensHandicap15").IsRequired();
            Property(x => x.MensHandicap16).HasColumnName("MensHandicap16").IsRequired();
            Property(x => x.MensHandicap17).HasColumnName("MensHandicap17").IsRequired();
            Property(x => x.MensHandicap18).HasColumnName("MensHandicap18").IsRequired();
            Property(x => x.WomansHandicap1).HasColumnName("WomansHandicap1").IsRequired();
            Property(x => x.WomansHandicap2).HasColumnName("WomansHandicap2").IsRequired();
            Property(x => x.WomansHandicap3).HasColumnName("WomansHandicap3").IsRequired();
            Property(x => x.WomansHandicap4).HasColumnName("WomansHandicap4").IsRequired();
            Property(x => x.WomansHandicap5).HasColumnName("WomansHandicap5").IsRequired();
            Property(x => x.WomansHandicap6).HasColumnName("WomansHandicap6").IsRequired();
            Property(x => x.WomansHandicap7).HasColumnName("WomansHandicap7").IsRequired();
            Property(x => x.WomansHandicap8).HasColumnName("WomansHandicap8").IsRequired();
            Property(x => x.WomansHandicap9).HasColumnName("WomansHandicap9").IsRequired();
            Property(x => x.WomansHandicap10).HasColumnName("WomansHandicap10").IsRequired();
            Property(x => x.WomansHandicap11).HasColumnName("WomansHandicap11").IsRequired();
            Property(x => x.WomansHandicap12).HasColumnName("WomansHandicap12").IsRequired();
            Property(x => x.WomansHandicap13).HasColumnName("WomansHandicap13").IsRequired();
            Property(x => x.WomansHandicap14).HasColumnName("WomansHandicap14").IsRequired();
            Property(x => x.WomansHandicap15).HasColumnName("WomansHandicap15").IsRequired();
            Property(x => x.WomansHandicap16).HasColumnName("WomansHandicap16").IsRequired();
            Property(x => x.WomansHandicap17).HasColumnName("WomansHandicap17").IsRequired();
            Property(x => x.WomansHandicap18).HasColumnName("WomansHandicap18").IsRequired();
        }
    }

    // GolfCourseForContact
    internal class GolfCourseForContactConfiguration : EntityTypeConfiguration<GolfCourseForContact>
    {
        public GolfCourseForContactConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".GolfCourseForContact");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("Id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.ContactId).HasColumnName("ContactId").IsRequired();
            Property(x => x.CourseId).HasColumnName("CourseId").IsRequired();

            // Foreign keys
            HasRequired(a => a.Contact).WithMany(b => b.GolfCourseForContacts).HasForeignKey(c => c.ContactId); // FK_GolfCourseForContact_Contacts
            HasRequired(a => a.GolfCourse).WithMany(b => b.GolfCourseForContacts).HasForeignKey(c => c.CourseId); // FK_GolfCourseForContact_GolfCourse
        }
    }

    // GolferStatsConfiguration
    internal class GolferStatsConfigurationConfiguration : EntityTypeConfiguration<GolferStatsConfiguration>
    {
        public GolferStatsConfigurationConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".GolferStatsConfiguration");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("Id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.ContactId).HasColumnName("ContactId").IsRequired();
            Property(x => x.StatId).HasColumnName("StatId").IsRequired();

            // Foreign keys
            HasRequired(a => a.Contact).WithMany(b => b.GolferStatsConfigurations).HasForeignKey(c => c.ContactId); // FK_GolferStatsConfiguration_Contacts
            HasRequired(a => a.GolfStatDef).WithMany(b => b.GolferStatsConfigurations).HasForeignKey(c => c.StatId); // FK_GolferStatsConfiguration_GolfStatDef
        }
    }

    // GolferStatsValue
    internal class GolferStatsValueConfiguration : EntityTypeConfiguration<GolferStatsValue>
    {
        public GolferStatsValueConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".GolferStatsValue");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("Id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.ScoreId).HasColumnName("ScoreId").IsRequired();
            Property(x => x.ContactId).HasColumnName("ContactId").IsRequired();
            Property(x => x.HoleNo).HasColumnName("HoleNo").IsRequired();
            Property(x => x.Value).HasColumnName("Value").IsRequired().IsUnicode(false).HasMaxLength(100);

            // Foreign keys
            HasRequired(a => a.GolfScore).WithMany(b => b.GolferStatsValues).HasForeignKey(c => c.ScoreId); // FK_GolferStatsValue_GolfScore
            HasRequired(a => a.Contact).WithMany(b => b.GolferStatsValues).HasForeignKey(c => c.ContactId); // FK_GolferStatsValue_Contacts
        }
    }

    // GolfLeagueCourses
    internal class GolfLeagueCoursConfiguration : EntityTypeConfiguration<GolfLeagueCours>
    {
        public GolfLeagueCoursConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".GolfLeagueCourses");
            HasKey(x => new { x.AccountId, x.CourseId });

            Property(x => x.AccountId).HasColumnName("AccountId").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.None);
            Property(x => x.CourseId).HasColumnName("CourseId").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.None);
            Property(x => x.DefaultMensTee).HasColumnName("DefaultMensTee").IsOptional();
            Property(x => x.DefaultWomansTee).HasColumnName("DefaultWomansTee").IsOptional();

            // Foreign keys
            HasRequired(a => a.Account).WithMany(b => b.GolfLeagueCours).HasForeignKey(c => c.AccountId); // FK_GolfLeagueCourses_Accounts
            HasRequired(a => a.GolfCourse).WithMany(b => b.GolfLeagueCours).HasForeignKey(c => c.CourseId); // FK_GolfLeagueCourses_GolfCourse
        }
    }

    // GolfLeagueSetup
    internal class GolfLeagueSetupConfiguration : EntityTypeConfiguration<GolfLeagueSetup>
    {
        public GolfLeagueSetupConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".GolfLeagueSetup");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("Id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.None);
            Property(x => x.AccountId).HasColumnName("AccountId").IsRequired();
            Property(x => x.PresidentId).HasColumnName("PresidentId").IsRequired();
            Property(x => x.VicePresidentId).HasColumnName("VicePresidentId").IsRequired();
            Property(x => x.SecretaryId).HasColumnName("SecretaryId").IsRequired();
            Property(x => x.TreasurerId).HasColumnName("TreasurerId").IsRequired();
            Property(x => x.LeagueDay).HasColumnName("LeagueDay").IsRequired();
            Property(x => x.FirstTeeTime).HasColumnName("FirstTeeTime").IsRequired();
            Property(x => x.TimeBetweenTeeTimes).HasColumnName("TimeBetweenTeeTimes").IsRequired();
            Property(x => x.HolesPerMatch).HasColumnName("HolesPerMatch").IsRequired();
            Property(x => x.TeeOffFormat).HasColumnName("TeeOffFormat").IsRequired();
            Property(x => x.IndNetPerHolePts).HasColumnName("IndNetPerHolePts").IsRequired();
            Property(x => x.IndNetPerNinePts).HasColumnName("IndNetPerNinePts").IsRequired();
            Property(x => x.IndNetPerMatchPts).HasColumnName("IndNetPerMatchPts").IsRequired();
            Property(x => x.IndNetTotalHolesPts).HasColumnName("IndNetTotalHolesPts").IsRequired();
            Property(x => x.IndNetAgainstFieldPts).HasColumnName("IndNetAgainstFieldPts").IsRequired();
            Property(x => x.IndNetAgainstFieldDescPts).HasColumnName("IndNetAgainstFieldDescPts").IsRequired();
            Property(x => x.IndActPerHolePts).HasColumnName("IndActPerHolePts").IsRequired();
            Property(x => x.IndActPerNinePts).HasColumnName("IndActPerNinePts").IsRequired();
            Property(x => x.IndActPerMatchPts).HasColumnName("IndActPerMatchPts").IsRequired();
            Property(x => x.IndActTotalHolesPts).HasColumnName("IndActTotalHolesPts").IsRequired();
            Property(x => x.IndActAgainstFieldPts).HasColumnName("IndActAgainstFieldPts").IsRequired();
            Property(x => x.IndActAgainstFieldDescPts).HasColumnName("IndActAgainstFieldDescPts").IsRequired();
            Property(x => x.TeamNetPerHolePts).HasColumnName("TeamNetPerHolePts").IsRequired();
            Property(x => x.TeamNetPerNinePts).HasColumnName("TeamNetPerNinePts").IsRequired();
            Property(x => x.TeamNetPerMatchPts).HasColumnName("TeamNetPerMatchPts").IsRequired();
            Property(x => x.TeamNetTotalHolesPts).HasColumnName("TeamNetTotalHolesPts").IsRequired();
            Property(x => x.TeamNetAgainstFieldPts).HasColumnName("TeamNetAgainstFieldPts").IsRequired();
            Property(x => x.TeamActPerHolePts).HasColumnName("TeamActPerHolePts").IsRequired();
            Property(x => x.TeamActPerNinePts).HasColumnName("TeamActPerNinePts").IsRequired();
            Property(x => x.TeamActPerMatchPts).HasColumnName("TeamActPerMatchPts").IsRequired();
            Property(x => x.TeamActTotalHolesPts).HasColumnName("TeamActTotalHolesPts").IsRequired();
            Property(x => x.TeamActAgainstFieldPts).HasColumnName("TeamActAgainstFieldPts").IsRequired();
            Property(x => x.TeamAgainstFieldDescPts).HasColumnName("TeamAgainstFieldDescPts").IsRequired();
            Property(x => x.TeamNetBestBallPerHolePts).HasColumnName("TeamNetBestBallPerHolePts").IsRequired();
            Property(x => x.TeamActBestBallPerHolePts).HasColumnName("TeamActBestBallPerHolePts").IsRequired();
            Property(x => x.UseTeamScoring).HasColumnName("UseTeamScoring").IsRequired();
            Property(x => x.UseIndividualScoring).HasColumnName("UseIndividualScoring").IsRequired();

            // Foreign keys
            HasRequired(a => a.Account).WithMany(b => b.GolfLeagueSetups).HasForeignKey(c => c.AccountId); // FK_GolfLeagueSetup_Accounts
            HasRequired(a => a.Contact_PresidentId).WithMany(b => b.GolfLeagueSetups_PresidentId).HasForeignKey(c => c.PresidentId); // FK_GolfLeagueSetup_Contacts
            HasRequired(a => a.Contact_VicePresidentId).WithMany(b => b.GolfLeagueSetups_VicePresidentId).HasForeignKey(c => c.VicePresidentId); // FK_GolfLeagueSetup_Contacts1
            HasRequired(a => a.Contact_SecretaryId).WithMany(b => b.GolfLeagueSetups_SecretaryId).HasForeignKey(c => c.SecretaryId); // FK_GolfLeagueSetup_Contacts2
            HasRequired(a => a.Contact_TreasurerId).WithMany(b => b.GolfLeagueSetups_TreasurerId).HasForeignKey(c => c.TreasurerId); // FK_GolfLeagueSetup_Contacts3
        }
    }

    // GolfMatch
    internal class GolfMatchConfiguration : EntityTypeConfiguration<GolfMatch>
    {
        public GolfMatchConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".GolfMatch");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("Id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.Team1).HasColumnName("Team1").IsRequired();
            Property(x => x.Team2).HasColumnName("Team2").IsRequired();
            Property(x => x.LeagueId).HasColumnName("LeagueId").IsRequired();
            Property(x => x.MatchDate).HasColumnName("MatchDate").IsRequired();
            Property(x => x.MatchTime).HasColumnName("MatchTime").IsRequired();
            Property(x => x.CourseId).HasColumnName("CourseId").IsOptional();
            Property(x => x.MatchStatus).HasColumnName("MatchStatus").IsRequired();
            Property(x => x.MatchType).HasColumnName("MatchType").IsRequired();
            Property(x => x.Comment).HasColumnName("Comment").IsRequired().IsUnicode(false).HasMaxLength(255);

            // Foreign keys
            HasRequired(a => a.TeamsSeason_Team1).WithMany(b => b.GolfMatches_Team1).HasForeignKey(c => c.Team1); // FK_GolfMatch_TeamsSeason
            HasRequired(a => a.TeamsSeason_Team2).WithMany(b => b.GolfMatches_Team2).HasForeignKey(c => c.Team2); // FK_GolfMatch_Teams
            HasRequired(a => a.LeagueSeason).WithMany(b => b.GolfMatches).HasForeignKey(c => c.LeagueId); // FK_GolfMatch_LeagueSeason
            HasOptional(a => a.GolfCourse).WithMany(b => b.GolfMatches).HasForeignKey(c => c.CourseId); // FK_GolfMatch_GolfCourse
        }
    }

    // GolfMatchScores
    internal class GolfMatchScoreConfiguration : EntityTypeConfiguration<GolfMatchScore>
    {
        public GolfMatchScoreConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".GolfMatchScores");
            HasKey(x => new { x.MatchId, x.TeamId, x.PlayerId, x.ScoreId });

            Property(x => x.MatchId).HasColumnName("MatchId").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.None);
            Property(x => x.TeamId).HasColumnName("TeamId").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.None);
            Property(x => x.PlayerId).HasColumnName("PlayerId").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.None);
            Property(x => x.ScoreId).HasColumnName("ScoreId").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.None);

            // Foreign keys
            HasRequired(a => a.GolfMatch).WithMany(b => b.GolfMatchScores).HasForeignKey(c => c.MatchId); // FK_GolfMatchScores_GolfMatch
            HasRequired(a => a.TeamsSeason).WithMany(b => b.GolfMatchScores).HasForeignKey(c => c.TeamId); // FK_GolfMatchScores_TeamsSeason
            HasRequired(a => a.GolfRoster).WithMany(b => b.GolfMatchScores).HasForeignKey(c => c.PlayerId); // FK_GolfMatchScores_GolfRoster
            HasRequired(a => a.GolfScore).WithMany(b => b.GolfMatchScores).HasForeignKey(c => c.ScoreId); // FK_GolfMatchScores_GolfScore
        }
    }

    // GolfRoster
    internal class GolfRosterConfiguration : EntityTypeConfiguration<GolfRoster>
    {
        public GolfRosterConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".GolfRoster");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("Id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.ContactId).HasColumnName("ContactId").IsRequired();
            Property(x => x.TeamSeasonId).HasColumnName("TeamSeasonId").IsRequired();
            Property(x => x.IsActive).HasColumnName("IsActive").IsRequired();
            Property(x => x.InitialDifferential).HasColumnName("InitialDifferential").IsOptional();
            Property(x => x.IsSub).HasColumnName("IsSub").IsRequired();
            Property(x => x.SubSeasonId).HasColumnName("SubSeasonId").IsOptional();

            // Foreign keys
            HasRequired(a => a.Contact).WithMany(b => b.GolfRosters).HasForeignKey(c => c.ContactId); // FK_GolfRoster_Contacts
            HasRequired(a => a.TeamsSeason).WithMany(b => b.GolfRosters).HasForeignKey(c => c.TeamSeasonId); // FK_GolfRoster_TeamsSeason
        }
    }

    // GolfScore
    internal class GolfScoreConfiguration : EntityTypeConfiguration<GolfScore>
    {
        public GolfScoreConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".GolfScore");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("Id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.CourseId).HasColumnName("CourseId").IsRequired();
            Property(x => x.ContactId).HasColumnName("ContactId").IsRequired();
            Property(x => x.TeeId).HasColumnName("TeeId").IsRequired();
            Property(x => x.DatePlayed).HasColumnName("DatePlayed").IsRequired();
            Property(x => x.HolesPlayed).HasColumnName("HolesPlayed").IsRequired();
            Property(x => x.TotalScore).HasColumnName("TotalScore").IsRequired();
            Property(x => x.TotalsOnly).HasColumnName("TotalsOnly").IsRequired();
            Property(x => x.HoleScore1).HasColumnName("HoleScore1").IsRequired();
            Property(x => x.HoleScore2).HasColumnName("HoleScore2").IsRequired();
            Property(x => x.HoleScore3).HasColumnName("HoleScore3").IsRequired();
            Property(x => x.HoleScore4).HasColumnName("HoleScore4").IsRequired();
            Property(x => x.HoleScore5).HasColumnName("HoleScore5").IsRequired();
            Property(x => x.HoleScore6).HasColumnName("HoleScore6").IsRequired();
            Property(x => x.HoleScore7).HasColumnName("HoleScore7").IsRequired();
            Property(x => x.HoleScore8).HasColumnName("HoleScore8").IsRequired();
            Property(x => x.HoleScore9).HasColumnName("HoleScore9").IsRequired();
            Property(x => x.HoleScore10).HasColumnName("HoleScore10").IsRequired();
            Property(x => x.HoleScore11).HasColumnName("HoleScore11").IsRequired();
            Property(x => x.HoleScore12).HasColumnName("HoleScore12").IsRequired();
            Property(x => x.HoleScore13).HasColumnName("HoleScore13").IsRequired();
            Property(x => x.HoleScore14).HasColumnName("HoleScore14").IsRequired();
            Property(x => x.HoleScore15).HasColumnName("HoleScore15").IsRequired();
            Property(x => x.HoleScore16).HasColumnName("HoleScore16").IsRequired();
            Property(x => x.HoleScore17).HasColumnName("HoleScore17").IsRequired();
            Property(x => x.HoleScore18).HasColumnName("HoleScore18").IsRequired();
            Property(x => x.StartIndex).HasColumnName("StartIndex").IsOptional();
            Property(x => x.StartIndex9).HasColumnName("StartIndex9").IsOptional();

            // Foreign keys
            HasRequired(a => a.GolfCourse).WithMany(b => b.GolfScores).HasForeignKey(c => c.CourseId); // FK_GolfScore_GolfCourse
            HasRequired(a => a.Contact).WithMany(b => b.GolfScores).HasForeignKey(c => c.ContactId); // FK_GolfScore_Contacts
            HasRequired(a => a.GolfTeeInformation).WithMany(b => b.GolfScores).HasForeignKey(c => c.TeeId); // FK_GolfScore_GolfTeeInformation
        }
    }

    // GolfStatDef
    internal class GolfStatDefConfiguration : EntityTypeConfiguration<GolfStatDef>
    {
        public GolfStatDefConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".GolfStatDef");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("Id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.Name).HasColumnName("Name").IsRequired().IsUnicode(false).HasMaxLength(50);
            Property(x => x.ShortName).HasColumnName("ShortName").IsRequired().IsUnicode(false).HasMaxLength(5);
            Property(x => x.DataType).HasColumnName("DataType").IsRequired();
            Property(x => x.IsCalculated).HasColumnName("IsCalculated").IsRequired();
            Property(x => x.IsPerHoleValue).HasColumnName("IsPerHoleValue").IsRequired();
            Property(x => x.FormulaCode).HasColumnName("FormulaCode").IsRequired().IsUnicode(false).HasMaxLength(255);
            Property(x => x.ValidationCode).HasColumnName("ValidationCode").IsRequired().IsUnicode(false).HasMaxLength(255);
            Property(x => x.ListValues).HasColumnName("ListValues").IsRequired().IsUnicode(false).HasMaxLength(255);
        }
    }

    // GolfTeeInformation
    internal class GolfTeeInformationConfiguration : EntityTypeConfiguration<GolfTeeInformation>
    {
        public GolfTeeInformationConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".GolfTeeInformation");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("Id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.CourseId).HasColumnName("CourseId").IsRequired();
            Property(x => x.TeeColor).HasColumnName("TeeColor").IsRequired().IsUnicode(false).HasMaxLength(20);
            Property(x => x.TeeName).HasColumnName("TeeName").IsRequired().IsUnicode(false).HasMaxLength(20);
            Property(x => x.MensRating).HasColumnName("MensRating").IsRequired();
            Property(x => x.MensSlope).HasColumnName("MensSlope").IsRequired();
            Property(x => x.WomansRating).HasColumnName("WomansRating").IsRequired();
            Property(x => x.WomansSlope).HasColumnName("WomansSlope").IsRequired();
            Property(x => x.MensRatingFront9).HasColumnName("MensRatingFront9").IsRequired();
            Property(x => x.MensSlopeFront9).HasColumnName("MensSlopeFront9").IsRequired();
            Property(x => x.WomansRatingFront9).HasColumnName("WomansRatingFront9").IsRequired();
            Property(x => x.WomansSlopeFront9).HasColumnName("WomansSlopeFront9").IsRequired();
            Property(x => x.MensRatingBack9).HasColumnName("MensRatingBack9").IsRequired();
            Property(x => x.MensSlopeBack9).HasColumnName("MensSlopeBack9").IsRequired();
            Property(x => x.WomansRatingBack9).HasColumnName("WomansRatingBack9").IsRequired();
            Property(x => x.WomansSlopeBack9).HasColumnName("WomansSlopeBack9").IsRequired();
            Property(x => x.DistanceHole1).HasColumnName("DistanceHole1").IsRequired();
            Property(x => x.DistanceHole2).HasColumnName("DistanceHole2").IsRequired();
            Property(x => x.DistanceHole3).HasColumnName("DistanceHole3").IsRequired();
            Property(x => x.DistanceHole4).HasColumnName("DistanceHole4").IsRequired();
            Property(x => x.DistanceHole5).HasColumnName("DistanceHole5").IsRequired();
            Property(x => x.DistanceHole6).HasColumnName("DistanceHole6").IsRequired();
            Property(x => x.DistanceHole7).HasColumnName("DistanceHole7").IsRequired();
            Property(x => x.DistanceHole8).HasColumnName("DistanceHole8").IsRequired();
            Property(x => x.DistanceHole9).HasColumnName("DistanceHole9").IsRequired();
            Property(x => x.DistanceHole10).HasColumnName("DistanceHole10").IsRequired();
            Property(x => x.DistanceHole11).HasColumnName("DistanceHole11").IsRequired();
            Property(x => x.DistanceHole12).HasColumnName("DistanceHole12").IsRequired();
            Property(x => x.DistanceHole13).HasColumnName("DistanceHole13").IsRequired();
            Property(x => x.DistanceHole14).HasColumnName("DistanceHole14").IsRequired();
            Property(x => x.DistanceHole15).HasColumnName("DistanceHole15").IsRequired();
            Property(x => x.DistanceHole16).HasColumnName("DistanceHole16").IsRequired();
            Property(x => x.DistanceHole17).HasColumnName("DistanceHole17").IsRequired();
            Property(x => x.DistanceHole18).HasColumnName("DistanceHole18").IsRequired();
            Property(x => x.Priority).HasColumnName("Priority").IsRequired();

            // Foreign keys
            HasRequired(a => a.GolfCourse).WithMany(b => b.GolfTeeInformations).HasForeignKey(c => c.CourseId); // FK_GolfTeeInformation_GolfCourse
        }
    }
#endif

    // hof
    internal class HofConfiguration : EntityTypeConfiguration<HOFMember>
    {
        public HofConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".hof");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.AccountId).HasColumnName("AccountId").IsRequired();
            Property(x => x.YearInducted).HasColumnName("YearInducted").IsRequired();
            Property(x => x.ContactId).HasColumnName("ContactId").IsRequired();
            Property(x => x.Bio).HasColumnName("Bio").IsRequired().IsUnicode(false);

            // Foreign keys
            HasRequired(a => a.Account).WithMany(b => b.Hofs).HasForeignKey(c => c.AccountId); // FK_hof_Accounts
            HasRequired(a => a.Contact).WithMany(b => b.Hofs).HasForeignKey(c => c.ContactId); // FK_hof_Contacts
        }
    }

    // HOFNomination
    internal class HofNominationConfiguration : EntityTypeConfiguration<HOFNomination>
    {
        public HofNominationConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".HOFNomination");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.AccountId).HasColumnName("AccountId").IsRequired();
            Property(x => x.Nominator).HasColumnName("Nominator").IsRequired().IsUnicode(false).HasMaxLength(50);
            Property(x => x.PhoneNumber).HasColumnName("PhoneNumber").IsRequired().IsUnicode(false).HasMaxLength(14);
            Property(x => x.EMail).HasColumnName("EMail").IsRequired().IsUnicode(false).HasMaxLength(75);
            Property(x => x.Nominee).HasColumnName("Nominee").IsRequired().IsUnicode(false).HasMaxLength(50);
            Property(x => x.Reason).HasColumnName("Reason").IsRequired().IsUnicode(false);

            // Foreign keys
            HasRequired(a => a.Account).WithMany(b => b.HofNominations).HasForeignKey(c => c.AccountId); // FK_HOFNomination_Accounts
        }
    }

    // HOFNominationSetup
    internal class HofNominationSetupConfiguration : EntityTypeConfiguration<HOFNominationSetup>
    {
        public HofNominationSetupConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".HOFNominationSetup");
            HasKey(x => x.AccountId);

            Property(x => x.AccountId).HasColumnName("AccountId").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.None);
            Property(x => x.EnableNomination).HasColumnName("EnableNomination").IsRequired();
            Property(x => x.CriteriaText).HasColumnName("CriteriaText").IsRequired().IsUnicode(false);

            // Foreign keys
            HasRequired(a => a.Account).WithOptional(b => b.HofNominationSetup); // FK_HOFNominationSetup_Accounts
        }
    }

    // League
    internal class LeagueConfiguration : EntityTypeConfiguration<LeagueDefinition>
    {
        public LeagueConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".League");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.AccountId).HasColumnName("AccountId").IsRequired();
            Property(x => x.Name).HasColumnName("Name").IsRequired().IsUnicode(false).HasMaxLength(25);

            // Foreign keys
            HasRequired(a => a.Account).WithMany(b => b.Leagues).HasForeignKey(c => c.AccountId); // FK_League_Accounts
        }
    }

    // LeagueEvents
    internal class LeagueEventConfiguration : EntityTypeConfiguration<LeagueEvent>
    {
        public LeagueEventConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".LeagueEvents");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.EventDate).HasColumnName("EventDate").IsRequired();
            Property(x => x.Description).HasColumnName("Description").IsRequired().IsUnicode(false).HasMaxLength(25);
            Property(x => x.LeagueSeasonId).HasColumnName("LeagueSeasonId").IsRequired();

            // Foreign keys
            HasRequired(a => a.LeagueSeason).WithMany(b => b.LeagueEvents).HasForeignKey(c => c.LeagueSeasonId); // FK_LeagueEvents_LeagueSeason
        }
    }

    // LeagueFAQ
    internal class LeagueFaqConfiguration : EntityTypeConfiguration<LeagueFAQItem>
    {
        public LeagueFaqConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".LeagueFAQ");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.AccountId).HasColumnName("AccountId").IsRequired();
            Property(x => x.Question).HasColumnName("Question").IsRequired().IsUnicode(false);
            Property(x => x.Answer).HasColumnName("Answer").IsRequired().IsUnicode(false).HasMaxLength(2147483647);

            // Foreign keys
            HasRequired(a => a.Account).WithMany(b => b.LeagueFaqs).HasForeignKey(c => c.AccountId); // FK_LeagueFAQ_Accounts
        }
    }

    // LeagueNews
    internal class LeagueNewConfiguration : EntityTypeConfiguration<LeagueNewsItem>
    {
        public LeagueNewConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".LeagueNews");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.AccountId).HasColumnName("AccountId").IsRequired();
            Property(x => x.Date).HasColumnName("Date").IsRequired();
            Property(x => x.Title).HasColumnName("Title").IsRequired().IsUnicode(false).HasMaxLength(100);
            Property(x => x.Text).HasColumnName("Text").IsRequired().IsUnicode(false);
            Property(x => x.SpecialAnnounce).HasColumnName("SpecialAnnounce").IsRequired();

            // Foreign keys
            HasRequired(a => a.Account).WithMany(b => b.LeagueNews).HasForeignKey(c => c.AccountId); // FK_LeagueNews_Accounts
        }
    }

    // LeagueSchedule
    internal class LeagueScheduleConfiguration : EntityTypeConfiguration<Game>
    {
        public LeagueScheduleConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".LeagueSchedule");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.GameDate).HasColumnName("GameDate").IsRequired();
            Property(x => x.HTeamId).HasColumnName("HTeamId").IsRequired();
            Property(x => x.VTeamId).HasColumnName("VTeamId").IsRequired();
            Property(x => x.HScore).HasColumnName("HScore").IsRequired();
            Property(x => x.VScore).HasColumnName("VScore").IsRequired();
            Property(x => x.Comment).HasColumnName("Comment").IsRequired().IsUnicode(false).HasMaxLength(255);
            Property(x => x.FieldId).HasColumnName("FieldId").IsRequired();
            Property(x => x.LeagueId).HasColumnName("LeagueId").IsRequired();
            Property(x => x.GameStatus).HasColumnName("GameStatus").IsRequired();
            Property(x => x.GameType).HasColumnName("GameType").IsRequired();
            Property(x => x.Umpire1).HasColumnName("Umpire1").IsRequired();
            Property(x => x.Umpire2).HasColumnName("Umpire2").IsRequired();
            Property(x => x.Umpire3).HasColumnName("Umpire3").IsRequired();
            Property(x => x.Umpire4).HasColumnName("Umpire4").IsRequired();

            // Foreign keys
            HasRequired(a => a.AvailableField).WithMany(b => b.LeagueSchedules).HasForeignKey(c => c.FieldId); // FK_LeagueSchedule_AvailableFields
            HasRequired(a => a.LeagueSeason).WithMany(b => b.LeagueSchedules).HasForeignKey(c => c.LeagueId); // FK_LeagueSchedule_LeagueSeason
        }
    }

    // LeagueSeason
    internal class LeagueSeasonConfiguration : EntityTypeConfiguration<LeagueSeason>
    {
        public LeagueSeasonConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".LeagueSeason");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.LeagueId).HasColumnName("LeagueId").IsRequired();
            Property(x => x.SeasonId).HasColumnName("SeasonId").IsRequired();

            // Foreign keys
            HasRequired(a => a.League).WithMany(b => b.LeagueSeasons).HasForeignKey(c => c.LeagueId); // FK_LeagueSeason_League
            HasRequired(a => a.Season).WithMany(b => b.LeagueSeasons).HasForeignKey(c => c.SeasonId); // FK_LeagueSeason_Season
        }
    }

    // LeagueUmpires
    internal class LeagueUmpireConfiguration : EntityTypeConfiguration<Umpire>
    {
        public LeagueUmpireConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".LeagueUmpires");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.AccountId).HasColumnName("AccountId").IsRequired();
            Property(x => x.ContactId).HasColumnName("ContactId").IsRequired();

            // Foreign keys
            HasRequired(a => a.Account).WithMany(b => b.LeagueUmpires).HasForeignKey(c => c.AccountId); // FK_LeagueUmpires_Accounts
            HasRequired(a => a.Contact).WithMany(b => b.LeagueUmpires).HasForeignKey(c => c.ContactId); // FK_LeagueUmpires_Contacts
        }
    }

    // MemberBusiness
    internal class MemberBusinessConfiguration : EntityTypeConfiguration<MemberBusiness>
    {
        public MemberBusinessConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".MemberBusiness");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.ContactId).HasColumnName("ContactId").IsRequired();
            Property(x => x.Name).HasColumnName("Name").IsRequired().IsUnicode(false).HasMaxLength(50);
            Property(x => x.StreetAddress).HasColumnName("StreetAddress").IsRequired().IsUnicode(false).HasMaxLength(100);
            Property(x => x.CityStateZip).HasColumnName("CityStateZip").IsRequired().IsUnicode(false).HasMaxLength(100);
            Property(x => x.Description).HasColumnName("Description").IsRequired().IsUnicode(false);
            Property(x => x.EMail).HasColumnName("EMail").IsRequired().IsUnicode(false).HasMaxLength(100);
            Property(x => x.Phone).HasColumnName("Phone").IsRequired().IsUnicode(false).HasMaxLength(14);
            Property(x => x.Fax).HasColumnName("Fax").IsRequired().IsUnicode(false).HasMaxLength(14);
            Property(x => x.WebSite).HasColumnName("WebSite").IsRequired().IsUnicode(false).HasMaxLength(100);

            // Foreign keys
            HasRequired(a => a.Contact).WithMany(b => b.MemberBusinesses).HasForeignKey(c => c.ContactId); // FK_MemberBusiness_Contacts
        }
    }

    // MessageCategory
    internal class MessageCategoryConfiguration : EntityTypeConfiguration<MessageCategory>
    {
        public MessageCategoryConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".MessageCategory");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.AccountId).HasColumnName("AccountId").IsRequired();
            Property(x => x.CategoryOrder).HasColumnName("CategoryOrder").IsRequired();
            Property(x => x.CategoryName).HasColumnName("CategoryName").IsRequired().IsUnicode(false).HasMaxLength(50);
            Property(x => x.CategoryDescription).HasColumnName("CategoryDescription").IsRequired().IsUnicode(false).HasMaxLength(255);
            Property(x => x.AllowAnonymousPost).HasColumnName("AllowAnonymousPost").IsRequired();
            Property(x => x.AllowAnonymousTopic).HasColumnName("AllowAnonymousTopic").IsRequired();
            Property(x => x.IsTeam).HasColumnName("isTeam").IsRequired();
            Property(x => x.IsModerated).HasColumnName("isModerated").IsRequired();
        }
    }

    // MessagePost
    internal class MessagePostConfiguration : EntityTypeConfiguration<MessagePost>
    {
        public MessagePostConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".MessagePost");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.TopicId).HasColumnName("TopicId").IsRequired();
            Property(x => x.PostOrder).HasColumnName("PostOrder").IsRequired();
            Property(x => x.ContactCreatorId).HasColumnName("ContactCreatorId").IsRequired();
            Property(x => x.PostDate).HasColumnName("PostDate").IsRequired();
            Property(x => x.PostText).HasColumnName("PostText").IsRequired().IsUnicode(false);
            Property(x => x.EditDate).HasColumnName("EditDate").IsRequired();
            Property(x => x.PostSubject).HasColumnName("PostSubject").IsRequired().IsUnicode(false).HasMaxLength(255);
            Property(x => x.CategoryId).HasColumnName("CategoryId").IsRequired();

            // Foreign keys
            HasRequired(a => a.MessageTopic).WithMany(b => b.MessagePosts).HasForeignKey(c => c.TopicId); // FK_MessagePost_MessageTopic
            HasRequired(a => a.MessageCategory).WithMany(b => b.MessagePosts).HasForeignKey(c => c.CategoryId); // FK_MessagePost_MessageCategory
            HasRequired(a => a.Contact).WithMany(b => b.MessagePosts).HasForeignKey(c => c.ContactCreatorId); // FK_MessagePost_Contacts
        }
    }

    // MessageTopic
    internal class MessageTopicConfiguration : EntityTypeConfiguration<MessageTopic>
    {
        public MessageTopicConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".MessageTopic");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.CategoryId).HasColumnName("CategoryId").IsRequired();
            Property(x => x.ContactCreatorId).HasColumnName("ContactCreatorId").IsRequired();
            Property(x => x.TopicCreateDate).HasColumnName("TopicCreateDate").IsRequired();
            Property(x => x.Topic).HasColumnName("Topic").IsRequired().IsUnicode(false).HasMaxLength(255);
            Property(x => x.StickyTopic).HasColumnName("StickyTopic").IsRequired();
            Property(x => x.NumberOfViews).HasColumnName("NumberOfViews").IsRequired();

            // Foreign keys
            HasRequired(a => a.MessageCategory).WithMany(b => b.MessageTopics).HasForeignKey(c => c.CategoryId); // FK_MessageTopic_MessageCategory
            HasRequired(a => a.Contact).WithMany(b => b.MessageTopics).HasForeignKey(c => c.ContactCreatorId); // FK_MessageTopic_Contacts
        }
    }

    // PhotoGallery
    internal class PhotoGalleryConfiguration : EntityTypeConfiguration<PhotoGalleryItem>
    {
        public PhotoGalleryConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".PhotoGallery");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.AccountId).HasColumnName("AccountId").IsRequired();
            Property(x => x.Title).HasColumnName("Title").IsRequired().IsUnicode(false).HasMaxLength(50);
            Property(x => x.Caption).HasColumnName("Caption").IsRequired().IsUnicode(false).HasMaxLength(255);
            Property(x => x.AlbumId).HasColumnName("AlbumId").IsRequired();

            // Foreign keys
            HasRequired(a => a.Account).WithMany(b => b.PhotoGalleries).HasForeignKey(c => c.AccountId); // FK_PhotoGallery_Accounts
            HasRequired(a => a.PhotoGalleryAlbum).WithMany(b => b.Photos).HasForeignKey(c => c.AlbumId); // FK_PhotoGallery_PhotoGalleryAlbum
        }
    }

    // PhotoGalleryAlbum
    internal class PhotoGalleryAlbumConfiguration : EntityTypeConfiguration<PhotoGalleryAlbum>
    {
        public PhotoGalleryAlbumConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".PhotoGalleryAlbum");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.AccountId).HasColumnName("AccountId").IsRequired();
            Property(x => x.Title).HasColumnName("Title").IsRequired().IsUnicode(false).HasMaxLength(25);
            Property(x => x.ParentAlbumId).HasColumnName("ParentAlbumId").IsRequired();
            Property(x => x.TeamId).HasColumnName("TeamId").IsRequired();
        }
    }

    // pitchstatsum
    internal class PitchstatsumConfiguration : EntityTypeConfiguration<GamePitchStats>
    {
        public PitchstatsumConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".pitchstatsum");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.PlayerId).HasColumnName("PlayerId").IsRequired();
            Property(x => x.GameId).HasColumnName("GameId").IsRequired();
            Property(x => x.TeamId).HasColumnName("TeamId").IsRequired();
            Property(x => x.Ip).HasColumnName("IP").IsRequired();
            Property(x => x.Ip2).HasColumnName("IP2").IsRequired();
            Property(x => x.Bf).HasColumnName("BF").IsRequired();
            Property(x => x.W).HasColumnName("W").IsRequired();
            Property(x => x.L).HasColumnName("L").IsRequired();
            Property(x => x.S).HasColumnName("S").IsRequired();
            Property(x => x.H).HasColumnName("H").IsRequired();
            Property(x => x.R).HasColumnName("R").IsRequired();
            Property(x => x.Er).HasColumnName("ER").IsRequired();
            Property(x => x.C2B).HasColumnName("2B").IsRequired();
            Property(x => x.C3B).HasColumnName("3B").IsRequired();
            Property(x => x.Hr).HasColumnName("HR").IsRequired();
            Property(x => x.So).HasColumnName("SO").IsRequired();
            Property(x => x.Bb).HasColumnName("BB").IsRequired();
            Property(x => x.Wp).HasColumnName("WP").IsRequired();
            Property(x => x.Hbp).HasColumnName("HBP").IsRequired();
            Property(x => x.Bk).HasColumnName("BK").IsRequired();
            Property(x => x.Sc).HasColumnName("SC").IsRequired();
            Property(x => x.Tb).HasColumnName("TB").IsOptional().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Computed);
            Property(x => x.Ab).HasColumnName("AB").IsOptional().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Computed);
            Property(x => x.WhipNumerator).HasColumnName("WHIPNumerator").IsOptional().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Computed);
            Property(x => x.IpNumerator).HasColumnName("IPNumerator").IsOptional().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Computed);

            // Foreign keys
            HasRequired(a => a.RosterSeason).WithMany(b => b.Pitchstatsums).HasForeignKey(c => c.PlayerId); // FK_pitchstatsum_RosterSeason
            HasRequired(a => a.LeagueSchedule).WithMany(b => b.Pitchstatsums).HasForeignKey(c => c.GameId); // FK_pitchstatsum_LeagueSchedule
            HasRequired(a => a.TeamsSeason).WithMany(b => b.Pitchstatsums).HasForeignKey(c => c.TeamId); // FK_pitchstatsum_TeamsSeason
        }
    }

    // PlayerProfile
    internal class PlayerProfileConfiguration : EntityTypeConfiguration<ProfileQuestionAnswer>
    {
        public PlayerProfileConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".PlayerProfile");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.PlayerId).HasColumnName("PlayerId").IsRequired();
            Property(x => x.QuestionId).HasColumnName("QuestionId").IsRequired();
            Property(x => x.Answer).HasColumnName("Answer").IsRequired().IsUnicode(false);

            // Foreign keys
            HasRequired(a => a.Contact).WithMany(b => b.PlayerProfiles).HasForeignKey(c => c.PlayerId); // FK_PlayerProfile_Contacts
            HasRequired(a => a.ProfileQuestion).WithMany(b => b.PlayerProfiles).HasForeignKey(c => c.QuestionId); // FK_PlayerProfile_ProfileQuestion
        }
    }

    // PlayerRecap
    internal class PlayerRecapConfiguration : EntityTypeConfiguration<PlayerRecap>
    {
        public PlayerRecapConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".PlayerRecap");
            HasKey(x => new { x.PlayerId, x.TeamId, x.GameId });

            Property(x => x.PlayerId).HasColumnName("PlayerId").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.None);
            Property(x => x.TeamId).HasColumnName("TeamId").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.None);
            Property(x => x.GameId).HasColumnName("GameId").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.None);

            // Foreign keys
            HasRequired(a => a.RosterSeason).WithMany(b => b.PlayerRecaps).HasForeignKey(c => c.PlayerId); // FK_PlayerRecap_RosterSeason
            HasRequired(a => a.TeamsSeason).WithMany(b => b.PlayerRecaps).HasForeignKey(c => c.TeamId); // FK_PlayerRecap_TeamsSeason
            HasRequired(a => a.LeagueSchedule).WithMany(b => b.PlayerRecaps).HasForeignKey(c => c.GameId); // FK_PlayerRecap_LeagueSchedule
        }
    }

    // PlayerSeasonAffiliationDues
    internal class PlayerSeasonAffiliationDueConfiguration : EntityTypeConfiguration<PlayerSeasonAffiliationDue>
    {
        public PlayerSeasonAffiliationDueConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".PlayerSeasonAffiliationDues");
            HasKey(x => new { x.PlayerId, x.SeasonId });

            Property(x => x.PlayerId).HasColumnName("PlayerId").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.None);
            Property(x => x.SeasonId).HasColumnName("SeasonId").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.None);
            Property(x => x.AffiliationDuesPaid).HasColumnName("AffiliationDuesPaid").IsRequired().IsUnicode(false).HasMaxLength(50);

            // Foreign keys
            HasRequired(a => a.Roster).WithMany(b => b.PlayerSeasonAffiliationDues).HasForeignKey(c => c.PlayerId); // FK_PlayerSeasonAffiliationDues_Roster
            HasRequired(a => a.Season).WithMany(b => b.PlayerSeasonAffiliationDues).HasForeignKey(c => c.SeasonId); // FK_PlayerSeasonAffiliationDues_Season
        }
    }

    // PlayersWantedClassified
    internal class PlayersWantedClassifiedConfiguration : EntityTypeConfiguration<PlayersWantedClassified>
    {
        public PlayersWantedClassifiedConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".PlayersWantedClassified");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("Id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.AccountId).HasColumnName("AccountId").IsRequired();
            Property(x => x.DateCreated).HasColumnName("DateCreated").IsRequired();
            Property(x => x.CreatedByContactId).HasColumnName("CreatedByContactId").IsRequired();
            Property(x => x.TeamEventName).HasColumnName("TeamEventName").IsRequired().IsUnicode(false).HasMaxLength(50);
            Property(x => x.Description).HasColumnName("Description").IsRequired().IsUnicode(false);
            Property(x => x.PositionsNeeded).HasColumnName("PositionsNeeded").IsRequired().IsUnicode(false).HasMaxLength(50);

            // Foreign keys
            HasRequired(a => a.Account).WithMany(b => b.PlayersWantedClassifieds).HasForeignKey(c => c.AccountId); // FK_PlayersWantedClassified_Accounts
            HasRequired(a => a.Contact).WithMany(b => b.PlayersWantedClassifieds).HasForeignKey(c => c.CreatedByContactId); // FK_PlayersWantedClassified_Contacts
        }
    }

    // PlayoffBracket
    internal class PlayoffBracketConfiguration : EntityTypeConfiguration<PlayoffBracket>
    {
        public PlayoffBracketConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".PlayoffBracket");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.PlayoffId).HasColumnName("PlayoffId").IsRequired();
            Property(x => x.Team1Id).HasColumnName("Team1Id").IsRequired();
            Property(x => x.Team1IdType).HasColumnName("Team1IdType").IsRequired().IsUnicode(false).HasMaxLength(5);
            Property(x => x.Team2Id).HasColumnName("Team2Id").IsRequired();
            Property(x => x.Team2IdType).HasColumnName("Team2IdType").IsRequired().IsUnicode(false).HasMaxLength(5);
            Property(x => x.GameNo).HasColumnName("GameNo").IsRequired();
            Property(x => x.RoundNo).HasColumnName("RoundNo").IsRequired();
            Property(x => x.NumGamesInSeries).HasColumnName("NumGamesInSeries").IsRequired();

            // Foreign keys
            HasRequired(a => a.PlayoffSetup).WithMany(b => b.PlayoffBrackets).HasForeignKey(c => c.PlayoffId); // FK_PlayoffBracket_PlayoffSetup
        }
    }

    // PlayoffGame
    internal class PlayoffGameConfiguration : EntityTypeConfiguration<PlayoffGame>
    {
        public PlayoffGameConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".PlayoffGame");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.BracketId).HasColumnName("BracketId").IsRequired();
            Property(x => x.FieldId).HasColumnName("FieldId").IsRequired();
            Property(x => x.GameDate).HasColumnName("gameDate").IsRequired();
            Property(x => x.GameTime).HasColumnName("gameTime").IsRequired();
            Property(x => x.GameId).HasColumnName("GameId").IsRequired();
            Property(x => x.PlayoffId).HasColumnName("PlayoffId").IsRequired();
            Property(x => x.SeriesGameNo).HasColumnName("SeriesGameNo").IsRequired();
            Property(x => x.Team1HomeTeam).HasColumnName("Team1HomeTeam").IsRequired();

            // Foreign keys
            HasRequired(a => a.PlayoffBracket).WithMany(b => b.PlayoffGames).HasForeignKey(c => c.BracketId); // FK_PlayoffGame_PlayoffGame
        }
    }

    // PlayoffSeeds
    internal class PlayoffSeedConfiguration : EntityTypeConfiguration<PlayoffSeed>
    {
        public PlayoffSeedConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".PlayoffSeeds");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.PlayoffId).HasColumnName("PlayoffId").IsRequired();
            Property(x => x.TeamId).HasColumnName("TeamId").IsRequired();
            Property(x => x.SeedNo).HasColumnName("SeedNo").IsRequired();

            // Foreign keys
            HasRequired(a => a.PlayoffSetup).WithMany(b => b.PlayoffSeeds).HasForeignKey(c => c.PlayoffId); // FK_PlayoffSeeds_PlayoffSetup
        }
    }

    // PlayoffSetup
    internal class PlayoffSetupConfiguration : EntityTypeConfiguration<PlayoffSetup>
    {
        public PlayoffSetupConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".PlayoffSetup");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.LeagueSeasonId).HasColumnName("LeagueSeasonId").IsRequired();
            Property(x => x.NumTeams).HasColumnName("NumTeams").IsRequired();
            Property(x => x.Description).HasColumnName("Description").IsRequired().IsUnicode(false).HasMaxLength(50);
            Property(x => x.Active).HasColumnName("Active").IsRequired();

            // Foreign keys
            HasRequired(a => a.LeagueSeason).WithMany(b => b.PlayoffSetups).HasForeignKey(c => c.LeagueSeasonId); // FK_PlayoffSetup_LeagueSeason
        }
    }

    // ProfileCategory
    internal class ProfileCategoryConfiguration : EntityTypeConfiguration<ProfileCategoryItem>
    {
        public ProfileCategoryConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".ProfileCategory");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.AccountId).HasColumnName("AccountId").IsRequired();
            Property(x => x.CategoryName).HasColumnName("CategoryName").IsRequired().IsUnicode(false).HasMaxLength(40);
            Property(x => x.Priority).HasColumnName("Priority").IsRequired();

            // Foreign keys
            HasRequired(a => a.Account).WithMany(b => b.ProfileCategories).HasForeignKey(c => c.AccountId); // FK_ProfileCategory_Accounts
        }
    }

    // ProfileQuestion
    internal class ProfileQuestionConfiguration : EntityTypeConfiguration<ProfileQuestionItem>
    {
        public ProfileQuestionConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".ProfileQuestion");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.CategoryId).HasColumnName("CategoryId").IsRequired();
            Property(x => x.Question).HasColumnName("Question").IsRequired().IsUnicode(false).HasMaxLength(255);
            Property(x => x.QuestionNum).HasColumnName("QuestionNum").IsRequired();

            // Foreign keys
            HasRequired(a => a.ProfileCategory).WithMany(b => b.ProfileQuestions).HasForeignKey(c => c.CategoryId); // FK_ProfileQuestion_ProfileCategory
        }
    }

    // Roster
    internal class RosterConfiguration : EntityTypeConfiguration<Player>
    {
        public RosterConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".Roster");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.AccountId).HasColumnName("AccountId").IsRequired();
            Property(x => x.ContactId).HasColumnName("ContactId").IsRequired();
            Property(x => x.SubmittedDriversLicense).HasColumnName("SubmittedDriversLicense").IsRequired();

            // Foreign keys
            HasRequired(a => a.Account).WithMany(b => b.Rosters).HasForeignKey(c => c.AccountId); // FK_Roster_Accounts
            HasRequired(a => a.Contact).WithMany(b => b.Rosters).HasForeignKey(c => c.ContactId); // FK_Roster_Contacts
        }
    }

    // RosterSeason
    internal class RosterSeasonConfiguration : EntityTypeConfiguration<PlayerSeason>
    {
        public RosterSeasonConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".RosterSeason");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("Id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.PlayerId).HasColumnName("PlayerId").IsRequired();
            Property(x => x.TeamSeasonId).HasColumnName("TeamSeasonId").IsRequired();
            Property(x => x.PlayerNumber).HasColumnName("PlayerNumber").IsRequired();
            Property(x => x.Inactive).HasColumnName("Inactive").IsRequired();
            Property(x => x.SubmittedWaiver).HasColumnName("SubmittedWaiver").IsRequired();
            Property(x => x.DateAdded).HasColumnName("DateAdded").IsOptional();

            // Foreign keys
            HasRequired(a => a.Roster).WithMany(b => b.RosterSeasons).HasForeignKey(c => c.PlayerId); // FK_RosterSeason_Roster
            HasRequired(a => a.TeamSeason).WithMany(b => b.Roster).HasForeignKey(c => c.TeamSeasonId); // FK_RosterSeason_TeamSeason
        }
    }

    // Season
    internal class SeasonConfiguration : EntityTypeConfiguration<Season>
    {
        public SeasonConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".Season");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.AccountId).HasColumnName("AccountId").IsRequired();
            Property(x => x.Name).HasColumnName("Name").IsRequired().IsUnicode(false).HasMaxLength(25);

            // Foreign keys
            HasRequired(a => a.Account).WithMany(b => b.Seasons).HasForeignKey(c => c.AccountId); // FK_Season_Accounts
        }
    }

    // Sponsors
    internal class SponsorConfiguration : EntityTypeConfiguration<Sponsor>
    {
        public SponsorConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".Sponsors");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.AccountId).HasColumnName("AccountId").IsRequired();
            Property(x => x.Name).HasColumnName("Name").IsRequired().IsUnicode(false).HasMaxLength(50);
            Property(x => x.StreetAddress).HasColumnName("StreetAddress").IsRequired().IsUnicode(false).HasMaxLength(100);
            Property(x => x.CityStateZip).HasColumnName("CityStateZip").IsRequired().IsUnicode(false).HasMaxLength(100);
            Property(x => x.Description).HasColumnName("Description").IsRequired().IsUnicode(false);
            Property(x => x.EMail).HasColumnName("EMail").IsRequired().IsUnicode(false).HasMaxLength(100);
            Property(x => x.Phone).HasColumnName("Phone").IsRequired().IsUnicode(false).HasMaxLength(14);
            Property(x => x.Fax).HasColumnName("Fax").IsRequired().IsUnicode(false).HasMaxLength(14);
            Property(x => x.WebSite).HasColumnName("WebSite").IsRequired().IsUnicode(false).HasMaxLength(100);
            Property(x => x.TeamId).HasColumnName("TeamId").IsRequired();

            // Foreign keys
            HasRequired(a => a.Account).WithMany(b => b.Sponsors).HasForeignKey(c => c.AccountId); // FK_Sponsors_Accounts
            HasRequired(a => a.Team).WithMany(b => b.Sponsors).HasForeignKey(c => c.TeamId); // FK_Sponsors_Teams
        }
    }

    // Teams
    internal class TeamConfiguration : EntityTypeConfiguration<Team>
    {
        public TeamConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".Teams");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.AccountId).HasColumnName("AccountId").IsRequired();
            Property(x => x.WebAddress).HasColumnName("WebAddress").IsRequired().IsUnicode(false).HasMaxLength(100);
            Property(x => x.YouTubeUserId).HasColumnName("YouTubeUserId").IsOptional().IsUnicode(false).HasMaxLength(100);
            Property(x => x.DefaultVideo).HasColumnName("DefaultVideo").IsRequired().IsUnicode(false).HasMaxLength(50);
            Property(x => x.AutoPlayVideo).HasColumnName("AutoPlayVideo").IsRequired();

            // Foreign keys
            HasRequired(a => a.Account).WithMany(b => b.Teams).HasForeignKey(c => c.AccountId); // FK_Teams_Accounts
        }
    }

    // TeamHandouts
    internal class TeamHandoutConfiguration : EntityTypeConfiguration<TeamHandout>
    {
        public TeamHandoutConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".TeamHandouts");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("Id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.Description).HasColumnName("Description").IsRequired().IsUnicode(false).HasMaxLength(255);
            Property(x => x.FileName).HasColumnName("FileName").IsRequired().IsUnicode(false).HasMaxLength(255);
            Property(x => x.TeamId).HasColumnName("TeamId").IsRequired();

            // Foreign keys
            HasRequired(a => a.Team).WithMany(b => b.TeamHandouts).HasForeignKey(c => c.TeamId); // FK_TeamHandouts_Teams
        }
    }

    // TeamNews
    internal class TeamNewConfiguration : EntityTypeConfiguration<TeamNewsItem>
    {
        public TeamNewConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".TeamNews");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("Id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.TeamId).HasColumnName("TeamId").IsRequired();
            Property(x => x.Date).HasColumnName("Date").IsRequired();
            Property(x => x.Text).HasColumnName("Text").IsRequired().IsUnicode(false);
            Property(x => x.Title).HasColumnName("Title").IsRequired().IsUnicode(false).HasMaxLength(100);
            Property(x => x.SpecialAnnounce).HasColumnName("SpecialAnnounce").IsRequired();

            // Foreign keys
            HasRequired(a => a.Team).WithMany(b => b.TeamNews).HasForeignKey(c => c.TeamId); // FK_TeamNews_Teams
        }
    }

    // TeamSeasonManager
    internal class TeamSeasonManagerConfiguration : EntityTypeConfiguration<TeamManager>
    {
        public TeamSeasonManagerConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".TeamSeasonManager");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.TeamSeasonId).HasColumnName("TeamSeasonId").IsRequired();
            Property(x => x.ContactId).HasColumnName("ContactId").IsRequired();

            // Foreign keys
            HasRequired(a => a.TeamsSeason).WithMany(b => b.TeamSeasonManagers).HasForeignKey(c => c.TeamSeasonId); // FK_TeamSeasonManager_TeamsSeason
            HasRequired(a => a.Contact).WithMany(b => b.TeamSeasonManagers).HasForeignKey(c => c.ContactId); // FK_TeamSeasonManager_Contacts
        }
    }

    // TeamsSeason
    internal class TeamsSeasonConfiguration : EntityTypeConfiguration<TeamSeason>
    {
        public TeamsSeasonConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".TeamsSeason");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.LeagueSeasonId).HasColumnName("LeagueSeasonId").IsRequired();
            Property(x => x.TeamId).HasColumnName("TeamId").IsRequired();
            Property(x => x.Name).HasColumnName("Name").IsRequired().IsUnicode(false).HasMaxLength(25);
            Property(x => x.DivisionSeasonId).HasColumnName("DivisionSeasonId").IsOptional();

            // Foreign keys
            HasRequired(a => a.LeagueSeason).WithMany(b => b.TeamsSeasons).HasForeignKey(c => c.LeagueSeasonId); // FK_TeamsSeason_LeagueSeason
            HasRequired(a => a.Team).WithMany(b => b.TeamsSeasons).HasForeignKey(c => c.TeamId); // FK_TeamsSeason_Teams
            HasOptional(a => a.DivisionSeason).WithMany(b => b.TeamsSeasons).HasForeignKey(c => c.DivisionSeasonId); // FK_TeamsSeason_DivisionSeason
        }
    }

    // TeamsWantedClassified
    internal class TeamsWantedClassifiedConfiguration : EntityTypeConfiguration<TeamsWantedClassified>
    {
        public TeamsWantedClassifiedConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".TeamsWantedClassified");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("Id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.AccountId).HasColumnName("AccountId").IsRequired();
            Property(x => x.DateCreated).HasColumnName("DateCreated").IsRequired();
            Property(x => x.Name).HasColumnName("Name").IsRequired().IsUnicode(false).HasMaxLength(50);
            Property(x => x.EMail).HasColumnName("EMail").IsRequired().IsUnicode(false).HasMaxLength(50);
            Property(x => x.Phone).HasColumnName("Phone").IsRequired().IsUnicode(false).HasMaxLength(15);
            Property(x => x.Experience).HasColumnName("Experience").IsRequired().IsUnicode(false);
            Property(x => x.PositionsPlayed).HasColumnName("PositionsPlayed").IsRequired().IsUnicode(false).HasMaxLength(50);
            Property(x => x.AccessCode).HasColumnName("AccessCode").IsRequired();
            Property(x => x.BirthDate).HasColumnName("BirthDate").IsRequired();

            // Foreign keys
            HasRequired(a => a.Account).WithMany(b => b.TeamsWantedClassifieds).HasForeignKey(c => c.AccountId); // FK_TeamsWantedClassified_Accounts
        }
    }

    // VoteAnswers
    internal class VoteAnswerConfiguration : EntityTypeConfiguration<VoteAnswer>
    {
        public VoteAnswerConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".VoteAnswers");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.QuestionId).HasColumnName("QuestionId").IsRequired();
            Property(x => x.OptionId).HasColumnName("OptionId").IsRequired();
            Property(x => x.ContactId).HasColumnName("ContactId").IsRequired();

            // Foreign keys
            HasRequired(a => a.VoteQuestion).WithMany(b => b.VoteAnswers).HasForeignKey(c => c.QuestionId); // FK_VoteAnswers_VoteQuestion
            HasRequired(a => a.VoteOption).WithMany(b => b.VoteAnswers).HasForeignKey(c => c.OptionId); // FK_VoteAnswers_VoteOptions
            HasRequired(a => a.Contact).WithMany(b => b.VoteAnswers).HasForeignKey(c => c.ContactId); // FK_VoteAnswers_Contacts
        }
    }

    // VoteOptions
    internal class VoteOptionConfiguration : EntityTypeConfiguration<VoteOption>
    {
        public VoteOptionConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".VoteOptions");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.QuestionId).HasColumnName("QuestionId").IsRequired();
            Property(x => x.OptionText).HasColumnName("OptionText").IsRequired().IsUnicode(false).HasMaxLength(255);
            Property(x => x.Priority).HasColumnName("Priority").IsRequired();

            // Foreign keys
            HasRequired(a => a.VoteQuestion).WithMany(b => b.VoteOptions).HasForeignKey(c => c.QuestionId); // FK_VoteOptions_VoteQuestion
        }
    }

    // VoteQuestion
    internal class VoteQuestionConfiguration : EntityTypeConfiguration<VoteQuestion>
    {
        public VoteQuestionConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".VoteQuestion");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.AccountId).HasColumnName("AccountId").IsRequired();
            Property(x => x.Question).HasColumnName("Question").IsRequired().IsUnicode(false).HasMaxLength(255);
            Property(x => x.Active).HasColumnName("Active").IsRequired();

            // Foreign keys
            HasRequired(a => a.Account).WithMany(b => b.VoteQuestions).HasForeignKey(c => c.AccountId); // FK_VoteQuestion_Accounts
        }
    }

    // WorkoutAnnouncement
    internal class WorkoutAnnouncementConfiguration : EntityTypeConfiguration<WorkoutAnnouncement>
    {
        public WorkoutAnnouncementConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".WorkoutAnnouncement");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.AccountId).HasColumnName("AccountId").IsRequired();
            Property(x => x.WorkoutDesc).HasColumnName("WorkoutDesc").IsRequired().IsUnicode(false);
            Property(x => x.WorkoutDate).HasColumnName("WorkoutDate").IsRequired();
            Property(x => x.FieldId).HasColumnName("FieldId").IsRequired();
            Property(x => x.Comments).HasColumnName("Comments").IsRequired().IsUnicode(false).HasMaxLength(2147483647);

            // Foreign keys
            HasRequired(a => a.Account).WithMany(b => b.WorkoutAnnouncements).HasForeignKey(c => c.AccountId); // FK_WorkoutAnnouncement_Accounts
            HasRequired(a => a.AvailableField).WithMany(b => b.WorkoutAnnouncements).HasForeignKey(c => c.FieldId); // FK_WorkoutAnnouncement_AvailableFields
        }
    }

    // WorkoutRegistration
    internal class WorkoutRegistrationConfiguration : EntityTypeConfiguration<WorkoutRegistrant>
    {
        public WorkoutRegistrationConfiguration(string schema = "dbo")
        {
            ToTable(schema + ".WorkoutRegistration");
            HasKey(x => x.Id);

            Property(x => x.Id).HasColumnName("id").IsRequired().HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(x => x.Name).HasColumnName("Name").IsRequired().IsUnicode(false).HasMaxLength(100);
            Property(x => x.EMail).HasColumnName("EMail").IsRequired().IsUnicode(false).HasMaxLength(100);
            Property(x => x.Age).HasColumnName("Age").IsRequired();
            Property(x => x.Phone1).HasColumnName("Phone1").IsRequired().IsUnicode(false).HasMaxLength(14);
            Property(x => x.Phone2).HasColumnName("Phone2").IsRequired().IsUnicode(false).HasMaxLength(14);
            Property(x => x.Phone3).HasColumnName("Phone3").IsRequired().IsUnicode(false).HasMaxLength(14);
            Property(x => x.Phone4).HasColumnName("Phone4").IsRequired().IsUnicode(false).HasMaxLength(14);
            Property(x => x.Positions).HasColumnName("Positions").IsRequired().IsUnicode(false).HasMaxLength(50);
            Property(x => x.IsManager).HasColumnName("IsManager").IsRequired();
            Property(x => x.WorkoutId).HasColumnName("WorkoutId").IsRequired();
            Property(x => x.DateRegistered).HasColumnName("DateRegistered").IsRequired();
            Property(x => x.WhereHeard).HasColumnName("WhereHeard").IsRequired().IsUnicode(false).HasMaxLength(25);

            // Foreign keys
            HasRequired(a => a.WorkoutAnnouncement).WithMany(b => b.WorkoutRegistrations).HasForeignKey(c => c.WorkoutId); // FK_WorkoutRegistration_WorkoutAnnouncement
        }
    }

#endregion
}
