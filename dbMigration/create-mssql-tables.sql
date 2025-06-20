USE [SQL2012_152800_ezrecsports]
GO
/****** Object:  User [SQL2005_152800_db1_user]    Script Date: 6/17/2025 3:05:56 PM ******/
CREATE USER [SQL2005_152800_db1_user] WITHOUT LOGIN WITH DEFAULT_SCHEMA=[dbo]
GO
/****** Object:  Table [dbo].[AccountHandouts]    Script Date: 6/17/2025 3:05:56 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[AccountHandouts](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[Description] [varchar](255) NOT NULL,
	[FileName] [varchar](255) NOT NULL,
	[AccountId] [bigint] NOT NULL,
 CONSTRAINT [PK_AccountHandouts] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Accounts]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Accounts](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[Name] [varchar](75) NOT NULL,
	[FirstYear] [int] NOT NULL,
	[AccountTypeId] [bigint] NOT NULL,
	[AffiliationId] [bigint] NOT NULL,
	[TimeZoneId] [varchar](50) NOT NULL,
	[TwitterAccountName] [varchar](50) NOT NULL,
	[TwitterOauthToken] [varchar](50) NOT NULL,
	[TwitterOauthSecretKey] [varchar](50) NOT NULL,
	[YouTubeUserId] [varchar](50) NULL,
	[FacebookFanPage] [varchar](50) NULL,
	[TwitterWidgetScript] [varchar](512) NULL,
	[DefaultVideo] [varchar](50) NOT NULL,
	[AutoPlayVideo] [bit] NOT NULL,
	[OwnerUserId] [nvarchar](128) NULL,
 CONSTRAINT [PK_Accounts] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[AccountSettings]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[AccountSettings](
	[AccountId] [bigint] NOT NULL,
	[SettingKey] [varchar](25) NOT NULL,
	[SettingValue] [varchar](25) NOT NULL,
 CONSTRAINT [PK_AccountSettings] PRIMARY KEY CLUSTERED 
(
	[AccountId] ASC,
	[SettingKey] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[AccountsURL]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[AccountsURL](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[AccountId] [bigint] NOT NULL,
	[URL] [varchar](200) NOT NULL,
 CONSTRAINT [PK_AccountsURL] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[AccountTypes]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[AccountTypes](
	[Id] [bigint] NOT NULL,
	[Name] [varchar](75) NOT NULL,
	[FilePath] [varchar](255) NOT NULL,
	[FacebookAppId] [varchar](50) NOT NULL,
	[FacebookSecretKey] [varchar](50) NOT NULL,
	[TwitterAppId] [varchar](50) NOT NULL,
	[TwitterSecret] [varchar](50) NOT NULL,
 CONSTRAINT [PK_AccountTypes] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[AccountWelcome]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[AccountWelcome](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[AccountId] [bigint] NOT NULL,
	[OrderNo] [smallint] NOT NULL,
	[CaptionMenu] [varchar](50) NOT NULL,
	[WelcomeText] [varchar](max) NOT NULL,
	[TeamId] [bigint] NULL,
 CONSTRAINT [PK_AccountWelcome] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Affiliations]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Affiliations](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[Name] [varchar](75) NOT NULL,
	[URL] [varchar](200) NOT NULL,
 CONSTRAINT [PK_Affiliations] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [IX_Affiliations] UNIQUE NONCLUSTERED 
(
	[Name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[AspNetRoles]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[AspNetRoles](
	[Id] [nvarchar](128) NOT NULL,
	[Name] [nvarchar](max) NOT NULL,
 CONSTRAINT [PK_dbo.AspNetRoles] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[AspNetUserClaims]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[AspNetUserClaims](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[ClaimType] [nvarchar](max) NULL,
	[ClaimValue] [nvarchar](max) NULL,
	[UserId] [nvarchar](128) NOT NULL,
 CONSTRAINT [PK_dbo.AspNetUserClaims] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[AspNetUserLogins]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[AspNetUserLogins](
	[UserId] [nvarchar](128) NOT NULL,
	[LoginProvider] [nvarchar](128) NOT NULL,
	[ProviderKey] [nvarchar](128) NOT NULL,
 CONSTRAINT [PK_dbo.AspNetUserLogins] PRIMARY KEY CLUSTERED 
(
	[UserId] ASC,
	[LoginProvider] ASC,
	[ProviderKey] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[AspNetUserRoles]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[AspNetUserRoles](
	[UserId] [nvarchar](128) NOT NULL,
	[RoleId] [nvarchar](128) NOT NULL,
 CONSTRAINT [PK_dbo.AspNetUserRoles] PRIMARY KEY CLUSTERED 
(
	[UserId] ASC,
	[RoleId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[AspNetUsers]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[AspNetUsers](
	[Id] [nvarchar](128) NOT NULL,
	[Email] [nvarchar](256) NULL,
	[EmailConfirmed] [bit] NOT NULL,
	[PasswordHash] [nvarchar](max) NULL,
	[SecurityStamp] [nvarchar](max) NULL,
	[PhoneNumber] [nvarchar](max) NULL,
	[PhoneNumberConfirmed] [bit] NOT NULL,
	[TwoFactorEnabled] [bit] NOT NULL,
	[LockoutEndDateUtc] [datetime] NULL,
	[LockoutEnabled] [bit] NOT NULL,
	[AccessFailedCount] [int] NOT NULL,
	[UserName] [nvarchar](256) NULL,
 CONSTRAINT [PK_dbo.AspNetUsers] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[AvailableFields]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[AvailableFields](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[AccountId] [bigint] NOT NULL,
	[Name] [varchar](25) NOT NULL,
	[ShortName] [varchar](5) NOT NULL,
	[Comment] [varchar](255) NOT NULL,
	[Address] [varchar](255) NOT NULL,
	[City] [varchar](25) NOT NULL,
	[State] [varchar](25) NOT NULL,
	[ZipCode] [varchar](10) NOT NULL,
	[Directions] [varchar](255) NOT NULL,
	[RainoutNumber] [varchar](15) NOT NULL,
	[Latitude] [varchar](25) NOT NULL,
	[Longitude] [varchar](25) NOT NULL,
 CONSTRAINT [PK_AvailableFields] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[batstatsum]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[batstatsum](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[PlayerId] [bigint] NOT NULL,
	[GameId] [bigint] NOT NULL,
	[TeamId] [bigint] NOT NULL,
	[AB] [int] NOT NULL,
	[H] [int] NOT NULL,
	[R] [int] NOT NULL,
	[2B] [int] NOT NULL,
	[3B] [int] NOT NULL,
	[HR] [int] NOT NULL,
	[RBI] [int] NOT NULL,
	[SO] [int] NOT NULL,
	[BB] [int] NOT NULL,
	[RE] [int] NOT NULL,
	[HBP] [int] NOT NULL,
	[INTR] [int] NOT NULL,
	[SF] [int] NOT NULL,
	[SH] [int] NOT NULL,
	[SB] [int] NOT NULL,
	[CS] [int] NOT NULL,
	[LOB] [int] NOT NULL,
	[TB]  AS ((([2B]*(2)+[3B]*(3))+[HR]*(4))+((([H]-[2B])-[3B])-[HR])) PERSISTED,
	[PA]  AS ((((([AB]+[BB])+[HBP])+[SH])+[SF])+[INTR]) PERSISTED,
	[OBADenominator]  AS (([AB]+[BB])+[HBP]) PERSISTED,
	[OBANumerator]  AS (([H]+[BB])+[HBP]) PERSISTED,
 CONSTRAINT [PK_batstatsum] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [IX_batstatsum] UNIQUE NONCLUSTERED 
(
	[PlayerId] ASC,
	[GameId] ASC,
	[TeamId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ContactRoles]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ContactRoles](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[ContactId] [bigint] NOT NULL,
	[RoleId] [nvarchar](128) NOT NULL,
	[RoleData] [bigint] NOT NULL,
	[AccountId] [bigint] NOT NULL,
 CONSTRAINT [PK_ContactRoles] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Contacts]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Contacts](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[UserId] [nvarchar](128) NULL,
	[LastName] [varchar](25) NOT NULL,
	[FirstName] [varchar](25) NOT NULL,
	[MiddleName] [varchar](25) NULL,
	[Phone1] [varchar](14) NULL,
	[Phone2] [varchar](14) NULL,
	[Phone3] [varchar](14) NULL,
	[CreatorAccountId] [bigint] NOT NULL,
	[StreetAddress] [varchar](75) NULL,
	[City] [varchar](25) NULL,
	[State] [varchar](25) NULL,
	[Zip] [varchar](15) NULL,
	[DateOfBirth] [datetime] NOT NULL,
	[IsFemale] [bit] NULL,
	[Email] [varchar](50) NULL,
 CONSTRAINT [PK_Contacts] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [IX_Contacts] UNIQUE NONCLUSTERED 
(
	[LastName] ASC,
	[FirstName] ASC,
	[MiddleName] ASC,
	[CreatorAccountId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CurrentSeason]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CurrentSeason](
	[SeasonId] [bigint] NOT NULL,
	[AccountId] [bigint] NOT NULL,
 CONSTRAINT [PK_CurrentSeason] PRIMARY KEY CLUSTERED 
(
	[AccountId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DisplayLeagueLeaders]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DisplayLeagueLeaders](
	[FieldName] [varchar](50) NOT NULL,
	[AccountId] [bigint] NOT NULL,
	[TeamId] [bigint] NOT NULL,
	[IsBatLeader] [bit] NOT NULL,
 CONSTRAINT [PK_DisplayLeagueLeaders] PRIMARY KEY CLUSTERED 
(
	[FieldName] ASC,
	[IsBatLeader] ASC,
	[AccountId] ASC,
	[TeamId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DivisionDefs]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DivisionDefs](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[AccountId] [bigint] NOT NULL,
	[Name] [varchar](25) NOT NULL,
 CONSTRAINT [PK_DivisionDefs] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DivisionSeason]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DivisionSeason](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[DivisionId] [bigint] NOT NULL,
	[LeagueSeasonId] [bigint] NOT NULL,
	[Priority] [int] NOT NULL,
 CONSTRAINT [PK_DivisionSeason] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[FieldContacts]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[FieldContacts](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[FieldId] [bigint] NOT NULL,
	[ContactId] [bigint] NOT NULL,
 CONSTRAINT [PK_FieldContacts] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[fieldstatsum]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[fieldstatsum](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[PlayerId] [bigint] NOT NULL,
	[GameId] [bigint] NOT NULL,
	[TeamId] [bigint] NOT NULL,
	[POS] [int] NOT NULL,
	[IP] [int] NOT NULL,
	[IP2] [int] NOT NULL,
	[PO] [int] NOT NULL,
	[A] [int] NOT NULL,
	[E] [int] NOT NULL,
	[PB] [int] NOT NULL,
	[SB] [int] NOT NULL,
	[CS] [int] NOT NULL,
 CONSTRAINT [PK_fieldstatsum] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [IX_fieldstatsum] UNIQUE NONCLUSTERED 
(
	[PlayerId] ASC,
	[GameId] ASC,
	[TeamId] ASC,
	[POS] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[GameEjections]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[GameEjections](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[leagueSeasonId] [bigint] NOT NULL,
	[gameId] [bigint] NOT NULL,
	[playerSeasonId] [bigint] NOT NULL,
	[umpireId] [bigint] NOT NULL,
	[comments] [ntext] NOT NULL,
 CONSTRAINT [PK_GameEjections] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[GameRecap]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[GameRecap](
	[GameId] [bigint] NOT NULL,
	[TeamId] [bigint] NOT NULL,
	[Recap] [varchar](max) NOT NULL,
 CONSTRAINT [PK_GameRecap] PRIMARY KEY CLUSTERED 
(
	[GameId] ASC,
	[TeamId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[GolfCourse]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[GolfCourse](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[Name] [varchar](100) NOT NULL,
	[Designer] [varchar](50) NULL,
	[YearBuilt] [int] NULL,
	[NumberOfHoles] [int] NOT NULL,
	[Address] [varchar](50) NULL,
	[City] [varchar](50) NULL,
	[State] [varchar](50) NULL,
	[Zip] [varchar](20) NULL,
	[Country] [varchar](30) NULL,
	[MensPar1] [int] NOT NULL,
	[MensPar2] [int] NOT NULL,
	[MensPar3] [int] NOT NULL,
	[MensPar4] [int] NOT NULL,
	[MensPar5] [int] NOT NULL,
	[MensPar6] [int] NOT NULL,
	[MensPar7] [int] NOT NULL,
	[MensPar8] [int] NOT NULL,
	[MensPar9] [int] NOT NULL,
	[MensPar10] [int] NOT NULL,
	[MensPar11] [int] NOT NULL,
	[MensPar12] [int] NOT NULL,
	[MensPar13] [int] NOT NULL,
	[MensPar14] [int] NOT NULL,
	[MensPar15] [int] NOT NULL,
	[MensPar16] [int] NOT NULL,
	[MensPar17] [int] NOT NULL,
	[MensPar18] [int] NOT NULL,
	[WomansPar1] [int] NOT NULL,
	[WomansPar2] [int] NOT NULL,
	[WomansPar3] [int] NOT NULL,
	[WomansPar4] [int] NOT NULL,
	[WomansPar5] [int] NOT NULL,
	[WomansPar6] [int] NOT NULL,
	[WomansPar7] [int] NOT NULL,
	[WomansPar8] [int] NOT NULL,
	[WomansPar9] [int] NOT NULL,
	[WomansPar10] [int] NOT NULL,
	[WomansPar11] [int] NOT NULL,
	[WomansPar12] [int] NOT NULL,
	[WomansPar13] [int] NOT NULL,
	[WomansPar14] [int] NOT NULL,
	[WomansPar15] [int] NOT NULL,
	[WomansPar16] [int] NOT NULL,
	[WomansPar17] [int] NOT NULL,
	[WomansPar18] [int] NOT NULL,
	[MensHandicap1] [int] NOT NULL,
	[MensHandicap2] [int] NOT NULL,
	[MensHandicap3] [int] NOT NULL,
	[MensHandicap4] [int] NOT NULL,
	[MensHandicap5] [int] NOT NULL,
	[MensHandicap6] [int] NOT NULL,
	[MensHandicap7] [int] NOT NULL,
	[MensHandicap8] [int] NOT NULL,
	[MensHandicap9] [int] NOT NULL,
	[MensHandicap10] [int] NOT NULL,
	[MensHandicap11] [int] NOT NULL,
	[MensHandicap12] [int] NOT NULL,
	[MensHandicap13] [int] NOT NULL,
	[MensHandicap14] [int] NOT NULL,
	[MensHandicap15] [int] NOT NULL,
	[MensHandicap16] [int] NOT NULL,
	[MensHandicap17] [int] NOT NULL,
	[MensHandicap18] [int] NOT NULL,
	[WomansHandicap1] [int] NOT NULL,
	[WomansHandicap2] [int] NOT NULL,
	[WomansHandicap3] [int] NOT NULL,
	[WomansHandicap4] [int] NOT NULL,
	[WomansHandicap5] [int] NOT NULL,
	[WomansHandicap6] [int] NOT NULL,
	[WomansHandicap7] [int] NOT NULL,
	[WomansHandicap8] [int] NOT NULL,
	[WomansHandicap9] [int] NOT NULL,
	[WomansHandicap10] [int] NOT NULL,
	[WomansHandicap11] [int] NOT NULL,
	[WomansHandicap12] [int] NOT NULL,
	[WomansHandicap13] [int] NOT NULL,
	[WomansHandicap14] [int] NOT NULL,
	[WomansHandicap15] [int] NOT NULL,
	[WomansHandicap16] [int] NOT NULL,
	[WomansHandicap17] [int] NOT NULL,
	[WomansHandicap18] [int] NOT NULL,
 CONSTRAINT [PK_GolfCourse] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[GolfCourseForContact]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[GolfCourseForContact](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[ContactId] [bigint] NOT NULL,
	[CourseId] [bigint] NOT NULL,
 CONSTRAINT [PK_GolfCourseForContact] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[GolferStatsConfiguration]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[GolferStatsConfiguration](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[ContactId] [bigint] NOT NULL,
	[StatId] [bigint] NOT NULL,
 CONSTRAINT [PK_GolferStatsConfiguration] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[GolferStatsValue]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[GolferStatsValue](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[ScoreId] [bigint] NOT NULL,
	[ContactId] [bigint] NOT NULL,
	[HoleNo] [int] NOT NULL,
	[Value] [varchar](100) NOT NULL,
 CONSTRAINT [PK_GolferStatsValue] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[GolfLeagueCourses]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[GolfLeagueCourses](
	[AccountId] [bigint] NOT NULL,
	[CourseId] [bigint] NOT NULL,
	[DefaultMensTee] [bigint] NULL,
	[DefaultWomansTee] [bigint] NULL,
 CONSTRAINT [PK_GolfLeagueCourses] PRIMARY KEY CLUSTERED 
(
	[AccountId] ASC,
	[CourseId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[GolfLeagueSetup]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[GolfLeagueSetup](
	[Id] [bigint] NOT NULL,
	[AccountId] [bigint] NOT NULL,
	[PresidentId] [bigint] NOT NULL,
	[VicePresidentId] [bigint] NOT NULL,
	[SecretaryId] [bigint] NOT NULL,
	[TreasurerId] [bigint] NOT NULL,
	[LeagueDay] [int] NOT NULL,
	[FirstTeeTime] [smalldatetime] NOT NULL,
	[TimeBetweenTeeTimes] [int] NOT NULL,
	[HolesPerMatch] [int] NOT NULL,
	[TeeOffFormat] [int] NOT NULL,
	[IndNetPerHolePts] [int] NOT NULL,
	[IndNetPerNinePts] [int] NOT NULL,
	[IndNetPerMatchPts] [int] NOT NULL,
	[IndNetTotalHolesPts] [int] NOT NULL,
	[IndNetAgainstFieldPts] [int] NOT NULL,
	[IndNetAgainstFieldDescPts] [int] NOT NULL,
	[IndActPerHolePts] [int] NOT NULL,
	[IndActPerNinePts] [int] NOT NULL,
	[IndActPerMatchPts] [int] NOT NULL,
	[IndActTotalHolesPts] [int] NOT NULL,
	[IndActAgainstFieldPts] [int] NOT NULL,
	[IndActAgainstFieldDescPts] [int] NOT NULL,
	[TeamNetPerHolePts] [int] NOT NULL,
	[TeamNetPerNinePts] [int] NOT NULL,
	[TeamNetPerMatchPts] [int] NOT NULL,
	[TeamNetTotalHolesPts] [int] NOT NULL,
	[TeamNetAgainstFieldPts] [int] NOT NULL,
	[TeamActPerHolePts] [int] NOT NULL,
	[TeamActPerNinePts] [int] NOT NULL,
	[TeamActPerMatchPts] [int] NOT NULL,
	[TeamActTotalHolesPts] [int] NOT NULL,
	[TeamActAgainstFieldPts] [int] NOT NULL,
	[TeamAgainstFieldDescPts] [int] NOT NULL,
	[TeamNetBestBallPerHolePts] [int] NOT NULL,
	[TeamActBestBallPerHolePts] [int] NOT NULL,
	[UseTeamScoring] [bit] NOT NULL,
	[UseIndividualScoring] [bit] NOT NULL,
 CONSTRAINT [PK_GolfLeagueSetup] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[GolfMatch]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[GolfMatch](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[Team1] [bigint] NOT NULL,
	[Team2] [bigint] NOT NULL,
	[LeagueId] [bigint] NOT NULL,
	[MatchDate] [smalldatetime] NOT NULL,
	[MatchTime] [smalldatetime] NOT NULL,
	[CourseId] [bigint] NULL,
	[MatchStatus] [int] NOT NULL,
	[MatchType] [int] NOT NULL,
	[Comment] [varchar](255) NOT NULL,
 CONSTRAINT [PK_GolfMatch] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[GolfMatchScores]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[GolfMatchScores](
	[MatchId] [bigint] NOT NULL,
	[TeamId] [bigint] NOT NULL,
	[PlayerId] [bigint] NOT NULL,
	[ScoreId] [bigint] NOT NULL,
 CONSTRAINT [PK_GolfMatchScores] PRIMARY KEY CLUSTERED 
(
	[MatchId] ASC,
	[TeamId] ASC,
	[PlayerId] ASC,
	[ScoreId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[GolfRoster]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[GolfRoster](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[ContactId] [bigint] NOT NULL,
	[TeamSeasonId] [bigint] NOT NULL,
	[IsActive] [bit] NOT NULL,
	[InitialDifferential] [float] NULL,
	[IsSub] [bit] NOT NULL,
	[SubSeasonId] [bigint] NULL,
 CONSTRAINT [PK_GolfRoster] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[GolfScore]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[GolfScore](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[CourseId] [bigint] NOT NULL,
	[ContactId] [bigint] NOT NULL,
	[TeeId] [bigint] NOT NULL,
	[DatePlayed] [datetime] NOT NULL,
	[HolesPlayed] [int] NOT NULL,
	[TotalScore] [int] NOT NULL,
	[TotalsOnly] [bit] NOT NULL,
	[HoleScore1] [int] NOT NULL,
	[HoleScore2] [int] NOT NULL,
	[HoleScore3] [int] NOT NULL,
	[HoleScore4] [int] NOT NULL,
	[HoleScore5] [int] NOT NULL,
	[HoleScore6] [int] NOT NULL,
	[HoleScore7] [int] NOT NULL,
	[HoleScore8] [int] NOT NULL,
	[HoleScore9] [int] NOT NULL,
	[HoleScore10] [int] NOT NULL,
	[HoleScore11] [int] NOT NULL,
	[HoleScore12] [int] NOT NULL,
	[HoleScore13] [int] NOT NULL,
	[HoleScore14] [int] NOT NULL,
	[HoleScore15] [int] NOT NULL,
	[HoleScore16] [int] NOT NULL,
	[HoleScore17] [int] NOT NULL,
	[HoleScore18] [int] NOT NULL,
	[StartIndex] [float] NULL,
	[StartIndex9] [float] NULL,
 CONSTRAINT [PK_GolfScore] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[GolfStatDef]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[GolfStatDef](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[Name] [varchar](50) NOT NULL,
	[ShortName] [varchar](5) NOT NULL,
	[DataType] [int] NOT NULL,
	[IsCalculated] [bit] NOT NULL,
	[IsPerHoleValue] [bit] NOT NULL,
	[FormulaCode] [varchar](255) NOT NULL,
	[ValidationCode] [varchar](255) NOT NULL,
	[ListValues] [varchar](255) NOT NULL,
 CONSTRAINT [PK_GolfStatDef] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[GolfTeeInformation]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[GolfTeeInformation](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[CourseId] [bigint] NOT NULL,
	[TeeColor] [varchar](20) NOT NULL,
	[TeeName] [varchar](20) NOT NULL,
	[MensRating] [float] NOT NULL,
	[MensSlope] [float] NOT NULL,
	[WomansRating] [float] NOT NULL,
	[WomansSlope] [float] NOT NULL,
	[MensRatingFront9] [float] NOT NULL,
	[MensSlopeFront9] [float] NOT NULL,
	[WomansRatingFront9] [float] NOT NULL,
	[WomansSlopeFront9] [float] NOT NULL,
	[MensRatingBack9] [float] NOT NULL,
	[MensSlopeBack9] [float] NOT NULL,
	[WomansRatingBack9] [float] NOT NULL,
	[WomansSlopeBack9] [float] NOT NULL,
	[DistanceHole1] [int] NOT NULL,
	[DistanceHole2] [int] NOT NULL,
	[DistanceHole3] [int] NOT NULL,
	[DistanceHole4] [int] NOT NULL,
	[DistanceHole5] [int] NOT NULL,
	[DistanceHole6] [int] NOT NULL,
	[DistanceHole7] [int] NOT NULL,
	[DistanceHole8] [int] NOT NULL,
	[DistanceHole9] [int] NOT NULL,
	[DistanceHole10] [int] NOT NULL,
	[DistanceHole11] [int] NOT NULL,
	[DistanceHole12] [int] NOT NULL,
	[DistanceHole13] [int] NOT NULL,
	[DistanceHole14] [int] NOT NULL,
	[DistanceHole15] [int] NOT NULL,
	[DistanceHole16] [int] NOT NULL,
	[DistanceHole17] [int] NOT NULL,
	[DistanceHole18] [int] NOT NULL,
	[Priority] [int] NOT NULL,
 CONSTRAINT [PK_GolfTeeInformation] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[hof]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[hof](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[AccountId] [bigint] NOT NULL,
	[YearInducted] [int] NOT NULL,
	[ContactId] [bigint] NOT NULL,
	[Bio] [varchar](max) NOT NULL,
 CONSTRAINT [PK_hof] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[HOFNomination]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[HOFNomination](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[AccountId] [bigint] NOT NULL,
	[Nominator] [varchar](50) NOT NULL,
	[PhoneNumber] [varchar](14) NOT NULL,
	[EMail] [varchar](75) NOT NULL,
	[Nominee] [varchar](50) NOT NULL,
	[Reason] [varchar](max) NOT NULL,
 CONSTRAINT [PK_HOFNomination] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[HOFNominationSetup]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[HOFNominationSetup](
	[AccountId] [bigint] NOT NULL,
	[EnableNomination] [bit] NOT NULL,
	[CriteriaText] [varchar](max) NOT NULL,
 CONSTRAINT [PK_HOFNominationSetup] PRIMARY KEY CLUSTERED 
(
	[AccountId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[League]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[League](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[AccountId] [bigint] NOT NULL,
	[Name] [varchar](25) NOT NULL,
 CONSTRAINT [PK_League2] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[LeagueEvents]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[LeagueEvents](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[EventDate] [smalldatetime] NOT NULL,
	[Description] [varchar](25) NOT NULL,
	[LeagueSeasonId] [bigint] NOT NULL,
 CONSTRAINT [PK_LeagueEvents] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[LeagueFAQ]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[LeagueFAQ](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[AccountId] [bigint] NOT NULL,
	[Question] [varchar](max) NOT NULL,
	[Answer] [text] NOT NULL,
 CONSTRAINT [PK_LeagueFAQ] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[LeagueNews]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[LeagueNews](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[AccountId] [bigint] NOT NULL,
	[Date] [smalldatetime] NOT NULL,
	[Title] [varchar](100) NOT NULL,
	[Text] [varchar](max) NOT NULL,
	[SpecialAnnounce] [bit] NOT NULL,
 CONSTRAINT [PK_LeagueNews] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[LeagueSchedule]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[LeagueSchedule](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[GameDate] [smalldatetime] NOT NULL,
	[HTeamId] [bigint] NOT NULL,
	[VTeamId] [bigint] NOT NULL,
	[HScore] [int] NOT NULL,
	[VScore] [int] NOT NULL,
	[Comment] [varchar](255) NOT NULL,
	[FieldId] [bigint] NOT NULL,
	[LeagueId] [bigint] NOT NULL,
	[GameStatus] [int] NOT NULL,
	[GameType] [bigint] NOT NULL,
	[Umpire1] [bigint] NOT NULL,
	[Umpire2] [bigint] NOT NULL,
	[Umpire3] [bigint] NOT NULL,
	[Umpire4] [bigint] NOT NULL,
 CONSTRAINT [PK_LeagueSchedule] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[LeagueSeason]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[LeagueSeason](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[LeagueId] [bigint] NOT NULL,
	[SeasonId] [bigint] NOT NULL,
 CONSTRAINT [PK_LeagueSeason2] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[LeagueUmpires]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[LeagueUmpires](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[AccountId] [bigint] NOT NULL,
	[ContactId] [bigint] NOT NULL,
 CONSTRAINT [PK_LeagueUmpires] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[MemberBusiness]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[MemberBusiness](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[ContactId] [bigint] NOT NULL,
	[Name] [varchar](50) NOT NULL,
	[StreetAddress] [varchar](100) NOT NULL,
	[CityStateZip] [varchar](100) NOT NULL,
	[Description] [varchar](max) NOT NULL,
	[EMail] [varchar](100) NOT NULL,
	[Phone] [varchar](14) NOT NULL,
	[Fax] [varchar](14) NOT NULL,
	[WebSite] [varchar](100) NOT NULL,
 CONSTRAINT [PK_MemberBusiness] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[MessageCategory]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[MessageCategory](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[AccountId] [bigint] NOT NULL,
	[CategoryOrder] [int] NOT NULL,
	[CategoryName] [varchar](50) NOT NULL,
	[CategoryDescription] [varchar](255) NOT NULL,
	[AllowAnonymousPost] [bit] NOT NULL,
	[AllowAnonymousTopic] [bit] NOT NULL,
	[isTeam] [bit] NOT NULL,
	[isModerated] [bit] NOT NULL,
 CONSTRAINT [PK_MessageCategory] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[MessagePost]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[MessagePost](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[TopicId] [bigint] NOT NULL,
	[PostOrder] [int] NOT NULL,
	[ContactCreatorId] [bigint] NOT NULL,
	[PostDate] [datetime] NOT NULL,
	[PostText] [varchar](max) NOT NULL,
	[EditDate] [datetime] NOT NULL,
	[PostSubject] [varchar](255) NOT NULL,
	[CategoryId] [bigint] NOT NULL,
 CONSTRAINT [PK_MessagePost] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[MessageTopic]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[MessageTopic](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[CategoryId] [bigint] NOT NULL,
	[ContactCreatorId] [bigint] NOT NULL,
	[TopicCreateDate] [datetime] NOT NULL,
	[Topic] [varchar](255) NOT NULL,
	[StickyTopic] [bit] NOT NULL,
	[NumberOfViews] [bigint] NOT NULL,
 CONSTRAINT [PK_MessageTopic] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PhotoGallery]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PhotoGallery](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[AccountId] [bigint] NOT NULL,
	[Title] [varchar](50) NOT NULL,
	[Caption] [varchar](255) NOT NULL,
	[AlbumId] [bigint] NOT NULL,
 CONSTRAINT [PK_PhotoGallery] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PhotoGalleryAlbum]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PhotoGalleryAlbum](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[AccountId] [bigint] NOT NULL,
	[Title] [varchar](25) NOT NULL,
	[ParentAlbumId] [bigint] NOT NULL,
	[TeamId] [bigint] NOT NULL,
 CONSTRAINT [PK_PhotoGalleryAlbum] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[pitchstatsum]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[pitchstatsum](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[PlayerId] [bigint] NOT NULL,
	[GameId] [bigint] NOT NULL,
	[TeamId] [bigint] NOT NULL,
	[IP] [int] NOT NULL,
	[IP2] [int] NOT NULL,
	[BF] [int] NOT NULL,
	[W] [int] NOT NULL,
	[L] [int] NOT NULL,
	[S] [int] NOT NULL,
	[H] [int] NOT NULL,
	[R] [int] NOT NULL,
	[ER] [int] NOT NULL,
	[2B] [int] NOT NULL,
	[3B] [int] NOT NULL,
	[HR] [int] NOT NULL,
	[SO] [int] NOT NULL,
	[BB] [int] NOT NULL,
	[WP] [int] NOT NULL,
	[HBP] [int] NOT NULL,
	[BK] [int] NOT NULL,
	[SC] [int] NOT NULL,
	[TB]  AS ((([2B]*(2)+[3B]*(3))+[HR]*(4))+((([H]-[2B])-[3B])-[HR])) PERSISTED,
	[AB]  AS ((([BF]-[BB])-[HBP])-[SC]) PERSISTED,
	[WHIPNumerator]  AS ([H]+[BB]) PERSISTED,
	[IPNumerator]  AS ([IP]*(3)+[IP2]) PERSISTED,
 CONSTRAINT [PK_pitchstatsum] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [IX_pitchstatsum] UNIQUE NONCLUSTERED 
(
	[PlayerId] ASC,
	[GameId] ASC,
	[TeamId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PlayerProfile]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PlayerProfile](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[PlayerId] [bigint] NOT NULL,
	[QuestionId] [bigint] NOT NULL,
	[Answer] [varchar](max) NOT NULL,
 CONSTRAINT [PK_PlayerProfile] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PlayerRecap]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PlayerRecap](
	[PlayerId] [bigint] NOT NULL,
	[TeamId] [bigint] NOT NULL,
	[GameId] [bigint] NOT NULL,
 CONSTRAINT [PK_PlayerRecap] PRIMARY KEY CLUSTERED 
(
	[PlayerId] ASC,
	[TeamId] ASC,
	[GameId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PlayerSeasonAffiliationDues]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PlayerSeasonAffiliationDues](
	[PlayerId] [bigint] NOT NULL,
	[SeasonId] [bigint] NOT NULL,
	[AffiliationDuesPaid] [varchar](50) NOT NULL,
 CONSTRAINT [PK_PlayerSeasonAffiliationDues] PRIMARY KEY CLUSTERED 
(
	[PlayerId] ASC,
	[SeasonId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PlayersWantedClassified]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PlayersWantedClassified](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[AccountId] [bigint] NOT NULL,
	[DateCreated] [date] NOT NULL,
	[CreatedByContactId] [bigint] NOT NULL,
	[TeamEventName] [varchar](50) NOT NULL,
	[Description] [varchar](max) NOT NULL,
	[PositionsNeeded] [varchar](50) NOT NULL,
 CONSTRAINT [PK_PlayersWantedClassified] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PlayoffBracket]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PlayoffBracket](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[PlayoffId] [bigint] NOT NULL,
	[Team1Id] [bigint] NOT NULL,
	[Team1IdType] [varchar](5) NOT NULL,
	[Team2Id] [bigint] NOT NULL,
	[Team2IdType] [varchar](5) NOT NULL,
	[GameNo] [int] NOT NULL,
	[RoundNo] [int] NOT NULL,
	[NumGamesInSeries] [int] NOT NULL,
 CONSTRAINT [PK_PlayoffBracket] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PlayoffGame]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PlayoffGame](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[BracketId] [bigint] NOT NULL,
	[FieldId] [bigint] NOT NULL,
	[gameDate] [smalldatetime] NOT NULL,
	[gameTime] [smalldatetime] NOT NULL,
	[GameId] [bigint] NOT NULL,
	[PlayoffId] [bigint] NOT NULL,
	[SeriesGameNo] [int] NOT NULL,
	[Team1HomeTeam] [bit] NOT NULL,
 CONSTRAINT [PK_PlayoffGame] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PlayoffSeeds]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PlayoffSeeds](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[PlayoffId] [bigint] NOT NULL,
	[TeamId] [bigint] NOT NULL,
	[SeedNo] [int] NOT NULL,
 CONSTRAINT [PK_PlayoffSeeds] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PlayoffSetup]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PlayoffSetup](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[LeagueSeasonId] [bigint] NOT NULL,
	[NumTeams] [int] NOT NULL,
	[Description] [varchar](50) NOT NULL,
	[Active] [bit] NOT NULL,
 CONSTRAINT [PK_PlayoffSetup] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ProfileCategory]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ProfileCategory](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[AccountId] [bigint] NOT NULL,
	[CategoryName] [varchar](40) NOT NULL,
	[Priority] [int] NOT NULL,
 CONSTRAINT [PK_ProfileCategory] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ProfileQuestion]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ProfileQuestion](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[CategoryId] [bigint] NOT NULL,
	[Question] [varchar](255) NOT NULL,
	[QuestionNum] [int] NOT NULL,
 CONSTRAINT [PK_ProfileQuestion] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Roster]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Roster](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[ContactId] [bigint] NOT NULL,
	[SubmittedDriversLicense] [bit] NOT NULL,
	[FirstYear] [int] NOT NULL,
 CONSTRAINT [PK_Roster] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[RosterSeason]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[RosterSeason](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[PlayerId] [bigint] NOT NULL,
	[TeamSeasonId] [bigint] NOT NULL,
	[PlayerNumber] [int] NOT NULL,
	[Inactive] [bit] NOT NULL,
	[SubmittedWaiver] [bit] NOT NULL,
	[DateAdded] [datetime] NULL,
 CONSTRAINT [PK_RosterSeason] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [IX_RosterSeason] UNIQUE NONCLUSTERED 
(
	[PlayerId] ASC,
	[TeamSeasonId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Season]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Season](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[AccountId] [bigint] NOT NULL,
	[Name] [varchar](25) NOT NULL,
 CONSTRAINT [PK_Season] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Sponsors]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Sponsors](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[AccountId] [bigint] NOT NULL,
	[Name] [varchar](50) NOT NULL,
	[StreetAddress] [varchar](100) NOT NULL,
	[CityStateZip] [varchar](100) NOT NULL,
	[Description] [varchar](max) NOT NULL,
	[EMail] [varchar](100) NOT NULL,
	[Phone] [varchar](14) NOT NULL,
	[Fax] [varchar](14) NOT NULL,
	[WebSite] [varchar](100) NOT NULL,
	[TeamId] [bigint] NOT NULL,
 CONSTRAINT [PK_Sponsors] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TeamHandouts]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TeamHandouts](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[Description] [varchar](255) NOT NULL,
	[FileName] [varchar](255) NOT NULL,
	[TeamId] [bigint] NOT NULL,
 CONSTRAINT [PK_TeamHandouts] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TeamNews]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TeamNews](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[TeamId] [bigint] NOT NULL,
	[Date] [smalldatetime] NOT NULL,
	[Text] [varchar](max) NOT NULL,
	[Title] [varchar](100) NOT NULL,
	[SpecialAnnounce] [bit] NOT NULL,
 CONSTRAINT [PK_TeamNews] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Teams]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Teams](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[AccountId] [bigint] NOT NULL,
	[WebAddress] [varchar](100) NOT NULL,
	[YouTubeUserId] [varchar](100) NULL,
	[DefaultVideo] [varchar](50) NOT NULL,
	[AutoPlayVideo] [bit] NOT NULL,
 CONSTRAINT [PK_Teams] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TeamSeasonManager]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TeamSeasonManager](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[TeamSeasonId] [bigint] NOT NULL,
	[ContactId] [bigint] NOT NULL,
 CONSTRAINT [PK_TeamSeasonManager] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TeamsSeason]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TeamsSeason](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[LeagueSeasonId] [bigint] NOT NULL,
	[TeamId] [bigint] NOT NULL,
	[Name] [varchar](25) NOT NULL,
	[DivisionSeasonId] [bigint] NOT NULL,
 CONSTRAINT [PK_TeamsSeason] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TeamsWantedClassified]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TeamsWantedClassified](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[AccountId] [bigint] NOT NULL,
	[DateCreated] [date] NOT NULL,
	[Name] [varchar](50) NOT NULL,
	[EMail] [varchar](50) NOT NULL,
	[Phone] [varchar](15) NOT NULL,
	[Experience] [varchar](max) NOT NULL,
	[PositionsPlayed] [varchar](50) NOT NULL,
	[AccessCode] [uniqueidentifier] NOT NULL,
	[BirthDate] [date] NOT NULL,
 CONSTRAINT [PK_TeamsWantedClassified] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[VoteAnswers]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[VoteAnswers](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[QuestionId] [bigint] NOT NULL,
	[OptionId] [bigint] NOT NULL,
	[ContactId] [bigint] NOT NULL,
 CONSTRAINT [PK_VoteAnswers] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[VoteOptions]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[VoteOptions](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[QuestionId] [bigint] NOT NULL,
	[OptionText] [varchar](255) NOT NULL,
	[Priority] [int] NOT NULL,
 CONSTRAINT [PK_VoteOptions] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[VoteQuestion]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[VoteQuestion](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[AccountId] [bigint] NOT NULL,
	[Question] [varchar](255) NOT NULL,
	[Active] [bit] NOT NULL,
 CONSTRAINT [PK_VoteQuestion] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[WorkoutAnnouncement]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[WorkoutAnnouncement](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[AccountId] [bigint] NOT NULL,
	[WorkoutDesc] [varchar](max) NOT NULL,
	[WorkoutDate] [smalldatetime] NOT NULL,
	[FieldId] [bigint] NOT NULL,
	[Comments] [text] NOT NULL,
 CONSTRAINT [PK_WorkoutAnnouncement] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[WorkoutRegistration]    Script Date: 6/17/2025 3:05:57 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[WorkoutRegistration](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[Name] [varchar](100) NOT NULL,
	[EMail] [varchar](100) NOT NULL,
	[Age] [int] NOT NULL,
	[Phone1] [varchar](14) NOT NULL,
	[Phone2] [varchar](14) NOT NULL,
	[Phone3] [varchar](14) NOT NULL,
	[Phone4] [varchar](14) NOT NULL,
	[Positions] [varchar](50) NOT NULL,
	[IsManager] [bit] NOT NULL,
	[WorkoutId] [bigint] NOT NULL,
	[DateRegistered] [smalldatetime] NOT NULL,
	[WhereHeard] [varchar](25) NOT NULL,
 CONSTRAINT [PK_WorkoutRegistration] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[Accounts] ADD  CONSTRAINT [DF_Accounts_DefaultVideo]  DEFAULT ('') FOR [DefaultVideo]
GO
ALTER TABLE [dbo].[Accounts] ADD  CONSTRAINT [DF_Accounts_AutoPlayVideo]  DEFAULT ((0)) FOR [AutoPlayVideo]
GO
ALTER TABLE [dbo].[Affiliations] ADD  CONSTRAINT [DF_Affiliations_URL]  DEFAULT ('') FOR [URL]
GO
ALTER TABLE [dbo].[Contacts] ADD  CONSTRAINT [DF_Contacts_IsFemale]  DEFAULT ((0)) FOR [IsFemale]
GO
ALTER TABLE [dbo].[GolfMatch] ADD  CONSTRAINT [DF__GolfMatch__Cours__58671BC9]  DEFAULT ((0)) FOR [CourseId]
GO
ALTER TABLE [dbo].[GolfRoster] ADD  CONSTRAINT [DF_GolfRoster_IsSub]  DEFAULT ((0)) FOR [IsSub]
GO
ALTER TABLE [dbo].[GolfTeeInformation] ADD  CONSTRAINT [DF_GolfTeeInformation_Priority]  DEFAULT ((0)) FOR [Priority]
GO
ALTER TABLE [dbo].[LeagueSchedule] ADD  CONSTRAINT [DF_LeagueSchedule_FieldId]  DEFAULT ((0)) FOR [FieldId]
GO
ALTER TABLE [dbo].[Roster] ADD  DEFAULT ((0)) FOR [FirstYear]
GO
ALTER TABLE [dbo].[Teams] ADD  CONSTRAINT [DF_Teams_DefaultVideo]  DEFAULT ('') FOR [DefaultVideo]
GO
ALTER TABLE [dbo].[Teams] ADD  CONSTRAINT [DF_Teams_AutoPlayVideo]  DEFAULT ((0)) FOR [AutoPlayVideo]
GO
ALTER TABLE [dbo].[AccountHandouts]  WITH CHECK ADD  CONSTRAINT [FK_AccountHandouts_Accounts] FOREIGN KEY([AccountId])
REFERENCES [dbo].[Accounts] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[AccountHandouts] CHECK CONSTRAINT [FK_AccountHandouts_Accounts]
GO
ALTER TABLE [dbo].[Accounts]  WITH CHECK ADD  CONSTRAINT [FK_Accounts_AspNetUsers] FOREIGN KEY([OwnerUserId])
REFERENCES [dbo].[AspNetUsers] ([Id])
GO
ALTER TABLE [dbo].[Accounts] CHECK CONSTRAINT [FK_Accounts_AspNetUsers]
GO
ALTER TABLE [dbo].[Accounts]  WITH CHECK ADD  CONSTRAINT [FK_AccountTypes_Accounts] FOREIGN KEY([AccountTypeId])
REFERENCES [dbo].[AccountTypes] ([Id])
GO
ALTER TABLE [dbo].[Accounts] CHECK CONSTRAINT [FK_AccountTypes_Accounts]
GO
ALTER TABLE [dbo].[Accounts]  WITH NOCHECK ADD  CONSTRAINT [FK_Affiliations_Accounts] FOREIGN KEY([AffiliationId])
REFERENCES [dbo].[Affiliations] ([Id])
GO
ALTER TABLE [dbo].[Accounts] NOCHECK CONSTRAINT [FK_Affiliations_Accounts]
GO
ALTER TABLE [dbo].[AccountSettings]  WITH CHECK ADD  CONSTRAINT [FK_AccountSettings_Accounts] FOREIGN KEY([AccountId])
REFERENCES [dbo].[Accounts] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[AccountSettings] CHECK CONSTRAINT [FK_AccountSettings_Accounts]
GO
ALTER TABLE [dbo].[AccountsURL]  WITH CHECK ADD  CONSTRAINT [FK_AccountsURL_Accounts] FOREIGN KEY([AccountId])
REFERENCES [dbo].[Accounts] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[AccountsURL] CHECK CONSTRAINT [FK_AccountsURL_Accounts]
GO
ALTER TABLE [dbo].[AccountWelcome]  WITH CHECK ADD  CONSTRAINT [FK_AccountWelcome_Accounts] FOREIGN KEY([AccountId])
REFERENCES [dbo].[Accounts] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[AccountWelcome] CHECK CONSTRAINT [FK_AccountWelcome_Accounts]
GO
ALTER TABLE [dbo].[AccountWelcome]  WITH NOCHECK ADD  CONSTRAINT [FK_AccountWelcome_Teams] FOREIGN KEY([TeamId])
REFERENCES [dbo].[Teams] ([id])
GO
ALTER TABLE [dbo].[AccountWelcome] NOCHECK CONSTRAINT [FK_AccountWelcome_Teams]
GO
ALTER TABLE [dbo].[AspNetUserClaims]  WITH CHECK ADD  CONSTRAINT [FK_dbo.AspNetUserClaims_dbo.AspNetUsers_User_Id] FOREIGN KEY([UserId])
REFERENCES [dbo].[AspNetUsers] ([Id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[AspNetUserClaims] CHECK CONSTRAINT [FK_dbo.AspNetUserClaims_dbo.AspNetUsers_User_Id]
GO
ALTER TABLE [dbo].[AspNetUserLogins]  WITH CHECK ADD  CONSTRAINT [FK_dbo.AspNetUserLogins_dbo.AspNetUsers_UserId] FOREIGN KEY([UserId])
REFERENCES [dbo].[AspNetUsers] ([Id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[AspNetUserLogins] CHECK CONSTRAINT [FK_dbo.AspNetUserLogins_dbo.AspNetUsers_UserId]
GO
ALTER TABLE [dbo].[AspNetUserRoles]  WITH CHECK ADD  CONSTRAINT [FK_dbo.AspNetUserRoles_dbo.AspNetRoles_RoleId] FOREIGN KEY([RoleId])
REFERENCES [dbo].[AspNetRoles] ([Id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[AspNetUserRoles] CHECK CONSTRAINT [FK_dbo.AspNetUserRoles_dbo.AspNetRoles_RoleId]
GO
ALTER TABLE [dbo].[AspNetUserRoles]  WITH CHECK ADD  CONSTRAINT [FK_dbo.AspNetUserRoles_dbo.AspNetUsers_UserId] FOREIGN KEY([UserId])
REFERENCES [dbo].[AspNetUsers] ([Id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[AspNetUserRoles] CHECK CONSTRAINT [FK_dbo.AspNetUserRoles_dbo.AspNetUsers_UserId]
GO
ALTER TABLE [dbo].[AvailableFields]  WITH CHECK ADD  CONSTRAINT [FK_AvailableFields_Accounts] FOREIGN KEY([AccountId])
REFERENCES [dbo].[Accounts] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[AvailableFields] CHECK CONSTRAINT [FK_AvailableFields_Accounts]
GO
ALTER TABLE [dbo].[batstatsum]  WITH CHECK ADD  CONSTRAINT [FK_batstatsum_LeagueSchedule] FOREIGN KEY([GameId])
REFERENCES [dbo].[LeagueSchedule] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[batstatsum] CHECK CONSTRAINT [FK_batstatsum_LeagueSchedule]
GO
ALTER TABLE [dbo].[batstatsum]  WITH CHECK ADD  CONSTRAINT [FK_batstatsum_RosterSeason] FOREIGN KEY([PlayerId])
REFERENCES [dbo].[RosterSeason] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[batstatsum] CHECK CONSTRAINT [FK_batstatsum_RosterSeason]
GO
ALTER TABLE [dbo].[batstatsum]  WITH CHECK ADD  CONSTRAINT [FK_batstatsum_TeamsSeason] FOREIGN KEY([TeamId])
REFERENCES [dbo].[TeamsSeason] ([id])
GO
ALTER TABLE [dbo].[batstatsum] CHECK CONSTRAINT [FK_batstatsum_TeamsSeason]
GO
ALTER TABLE [dbo].[ContactRoles]  WITH CHECK ADD  CONSTRAINT [FK_ContactRoles_Contacts] FOREIGN KEY([ContactId])
REFERENCES [dbo].[Contacts] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[ContactRoles] CHECK CONSTRAINT [FK_ContactRoles_Contacts]
GO
ALTER TABLE [dbo].[Contacts]  WITH NOCHECK ADD  CONSTRAINT [FK_Contacts_AspNetUsers] FOREIGN KEY([UserId])
REFERENCES [dbo].[AspNetUsers] ([Id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[Contacts] CHECK CONSTRAINT [FK_Contacts_AspNetUsers]
GO
ALTER TABLE [dbo].[CurrentSeason]  WITH CHECK ADD  CONSTRAINT [FK_CurrentSeason_Accounts] FOREIGN KEY([AccountId])
REFERENCES [dbo].[Accounts] ([Id])
GO
ALTER TABLE [dbo].[CurrentSeason] CHECK CONSTRAINT [FK_CurrentSeason_Accounts]
GO
ALTER TABLE [dbo].[DivisionDefs]  WITH CHECK ADD  CONSTRAINT [FK_DivisionDefs_Accounts] FOREIGN KEY([AccountId])
REFERENCES [dbo].[Accounts] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[DivisionDefs] CHECK CONSTRAINT [FK_DivisionDefs_Accounts]
GO
ALTER TABLE [dbo].[DivisionSeason]  WITH CHECK ADD  CONSTRAINT [FK_DivisionSeason_DivisionDefs] FOREIGN KEY([DivisionId])
REFERENCES [dbo].[DivisionDefs] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[DivisionSeason] CHECK CONSTRAINT [FK_DivisionSeason_DivisionDefs]
GO
ALTER TABLE [dbo].[DivisionSeason]  WITH CHECK ADD  CONSTRAINT [FK_DivisionSeason_LeagueSeason] FOREIGN KEY([LeagueSeasonId])
REFERENCES [dbo].[LeagueSeason] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[DivisionSeason] CHECK CONSTRAINT [FK_DivisionSeason_LeagueSeason]
GO
ALTER TABLE [dbo].[FieldContacts]  WITH CHECK ADD  CONSTRAINT [FK_FieldContacts_AvailableFields] FOREIGN KEY([FieldId])
REFERENCES [dbo].[AvailableFields] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[FieldContacts] CHECK CONSTRAINT [FK_FieldContacts_AvailableFields]
GO
ALTER TABLE [dbo].[FieldContacts]  WITH CHECK ADD  CONSTRAINT [FK_FieldContacts_Contacts] FOREIGN KEY([ContactId])
REFERENCES [dbo].[Contacts] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[FieldContacts] CHECK CONSTRAINT [FK_FieldContacts_Contacts]
GO
ALTER TABLE [dbo].[fieldstatsum]  WITH CHECK ADD  CONSTRAINT [FK_fieldstatsum_LeagueSchedule] FOREIGN KEY([GameId])
REFERENCES [dbo].[LeagueSchedule] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[fieldstatsum] CHECK CONSTRAINT [FK_fieldstatsum_LeagueSchedule]
GO
ALTER TABLE [dbo].[fieldstatsum]  WITH CHECK ADD  CONSTRAINT [FK_fieldstatsum_RosterSeason] FOREIGN KEY([PlayerId])
REFERENCES [dbo].[RosterSeason] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[fieldstatsum] CHECK CONSTRAINT [FK_fieldstatsum_RosterSeason]
GO
ALTER TABLE [dbo].[fieldstatsum]  WITH CHECK ADD  CONSTRAINT [FK_fieldstatsum_TeamsSeason] FOREIGN KEY([TeamId])
REFERENCES [dbo].[TeamsSeason] ([id])
GO
ALTER TABLE [dbo].[fieldstatsum] CHECK CONSTRAINT [FK_fieldstatsum_TeamsSeason]
GO
ALTER TABLE [dbo].[GameEjections]  WITH CHECK ADD  CONSTRAINT [FK_GameEjections_LeagueSchedule] FOREIGN KEY([gameId])
REFERENCES [dbo].[LeagueSchedule] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[GameEjections] CHECK CONSTRAINT [FK_GameEjections_LeagueSchedule]
GO
ALTER TABLE [dbo].[GameEjections]  WITH CHECK ADD  CONSTRAINT [FK_GameEjections_LeagueSeason] FOREIGN KEY([leagueSeasonId])
REFERENCES [dbo].[LeagueSeason] ([id])
GO
ALTER TABLE [dbo].[GameEjections] CHECK CONSTRAINT [FK_GameEjections_LeagueSeason]
GO
ALTER TABLE [dbo].[GameEjections]  WITH NOCHECK ADD  CONSTRAINT [FK_GameEjections_LeagueUmpires] FOREIGN KEY([umpireId])
REFERENCES [dbo].[LeagueUmpires] ([id])
GO
ALTER TABLE [dbo].[GameEjections] NOCHECK CONSTRAINT [FK_GameEjections_LeagueUmpires]
GO
ALTER TABLE [dbo].[GameEjections]  WITH CHECK ADD  CONSTRAINT [FK_GameEjections_RosterSeason] FOREIGN KEY([playerSeasonId])
REFERENCES [dbo].[RosterSeason] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[GameEjections] CHECK CONSTRAINT [FK_GameEjections_RosterSeason]
GO
ALTER TABLE [dbo].[GameRecap]  WITH CHECK ADD  CONSTRAINT [FK_GameRecap_LeagueSchedule] FOREIGN KEY([GameId])
REFERENCES [dbo].[LeagueSchedule] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[GameRecap] CHECK CONSTRAINT [FK_GameRecap_LeagueSchedule]
GO
ALTER TABLE [dbo].[GameRecap]  WITH CHECK ADD  CONSTRAINT [FK_GameRecap_TeamsSeason] FOREIGN KEY([TeamId])
REFERENCES [dbo].[TeamsSeason] ([id])
GO
ALTER TABLE [dbo].[GameRecap] CHECK CONSTRAINT [FK_GameRecap_TeamsSeason]
GO
ALTER TABLE [dbo].[GolfCourseForContact]  WITH CHECK ADD  CONSTRAINT [FK_GolfCourseForContact_Contacts] FOREIGN KEY([ContactId])
REFERENCES [dbo].[Contacts] ([Id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[GolfCourseForContact] CHECK CONSTRAINT [FK_GolfCourseForContact_Contacts]
GO
ALTER TABLE [dbo].[GolfCourseForContact]  WITH CHECK ADD  CONSTRAINT [FK_GolfCourseForContact_GolfCourse] FOREIGN KEY([CourseId])
REFERENCES [dbo].[GolfCourse] ([Id])
GO
ALTER TABLE [dbo].[GolfCourseForContact] CHECK CONSTRAINT [FK_GolfCourseForContact_GolfCourse]
GO
ALTER TABLE [dbo].[GolferStatsConfiguration]  WITH CHECK ADD  CONSTRAINT [FK_GolferStatsConfiguration_Contacts] FOREIGN KEY([ContactId])
REFERENCES [dbo].[Contacts] ([Id])
GO
ALTER TABLE [dbo].[GolferStatsConfiguration] CHECK CONSTRAINT [FK_GolferStatsConfiguration_Contacts]
GO
ALTER TABLE [dbo].[GolferStatsConfiguration]  WITH CHECK ADD  CONSTRAINT [FK_GolferStatsConfiguration_GolfStatDef] FOREIGN KEY([StatId])
REFERENCES [dbo].[GolfStatDef] ([Id])
GO
ALTER TABLE [dbo].[GolferStatsConfiguration] CHECK CONSTRAINT [FK_GolferStatsConfiguration_GolfStatDef]
GO
ALTER TABLE [dbo].[GolferStatsValue]  WITH CHECK ADD  CONSTRAINT [FK_GolferStatsValue_Contacts] FOREIGN KEY([ContactId])
REFERENCES [dbo].[Contacts] ([Id])
GO
ALTER TABLE [dbo].[GolferStatsValue] CHECK CONSTRAINT [FK_GolferStatsValue_Contacts]
GO
ALTER TABLE [dbo].[GolferStatsValue]  WITH CHECK ADD  CONSTRAINT [FK_GolferStatsValue_GolfScore] FOREIGN KEY([ScoreId])
REFERENCES [dbo].[GolfScore] ([Id])
GO
ALTER TABLE [dbo].[GolferStatsValue] CHECK CONSTRAINT [FK_GolferStatsValue_GolfScore]
GO
ALTER TABLE [dbo].[GolfLeagueCourses]  WITH CHECK ADD  CONSTRAINT [FK_GolfLeagueCourses_Accounts] FOREIGN KEY([AccountId])
REFERENCES [dbo].[Accounts] ([Id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[GolfLeagueCourses] CHECK CONSTRAINT [FK_GolfLeagueCourses_Accounts]
GO
ALTER TABLE [dbo].[GolfLeagueCourses]  WITH CHECK ADD  CONSTRAINT [FK_GolfLeagueCourses_GolfCourse] FOREIGN KEY([CourseId])
REFERENCES [dbo].[GolfCourse] ([Id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[GolfLeagueCourses] CHECK CONSTRAINT [FK_GolfLeagueCourses_GolfCourse]
GO
ALTER TABLE [dbo].[GolfLeagueSetup]  WITH CHECK ADD  CONSTRAINT [FK_GolfLeagueSetup_Accounts] FOREIGN KEY([AccountId])
REFERENCES [dbo].[Accounts] ([Id])
GO
ALTER TABLE [dbo].[GolfLeagueSetup] CHECK CONSTRAINT [FK_GolfLeagueSetup_Accounts]
GO
ALTER TABLE [dbo].[GolfLeagueSetup]  WITH NOCHECK ADD  CONSTRAINT [FK_GolfLeagueSetup_Contacts] FOREIGN KEY([PresidentId])
REFERENCES [dbo].[Contacts] ([Id])
GO
ALTER TABLE [dbo].[GolfLeagueSetup] NOCHECK CONSTRAINT [FK_GolfLeagueSetup_Contacts]
GO
ALTER TABLE [dbo].[GolfLeagueSetup]  WITH NOCHECK ADD  CONSTRAINT [FK_GolfLeagueSetup_Contacts1] FOREIGN KEY([VicePresidentId])
REFERENCES [dbo].[Contacts] ([Id])
GO
ALTER TABLE [dbo].[GolfLeagueSetup] NOCHECK CONSTRAINT [FK_GolfLeagueSetup_Contacts1]
GO
ALTER TABLE [dbo].[GolfLeagueSetup]  WITH NOCHECK ADD  CONSTRAINT [FK_GolfLeagueSetup_Contacts2] FOREIGN KEY([SecretaryId])
REFERENCES [dbo].[Contacts] ([Id])
GO
ALTER TABLE [dbo].[GolfLeagueSetup] NOCHECK CONSTRAINT [FK_GolfLeagueSetup_Contacts2]
GO
ALTER TABLE [dbo].[GolfLeagueSetup]  WITH NOCHECK ADD  CONSTRAINT [FK_GolfLeagueSetup_Contacts3] FOREIGN KEY([TreasurerId])
REFERENCES [dbo].[Contacts] ([Id])
GO
ALTER TABLE [dbo].[GolfLeagueSetup] NOCHECK CONSTRAINT [FK_GolfLeagueSetup_Contacts3]
GO
ALTER TABLE [dbo].[GolfMatch]  WITH CHECK ADD  CONSTRAINT [FK_GolfMatch_GolfCourse] FOREIGN KEY([CourseId])
REFERENCES [dbo].[GolfCourse] ([Id])
ON DELETE SET DEFAULT
GO
ALTER TABLE [dbo].[GolfMatch] CHECK CONSTRAINT [FK_GolfMatch_GolfCourse]
GO
ALTER TABLE [dbo].[GolfMatch]  WITH CHECK ADD  CONSTRAINT [FK_GolfMatch_LeagueSeason] FOREIGN KEY([LeagueId])
REFERENCES [dbo].[LeagueSeason] ([id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[GolfMatch] CHECK CONSTRAINT [FK_GolfMatch_LeagueSeason]
GO
ALTER TABLE [dbo].[GolfMatch]  WITH CHECK ADD  CONSTRAINT [FK_GolfMatch_Teams] FOREIGN KEY([Team2])
REFERENCES [dbo].[TeamsSeason] ([id])
GO
ALTER TABLE [dbo].[GolfMatch] CHECK CONSTRAINT [FK_GolfMatch_Teams]
GO
ALTER TABLE [dbo].[GolfMatch]  WITH CHECK ADD  CONSTRAINT [FK_GolfMatch_TeamsSeason] FOREIGN KEY([Team1])
REFERENCES [dbo].[TeamsSeason] ([id])
GO
ALTER TABLE [dbo].[GolfMatch] CHECK CONSTRAINT [FK_GolfMatch_TeamsSeason]
GO
ALTER TABLE [dbo].[GolfMatchScores]  WITH CHECK ADD  CONSTRAINT [FK_GolfMatchScores_GolfMatch] FOREIGN KEY([MatchId])
REFERENCES [dbo].[GolfMatch] ([Id])
GO
ALTER TABLE [dbo].[GolfMatchScores] CHECK CONSTRAINT [FK_GolfMatchScores_GolfMatch]
GO
ALTER TABLE [dbo].[GolfMatchScores]  WITH CHECK ADD  CONSTRAINT [FK_GolfMatchScores_GolfRoster] FOREIGN KEY([PlayerId])
REFERENCES [dbo].[GolfRoster] ([Id])
GO
ALTER TABLE [dbo].[GolfMatchScores] CHECK CONSTRAINT [FK_GolfMatchScores_GolfRoster]
GO
ALTER TABLE [dbo].[GolfMatchScores]  WITH CHECK ADD  CONSTRAINT [FK_GolfMatchScores_GolfScore] FOREIGN KEY([ScoreId])
REFERENCES [dbo].[GolfScore] ([Id])
GO
ALTER TABLE [dbo].[GolfMatchScores] CHECK CONSTRAINT [FK_GolfMatchScores_GolfScore]
GO
ALTER TABLE [dbo].[GolfMatchScores]  WITH CHECK ADD  CONSTRAINT [FK_GolfMatchScores_TeamsSeason] FOREIGN KEY([TeamId])
REFERENCES [dbo].[TeamsSeason] ([id])
GO
ALTER TABLE [dbo].[GolfMatchScores] CHECK CONSTRAINT [FK_GolfMatchScores_TeamsSeason]
GO
ALTER TABLE [dbo].[GolfRoster]  WITH CHECK ADD  CONSTRAINT [FK_GolfRoster_Contacts] FOREIGN KEY([ContactId])
REFERENCES [dbo].[Contacts] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[GolfRoster] CHECK CONSTRAINT [FK_GolfRoster_Contacts]
GO
ALTER TABLE [dbo].[GolfRoster]  WITH NOCHECK ADD  CONSTRAINT [FK_GolfRoster_TeamsSeason] FOREIGN KEY([TeamSeasonId])
REFERENCES [dbo].[TeamsSeason] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[GolfRoster] NOCHECK CONSTRAINT [FK_GolfRoster_TeamsSeason]
GO
ALTER TABLE [dbo].[GolfScore]  WITH CHECK ADD  CONSTRAINT [FK_GolfScore_Contacts] FOREIGN KEY([ContactId])
REFERENCES [dbo].[Contacts] ([Id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[GolfScore] CHECK CONSTRAINT [FK_GolfScore_Contacts]
GO
ALTER TABLE [dbo].[GolfScore]  WITH CHECK ADD  CONSTRAINT [FK_GolfScore_GolfCourse] FOREIGN KEY([CourseId])
REFERENCES [dbo].[GolfCourse] ([Id])
GO
ALTER TABLE [dbo].[GolfScore] CHECK CONSTRAINT [FK_GolfScore_GolfCourse]
GO
ALTER TABLE [dbo].[GolfScore]  WITH CHECK ADD  CONSTRAINT [FK_GolfScore_GolfTeeInformation] FOREIGN KEY([TeeId])
REFERENCES [dbo].[GolfTeeInformation] ([Id])
GO
ALTER TABLE [dbo].[GolfScore] CHECK CONSTRAINT [FK_GolfScore_GolfTeeInformation]
GO
ALTER TABLE [dbo].[GolfTeeInformation]  WITH CHECK ADD  CONSTRAINT [FK_GolfTeeInformation_GolfCourse] FOREIGN KEY([CourseId])
REFERENCES [dbo].[GolfCourse] ([Id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[GolfTeeInformation] CHECK CONSTRAINT [FK_GolfTeeInformation_GolfCourse]
GO
ALTER TABLE [dbo].[hof]  WITH CHECK ADD  CONSTRAINT [FK_hof_Accounts] FOREIGN KEY([AccountId])
REFERENCES [dbo].[Accounts] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[hof] CHECK CONSTRAINT [FK_hof_Accounts]
GO
ALTER TABLE [dbo].[hof]  WITH CHECK ADD  CONSTRAINT [FK_hof_Contacts] FOREIGN KEY([ContactId])
REFERENCES [dbo].[Contacts] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[hof] CHECK CONSTRAINT [FK_hof_Contacts]
GO
ALTER TABLE [dbo].[HOFNomination]  WITH CHECK ADD  CONSTRAINT [FK_HOFNomination_Accounts] FOREIGN KEY([AccountId])
REFERENCES [dbo].[Accounts] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[HOFNomination] CHECK CONSTRAINT [FK_HOFNomination_Accounts]
GO
ALTER TABLE [dbo].[HOFNominationSetup]  WITH CHECK ADD  CONSTRAINT [FK_HOFNominationSetup_Accounts] FOREIGN KEY([AccountId])
REFERENCES [dbo].[Accounts] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[HOFNominationSetup] CHECK CONSTRAINT [FK_HOFNominationSetup_Accounts]
GO
ALTER TABLE [dbo].[League]  WITH CHECK ADD  CONSTRAINT [FK_League_Accounts] FOREIGN KEY([AccountId])
REFERENCES [dbo].[Accounts] ([Id])
GO
ALTER TABLE [dbo].[League] CHECK CONSTRAINT [FK_League_Accounts]
GO
ALTER TABLE [dbo].[LeagueEvents]  WITH CHECK ADD  CONSTRAINT [FK_LeagueEvents_LeagueSeason] FOREIGN KEY([LeagueSeasonId])
REFERENCES [dbo].[LeagueSeason] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[LeagueEvents] CHECK CONSTRAINT [FK_LeagueEvents_LeagueSeason]
GO
ALTER TABLE [dbo].[LeagueFAQ]  WITH CHECK ADD  CONSTRAINT [FK_LeagueFAQ_Accounts] FOREIGN KEY([AccountId])
REFERENCES [dbo].[Accounts] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[LeagueFAQ] CHECK CONSTRAINT [FK_LeagueFAQ_Accounts]
GO
ALTER TABLE [dbo].[LeagueNews]  WITH CHECK ADD  CONSTRAINT [FK_LeagueNews_Accounts] FOREIGN KEY([AccountId])
REFERENCES [dbo].[Accounts] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[LeagueNews] CHECK CONSTRAINT [FK_LeagueNews_Accounts]
GO
ALTER TABLE [dbo].[LeagueSchedule]  WITH NOCHECK ADD  CONSTRAINT [FK_LeagueSchedule_AvailableFields] FOREIGN KEY([FieldId])
REFERENCES [dbo].[AvailableFields] ([id])
ON DELETE SET DEFAULT
NOT FOR REPLICATION 
GO
ALTER TABLE [dbo].[LeagueSchedule] NOCHECK CONSTRAINT [FK_LeagueSchedule_AvailableFields]
GO
ALTER TABLE [dbo].[LeagueSchedule]  WITH CHECK ADD  CONSTRAINT [FK_LeagueSchedule_LeagueSeason] FOREIGN KEY([LeagueId])
REFERENCES [dbo].[LeagueSeason] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[LeagueSchedule] CHECK CONSTRAINT [FK_LeagueSchedule_LeagueSeason]
GO
ALTER TABLE [dbo].[LeagueSeason]  WITH CHECK ADD  CONSTRAINT [FK_LeagueSeason_League] FOREIGN KEY([LeagueId])
REFERENCES [dbo].[League] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[LeagueSeason] CHECK CONSTRAINT [FK_LeagueSeason_League]
GO
ALTER TABLE [dbo].[LeagueSeason]  WITH CHECK ADD  CONSTRAINT [FK_LeagueSeason_Season] FOREIGN KEY([SeasonId])
REFERENCES [dbo].[Season] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[LeagueSeason] CHECK CONSTRAINT [FK_LeagueSeason_Season]
GO
ALTER TABLE [dbo].[LeagueUmpires]  WITH CHECK ADD  CONSTRAINT [FK_LeagueUmpires_Accounts] FOREIGN KEY([AccountId])
REFERENCES [dbo].[Accounts] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[LeagueUmpires] CHECK CONSTRAINT [FK_LeagueUmpires_Accounts]
GO
ALTER TABLE [dbo].[LeagueUmpires]  WITH CHECK ADD  CONSTRAINT [FK_LeagueUmpires_Contacts] FOREIGN KEY([ContactId])
REFERENCES [dbo].[Contacts] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[LeagueUmpires] CHECK CONSTRAINT [FK_LeagueUmpires_Contacts]
GO
ALTER TABLE [dbo].[MemberBusiness]  WITH CHECK ADD  CONSTRAINT [FK_MemberBusiness_Contacts] FOREIGN KEY([ContactId])
REFERENCES [dbo].[Contacts] ([Id])
GO
ALTER TABLE [dbo].[MemberBusiness] CHECK CONSTRAINT [FK_MemberBusiness_Contacts]
GO
ALTER TABLE [dbo].[MessagePost]  WITH NOCHECK ADD  CONSTRAINT [FK_MessagePost_Contacts] FOREIGN KEY([ContactCreatorId])
REFERENCES [dbo].[Contacts] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[MessagePost] NOCHECK CONSTRAINT [FK_MessagePost_Contacts]
GO
ALTER TABLE [dbo].[MessagePost]  WITH CHECK ADD  CONSTRAINT [FK_MessagePost_MessageCategory] FOREIGN KEY([CategoryId])
REFERENCES [dbo].[MessageCategory] ([id])
GO
ALTER TABLE [dbo].[MessagePost] CHECK CONSTRAINT [FK_MessagePost_MessageCategory]
GO
ALTER TABLE [dbo].[MessagePost]  WITH CHECK ADD  CONSTRAINT [FK_MessagePost_MessageTopic] FOREIGN KEY([TopicId])
REFERENCES [dbo].[MessageTopic] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[MessagePost] CHECK CONSTRAINT [FK_MessagePost_MessageTopic]
GO
ALTER TABLE [dbo].[MessageTopic]  WITH NOCHECK ADD  CONSTRAINT [FK_MessageTopic_Contacts] FOREIGN KEY([ContactCreatorId])
REFERENCES [dbo].[Contacts] ([Id])
GO
ALTER TABLE [dbo].[MessageTopic] NOCHECK CONSTRAINT [FK_MessageTopic_Contacts]
GO
ALTER TABLE [dbo].[MessageTopic]  WITH CHECK ADD  CONSTRAINT [FK_MessageTopic_MessageCategory] FOREIGN KEY([CategoryId])
REFERENCES [dbo].[MessageCategory] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[MessageTopic] CHECK CONSTRAINT [FK_MessageTopic_MessageCategory]
GO
ALTER TABLE [dbo].[PhotoGallery]  WITH CHECK ADD  CONSTRAINT [FK_PhotoGallery_Accounts] FOREIGN KEY([AccountId])
REFERENCES [dbo].[Accounts] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[PhotoGallery] CHECK CONSTRAINT [FK_PhotoGallery_Accounts]
GO
ALTER TABLE [dbo].[PhotoGallery]  WITH NOCHECK ADD  CONSTRAINT [FK_PhotoGallery_PhotoGalleryAlbum] FOREIGN KEY([AlbumId])
REFERENCES [dbo].[PhotoGalleryAlbum] ([id])
GO
ALTER TABLE [dbo].[PhotoGallery] NOCHECK CONSTRAINT [FK_PhotoGallery_PhotoGalleryAlbum]
GO
ALTER TABLE [dbo].[pitchstatsum]  WITH CHECK ADD  CONSTRAINT [FK_pitchstatsum_LeagueSchedule] FOREIGN KEY([GameId])
REFERENCES [dbo].[LeagueSchedule] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[pitchstatsum] CHECK CONSTRAINT [FK_pitchstatsum_LeagueSchedule]
GO
ALTER TABLE [dbo].[pitchstatsum]  WITH CHECK ADD  CONSTRAINT [FK_pitchstatsum_RosterSeason] FOREIGN KEY([PlayerId])
REFERENCES [dbo].[RosterSeason] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[pitchstatsum] CHECK CONSTRAINT [FK_pitchstatsum_RosterSeason]
GO
ALTER TABLE [dbo].[pitchstatsum]  WITH CHECK ADD  CONSTRAINT [FK_pitchstatsum_TeamsSeason] FOREIGN KEY([TeamId])
REFERENCES [dbo].[TeamsSeason] ([id])
GO
ALTER TABLE [dbo].[pitchstatsum] CHECK CONSTRAINT [FK_pitchstatsum_TeamsSeason]
GO
ALTER TABLE [dbo].[PlayerProfile]  WITH CHECK ADD  CONSTRAINT [FK_PlayerProfile_Contacts] FOREIGN KEY([PlayerId])
REFERENCES [dbo].[Contacts] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[PlayerProfile] CHECK CONSTRAINT [FK_PlayerProfile_Contacts]
GO
ALTER TABLE [dbo].[PlayerProfile]  WITH CHECK ADD  CONSTRAINT [FK_PlayerProfile_ProfileQuestion] FOREIGN KEY([QuestionId])
REFERENCES [dbo].[ProfileQuestion] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[PlayerProfile] CHECK CONSTRAINT [FK_PlayerProfile_ProfileQuestion]
GO
ALTER TABLE [dbo].[PlayerRecap]  WITH CHECK ADD  CONSTRAINT [FK_PlayerRecap_LeagueSchedule] FOREIGN KEY([GameId])
REFERENCES [dbo].[LeagueSchedule] ([id])
GO
ALTER TABLE [dbo].[PlayerRecap] CHECK CONSTRAINT [FK_PlayerRecap_LeagueSchedule]
GO
ALTER TABLE [dbo].[PlayerRecap]  WITH CHECK ADD  CONSTRAINT [FK_PlayerRecap_RosterSeason] FOREIGN KEY([PlayerId])
REFERENCES [dbo].[RosterSeason] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[PlayerRecap] CHECK CONSTRAINT [FK_PlayerRecap_RosterSeason]
GO
ALTER TABLE [dbo].[PlayerRecap]  WITH CHECK ADD  CONSTRAINT [FK_PlayerRecap_TeamsSeason] FOREIGN KEY([TeamId])
REFERENCES [dbo].[TeamsSeason] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[PlayerRecap] CHECK CONSTRAINT [FK_PlayerRecap_TeamsSeason]
GO
ALTER TABLE [dbo].[PlayerSeasonAffiliationDues]  WITH CHECK ADD  CONSTRAINT [FK_PlayerSeasonAffiliationDues_Roster] FOREIGN KEY([PlayerId])
REFERENCES [dbo].[Roster] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[PlayerSeasonAffiliationDues] CHECK CONSTRAINT [FK_PlayerSeasonAffiliationDues_Roster]
GO
ALTER TABLE [dbo].[PlayerSeasonAffiliationDues]  WITH CHECK ADD  CONSTRAINT [FK_PlayerSeasonAffiliationDues_Season] FOREIGN KEY([SeasonId])
REFERENCES [dbo].[Season] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[PlayerSeasonAffiliationDues] CHECK CONSTRAINT [FK_PlayerSeasonAffiliationDues_Season]
GO
ALTER TABLE [dbo].[PlayersWantedClassified]  WITH CHECK ADD  CONSTRAINT [FK_PlayersWantedClassified_Accounts] FOREIGN KEY([AccountId])
REFERENCES [dbo].[Accounts] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[PlayersWantedClassified] CHECK CONSTRAINT [FK_PlayersWantedClassified_Accounts]
GO
ALTER TABLE [dbo].[PlayersWantedClassified]  WITH CHECK ADD  CONSTRAINT [FK_PlayersWantedClassified_Contacts] FOREIGN KEY([CreatedByContactId])
REFERENCES [dbo].[Contacts] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[PlayersWantedClassified] CHECK CONSTRAINT [FK_PlayersWantedClassified_Contacts]
GO
ALTER TABLE [dbo].[PlayoffBracket]  WITH CHECK ADD  CONSTRAINT [FK_PlayoffBracket_PlayoffSetup] FOREIGN KEY([PlayoffId])
REFERENCES [dbo].[PlayoffSetup] ([id])
GO
ALTER TABLE [dbo].[PlayoffBracket] CHECK CONSTRAINT [FK_PlayoffBracket_PlayoffSetup]
GO
ALTER TABLE [dbo].[PlayoffGame]  WITH CHECK ADD  CONSTRAINT [FK_PlayoffGame_PlayoffGame] FOREIGN KEY([BracketId])
REFERENCES [dbo].[PlayoffBracket] ([id])
GO
ALTER TABLE [dbo].[PlayoffGame] CHECK CONSTRAINT [FK_PlayoffGame_PlayoffGame]
GO
ALTER TABLE [dbo].[PlayoffSeeds]  WITH CHECK ADD  CONSTRAINT [FK_PlayoffSeeds_PlayoffSetup] FOREIGN KEY([PlayoffId])
REFERENCES [dbo].[PlayoffSetup] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[PlayoffSeeds] CHECK CONSTRAINT [FK_PlayoffSeeds_PlayoffSetup]
GO
ALTER TABLE [dbo].[PlayoffSetup]  WITH CHECK ADD  CONSTRAINT [FK_PlayoffSetup_LeagueSeason] FOREIGN KEY([LeagueSeasonId])
REFERENCES [dbo].[LeagueSeason] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[PlayoffSetup] CHECK CONSTRAINT [FK_PlayoffSetup_LeagueSeason]
GO
ALTER TABLE [dbo].[ProfileCategory]  WITH CHECK ADD  CONSTRAINT [FK_ProfileCategory_Accounts] FOREIGN KEY([AccountId])
REFERENCES [dbo].[Accounts] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[ProfileCategory] CHECK CONSTRAINT [FK_ProfileCategory_Accounts]
GO
ALTER TABLE [dbo].[ProfileQuestion]  WITH CHECK ADD  CONSTRAINT [FK_ProfileQuestion_ProfileCategory] FOREIGN KEY([CategoryId])
REFERENCES [dbo].[ProfileCategory] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[ProfileQuestion] CHECK CONSTRAINT [FK_ProfileQuestion_ProfileCategory]
GO
ALTER TABLE [dbo].[Roster]  WITH CHECK ADD  CONSTRAINT [FK_Roster_Contacts] FOREIGN KEY([ContactId])
REFERENCES [dbo].[Contacts] ([Id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Roster] CHECK CONSTRAINT [FK_Roster_Contacts]
GO
ALTER TABLE [dbo].[RosterSeason]  WITH CHECK ADD  CONSTRAINT [FK_RosterSeason_Roster] FOREIGN KEY([PlayerId])
REFERENCES [dbo].[Roster] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[RosterSeason] CHECK CONSTRAINT [FK_RosterSeason_Roster]
GO
ALTER TABLE [dbo].[Season]  WITH CHECK ADD  CONSTRAINT [FK_Season_Accounts] FOREIGN KEY([AccountId])
REFERENCES [dbo].[Accounts] ([Id])
GO
ALTER TABLE [dbo].[Season] CHECK CONSTRAINT [FK_Season_Accounts]
GO
ALTER TABLE [dbo].[Sponsors]  WITH NOCHECK ADD  CONSTRAINT [FK_Sponsors_Accounts] FOREIGN KEY([AccountId])
REFERENCES [dbo].[Accounts] ([Id])
GO
ALTER TABLE [dbo].[Sponsors] NOCHECK CONSTRAINT [FK_Sponsors_Accounts]
GO
ALTER TABLE [dbo].[Sponsors]  WITH NOCHECK ADD  CONSTRAINT [FK_Sponsors_Teams] FOREIGN KEY([TeamId])
REFERENCES [dbo].[Teams] ([id])
GO
ALTER TABLE [dbo].[Sponsors] NOCHECK CONSTRAINT [FK_Sponsors_Teams]
GO
ALTER TABLE [dbo].[TeamHandouts]  WITH CHECK ADD  CONSTRAINT [FK_TeamHandouts_Teams] FOREIGN KEY([TeamId])
REFERENCES [dbo].[Teams] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[TeamHandouts] CHECK CONSTRAINT [FK_TeamHandouts_Teams]
GO
ALTER TABLE [dbo].[TeamNews]  WITH CHECK ADD  CONSTRAINT [FK_TeamNews_Teams] FOREIGN KEY([TeamId])
REFERENCES [dbo].[Teams] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[TeamNews] CHECK CONSTRAINT [FK_TeamNews_Teams]
GO
ALTER TABLE [dbo].[Teams]  WITH CHECK ADD  CONSTRAINT [FK_Teams_Accounts] FOREIGN KEY([AccountId])
REFERENCES [dbo].[Accounts] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Teams] CHECK CONSTRAINT [FK_Teams_Accounts]
GO
ALTER TABLE [dbo].[TeamSeasonManager]  WITH CHECK ADD  CONSTRAINT [FK_TeamSeasonManager_Contacts] FOREIGN KEY([ContactId])
REFERENCES [dbo].[Contacts] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[TeamSeasonManager] CHECK CONSTRAINT [FK_TeamSeasonManager_Contacts]
GO
ALTER TABLE [dbo].[TeamSeasonManager]  WITH CHECK ADD  CONSTRAINT [FK_TeamSeasonManager_TeamsSeason] FOREIGN KEY([TeamSeasonId])
REFERENCES [dbo].[TeamsSeason] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[TeamSeasonManager] CHECK CONSTRAINT [FK_TeamSeasonManager_TeamsSeason]
GO
ALTER TABLE [dbo].[TeamsSeason]  WITH CHECK ADD  CONSTRAINT [FK_TeamsSeason_LeagueSeason] FOREIGN KEY([LeagueSeasonId])
REFERENCES [dbo].[LeagueSeason] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[TeamsSeason] CHECK CONSTRAINT [FK_TeamsSeason_LeagueSeason]
GO
ALTER TABLE [dbo].[TeamsSeason]  WITH CHECK ADD  CONSTRAINT [FK_TeamsSeason_Teams] FOREIGN KEY([TeamId])
REFERENCES [dbo].[Teams] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[TeamsSeason] CHECK CONSTRAINT [FK_TeamsSeason_Teams]
GO
ALTER TABLE [dbo].[TeamsWantedClassified]  WITH CHECK ADD  CONSTRAINT [FK_TeamsWantedClassified_Accounts] FOREIGN KEY([AccountId])
REFERENCES [dbo].[Accounts] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[TeamsWantedClassified] CHECK CONSTRAINT [FK_TeamsWantedClassified_Accounts]
GO
ALTER TABLE [dbo].[VoteAnswers]  WITH NOCHECK ADD  CONSTRAINT [FK_VoteAnswers_Contacts] FOREIGN KEY([ContactId])
REFERENCES [dbo].[Contacts] ([Id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[VoteAnswers] NOCHECK CONSTRAINT [FK_VoteAnswers_Contacts]
GO
ALTER TABLE [dbo].[VoteAnswers]  WITH CHECK ADD  CONSTRAINT [FK_VoteAnswers_VoteOptions] FOREIGN KEY([OptionId])
REFERENCES [dbo].[VoteOptions] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[VoteAnswers] CHECK CONSTRAINT [FK_VoteAnswers_VoteOptions]
GO
ALTER TABLE [dbo].[VoteAnswers]  WITH CHECK ADD  CONSTRAINT [FK_VoteAnswers_VoteQuestion] FOREIGN KEY([QuestionId])
REFERENCES [dbo].[VoteQuestion] ([id])
GO
ALTER TABLE [dbo].[VoteAnswers] CHECK CONSTRAINT [FK_VoteAnswers_VoteQuestion]
GO
ALTER TABLE [dbo].[VoteOptions]  WITH CHECK ADD  CONSTRAINT [FK_VoteOptions_VoteQuestion] FOREIGN KEY([QuestionId])
REFERENCES [dbo].[VoteQuestion] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[VoteOptions] CHECK CONSTRAINT [FK_VoteOptions_VoteQuestion]
GO
ALTER TABLE [dbo].[VoteQuestion]  WITH CHECK ADD  CONSTRAINT [FK_VoteQuestion_Accounts] FOREIGN KEY([AccountId])
REFERENCES [dbo].[Accounts] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[VoteQuestion] CHECK CONSTRAINT [FK_VoteQuestion_Accounts]
GO
ALTER TABLE [dbo].[WorkoutAnnouncement]  WITH CHECK ADD  CONSTRAINT [FK_WorkoutAnnouncement_Accounts] FOREIGN KEY([AccountId])
REFERENCES [dbo].[Accounts] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[WorkoutAnnouncement] CHECK CONSTRAINT [FK_WorkoutAnnouncement_Accounts]
GO
ALTER TABLE [dbo].[WorkoutAnnouncement]  WITH NOCHECK ADD  CONSTRAINT [FK_WorkoutAnnouncement_AvailableFields] FOREIGN KEY([FieldId])
REFERENCES [dbo].[AvailableFields] ([id])
GO
ALTER TABLE [dbo].[WorkoutAnnouncement] NOCHECK CONSTRAINT [FK_WorkoutAnnouncement_AvailableFields]
GO
ALTER TABLE [dbo].[WorkoutRegistration]  WITH CHECK ADD  CONSTRAINT [FK_WorkoutRegistration_WorkoutAnnouncement] FOREIGN KEY([WorkoutId])
REFERENCES [dbo].[WorkoutAnnouncement] ([id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[WorkoutRegistration] CHECK CONSTRAINT [FK_WorkoutRegistration_WorkoutAnnouncement]
GO
