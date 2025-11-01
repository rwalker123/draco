import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  AccountAffiliationSchema,
  AccountDetailsQuerySchema,
  AccountDomainLookupHeadersSchema,
  AccountHeaderSchema,
  AccountNameSchema,
  AccountPollSchema,
  AccountSchema,
  AccountSearchQuerySchema,
  AccountTypeSchema,
  AccountUrlSchema,
  CreateAccountUrlSchema,
  AccountTwitterSettingsSchema,
  AccountWithSeasonsSchema,
  AuthenticationErrorSchema,
  AuthorizationErrorSchema,
  CreateHofMemberSchema,
  AutomaticRoleHoldersSchema,
  BaseRoleSchema,
  AttachmentUploadResult,
  BaseballPositionSchema,
  BattingStatisticsFiltersSchema,
  ConflictErrorSchema,
  ContactPlayersWantedCreatorSchema,
  ContactSchema,
  ContactRoleSchema,
  ContactWithContactRolesSchema,
  BaseContactSchema,
  NamedContactSchema,
  ContactValidationWithSignInSchema,
  ContactValidationSchema,
  SignInCredentialsSchema,
  RegisteredUserWithRolesSchema,
  RegisteredUserSchema,
  CreateAccountSchema,
  CreateContactSchema,
  CreateContactRoleSchema,
  CreatePollSchema,
  CreateSponsorSchema,
  CreateMemberBusinessSchema,
  FieldSchema,
  FieldsSchema,
  UpsertFieldSchema,
  UpsertTeamManagerSchema,
  UpdatePollSchema,
  ExperienceLevelSchema,
  EmailComposeSchema,
  EmailSendSchema,
  EmailDetailSchema,
  EmailListPagedSchema,
  EmailTemplateSchema,
  EmailTemplatesListSchema,
  InternalServerErrorSchema,
  NotFoundErrorSchema,
  PlayerBattingStatsBriefSchema,
  PlayerBattingStatsSchema,
  HofContactSummarySchema,
  HofClassSummarySchema,
  HofClassWithMembersSchema,
  HofMemberSchema,
  HofNominationInductSchema,
  HofNominationListSchema,
  HofNominationSchema,
  HofNominationSetupSchema,
  HofEligibleContactsQuerySchema,
  HofEligibleContactsResponseSchema,
  HofNominationQuerySchema,
  PlayerCareerStatisticsSchema,
  PlayerPitchingStatsSchema,
  PlayerPitchingStatsBriefSchema,
  PublicContactSummarySchema,
  PublicContactSearchResponseSchema,
  PublicContactSearchQuerySchema,
  TeamStatsPlayerSummarySchema,
  GameBattingStatLineSchema,
  GameBattingStatsSchema,
  GamePitchingStatLineSchema,
  GamePitchingStatsSchema,
  CreateGameBattingStatSchema,
  UpdateGameBattingStatSchema,
  CreateGamePitchingStatSchema,
  UpdateGamePitchingStatSchema,
  TeamCompletedGameSchema,
  TeamCompletedGamesSchema,
  GameAttendanceSchema,
  UpdateGameAttendanceSchema,
  PlayerClassifiedSearchQuerySchema,
  PlayersWantedClassifiedPagedSchema,
  PlayersWantedClassifiedSchema,
  PitchingStatisticsFiltersSchema,
  PollVoteRequestSchema,
  RecentGamesQuerySchema,
  RecentGamesSchema,
  UmpireSchema,
  UmpiresSchema,
  RoleCheckSchema,
  RoleMetadataSchema,
  SubmitHofNominationSchema,
  RosterMemberSchema,
  RosterPlayerSchema,
  SignRosterMemberSchema,
  UpdateHofMemberSchema,
  UpdateRosterMemberSchema,
  SponsorListSchema,
  SponsorSchema,
  MemberBusinessListSchema,
  MemberBusinessQueryParamsSchema,
  MemberBusinessSchema,
  SeasonManagerListSchema,
  SeasonManagerSchema,
  SeasonManagerWithLeagueSchema,
  SeasonParticipantCountDataSchema,
  CurrentSeasonResponseSchema,
  SeasonSchema,
  TeamManagerSchema,
  TeamRosterMembersSchema,
  TeamSeasonSchema,
  TeamsWantedAccessCodeSchema,
  TeamsWantedContactInfoSchema,
  TeamsWantedContactQuerySchema,
  TeamsWantedOwnerClassifiedSchema,
  TeamsWantedPublicClassifiedPagedSchema,
  StandingsLeagueSchema,
  StandingsTeamSchema,
  TeamSeasonRecordSchema,
  UpsertTeamSeasonSchema,
  UpsertPlayersWantedClassifiedSchema,
  UpsertEmailTemplateSchema,
  UpsertTeamsWantedClassifiedSchema,
  UpsertWorkoutRegistrationSchema,
  UpdateHofNominationSchema,
  UpdateHofNominationSetupSchema,
  UpsertWorkoutSchema,
  ValidationErrorSchema,
  PagedContactSchema,
  PagingSchema,
  WorkoutListQuerySchema,
  WorkoutRegistrationSchema,
  WorkoutRegistrationsQuerySchema,
  WorkoutRegistrationsEmailRequestSchema,
  WorkoutRegistrationsSchema,
  WorkoutSchema,
  WorkoutSourceOptionPayloadSchema,
  WorkoutSourcesSchema,
  WorkoutSummarySchema,
  ContactSearchParamsSchema,
  DivisionSeasonSchema,
  DivisionSeasonWithTeamsSchema,
  LeagueSchema,
  LeagueSeasonQueryParamsSchema,
  LeagueSeasonSchema,
  LeagueSeasonWithDivisionSchema,
  LeagueSeasonWithDivisionTeamsAndUnassignedSchema,
  LeagueSetupSchema,
  UpsertDivisionSeasonSchema,
  UpsertLeagueSchema,
  UpsertSeasonSchema,
  GameSchema,
  GameResultSchema,
  GamesWithRecapsSchema,
  HandoutListSchema,
  HandoutSchema,
  LeaderCategoriesSchema,
  LeaderRowSchema,
  LeaderStatisticsFiltersSchema,
  UpdateGameResultsSchema,
  UpsertGameSchema,
  UpsertGameRecapSchema,
  RoleWithContactSchema,
  VerifyTokenRequestSchema,
  ChangePasswordRequestSchema,
  RoleCheckResponseSchema,
  UpsertHandoutSchema,
  CreatePhotoSubmissionFormSchema,
  PhotoSubmissionRecordSchema,
  PhotoSubmissionDetailSchema,
  PhotoSubmissionListSchema,
  DenyPhotoSubmissionRequestSchema,
  CreatePhotoGalleryAlbumSchema,
  CreatePhotoGalleryPhotoSchema,
  PhotoGalleryAdminAlbumSchema,
  PhotoGalleryAdminAlbumListSchema,
  PhotoGalleryAlbumSchema,
  PhotoGalleryListSchema,
  PhotoGalleryPhotoSchema,
  PhotoGalleryQuerySchema,
  UpdatePhotoGalleryAlbumSchema,
  UpdatePhotoGalleryPhotoSchema,
} from '@draco/shared-schemas';

export const registerSchemaRefs = (registry: OpenAPIRegistry) => {
  const RosterMemberSchemaRef = registry.register('RosterMember', RosterMemberSchema);
  const RosterPlayerSchemaRef = registry.register('RosterPlayer', RosterPlayerSchema);
  const SignRosterMemberSchemaRef = registry.register('SignRosterMember', SignRosterMemberSchema);
  const UpdateRosterMemberSchemaRef = registry.register(
    'UpdateRosterMember',
    UpdateRosterMemberSchema,
  );
  const ContactSchemaRef = registry.register('Contact', ContactSchema);
  const BaseContactSchemaRef = registry.register('BaseContact', BaseContactSchema);
  const NamedContactSchemaRef = registry.register('NamedContact', NamedContactSchema);
  const ContactWithContactRolesSchemaRef = registry.register(
    'ContactWithContactRoles',
    ContactWithContactRolesSchema,
  );
  const FieldSchemaRef = registry.register('Field', FieldSchema);
  const FieldsSchemaRef = registry.register('Fields', FieldsSchema);
  const UpsertFieldSchemaRef = registry.register('UpsertField', UpsertFieldSchema);
  const ContactValidationWithSignInSchemaRef = registry.register(
    'ContactValidationWithSignIn',
    ContactValidationWithSignInSchema,
  );
  const RegisteredUserWithRolesSchemaRef = registry.register(
    'RegisteredUserWithRoles',
    RegisteredUserWithRolesSchema,
  );
  const RegisteredUserSchemaRef = registry.register('RegisteredUser', RegisteredUserSchema);
  const SignInCredentialsSchemaRef = registry.register(
    'SignInCredentials',
    SignInCredentialsSchema,
  );
  const SeasonManagerSchemaRef = registry.register('SeasonManager', SeasonManagerSchema);
  const SeasonManagerListSchemaRef = registry.register(
    'SeasonManagerList',
    SeasonManagerListSchema,
  );
  const SeasonManagerWithLeagueSchemaRef = registry.register(
    'SeasonManagerWithLeague',
    SeasonManagerWithLeagueSchema,
  );
  const SeasonSchemaRef = registry.register('Season', SeasonSchema);
  const CurrentSeasonResponseSchemaRef = registry.register(
    'CurrentSeasonResponse',
    CurrentSeasonResponseSchema,
  );
  const SeasonParticipantCountDataSchemaRef = registry.register(
    'SeasonParticipantCountData',
    SeasonParticipantCountDataSchema,
  );
  const TeamManagerSchemaRef = registry.register('TeamManager', TeamManagerSchema);
  const TeamRosterMembersSchemaRef = registry.register(
    'TeamRosterMembers',
    TeamRosterMembersSchema,
  );
  const TeamSeasonSchemaRef = registry.register('TeamSeason', TeamSeasonSchema);
  const UpsertTeamManagerSchemaRef = registry.register(
    'UpsertTeamManager',
    UpsertTeamManagerSchema,
  );
  const UpsertTeamSeasonSchemaRef = registry.register('UpsertTeamSeason', UpsertTeamSeasonSchema);
  const UpsertTeamSeasonWithLogoSchemaRef = registry.register(
    'UpsertTeamSeasonWithLogo',
    UpsertTeamSeasonSchema.extend({
      logo: z
        .string()
        .openapi({ type: 'string', format: 'binary', description: 'Optional team logo image.' })
        .optional(),
    }),
  );
  const CreateContactSchemaRef = registry.register('CreateContact', CreateContactSchema);
  const CreateContactRoleSchemaRef = registry.register(
    'CreateContactRole',
    CreateContactRoleSchema,
  );
  const EmailComposeSchemaRef = registry.register('EmailCompose', EmailComposeSchema);
  const EmailSendSchemaRef = registry.register('EmailSend', EmailSendSchema);
  const EmailDetailSchemaRef = registry.register('EmailDetail', EmailDetailSchema);
  const EmailListPagedSchemaRef = registry.register('EmailListPaged', EmailListPagedSchema);
  const EmailTemplateSchemaRef = registry.register('EmailTemplate', EmailTemplateSchema);
  const UpsertEmailTemplateSchemaRef = registry.register(
    'UpsertEmailTemplate',
    UpsertEmailTemplateSchema,
  );
  const EmailTemplatesListSchemaRef = registry.register(
    'EmailTemplatesList',
    EmailTemplatesListSchema,
  );
  const AttachmentUploadResultSchemaRef = registry.register(
    'AttachmentUploadResult',
    AttachmentUploadResult,
  );
  const PagedContactSchemaRef = registry.register('PagedContact', PagedContactSchema);
  const ContactRoleSchemaRef = registry.register('ContactRole', ContactRoleSchema);
  const UmpireSchemaRef = registry.register('Umpire', UmpireSchema);
  const UmpiresSchemaRef = registry.register('Umpires', UmpiresSchema);
  const BaseRoleSchemaRef = registry.register('BaseRole', BaseRoleSchema);
  const RoleCheckSchemaRef = registry.register('RoleCheck', RoleCheckSchema);
  const AccountSchemaRef = registry.register('Account', AccountSchema);
  const AccountSearchQuerySchemaRef = registry.register(
    'AccountSearchQuery',
    AccountSearchQuerySchema,
  );
  const AccountDomainLookupHeadersSchemaRef = registry.register(
    'AccountDomainLookupHeaders',
    AccountDomainLookupHeadersSchema,
  );
  const AccountWithSeasonsSchemaRef = registry.register(
    'AccountWithSeasons',
    AccountWithSeasonsSchema,
  );
  const AccountDetailsQuerySchemaRef = registry.register(
    'AccountDetailsQuery',
    AccountDetailsQuerySchema,
  );
  const AutomaticRoleHoldersSchemaRef = registry.register(
    'AutomaticRoleHolders',
    AutomaticRoleHoldersSchema,
  );
  const RoleMetadataSchemaRef = registry.register('RoleMetadata', RoleMetadataSchema);
  const CreateAccountSchemaRef = registry.register('CreateAccount', CreateAccountSchema);
  const AccountNameSchemaRef = registry.register('AccountName', AccountNameSchema);
  const AccountHeaderSchemaRef = registry.register('AccountHeader', AccountHeaderSchema);
  const AccountAffiliationSchemaRef = registry.register(
    'AccountAffiliation',
    AccountAffiliationSchema,
  );
  const AccountTypeSchemaRef = registry.register('AccountType', AccountTypeSchema);
  const AccountUrlSchemaRef = registry.register('AccountUrl', AccountUrlSchema);
  const CreateAccountUrlSchemaRef = registry.register('CreateAccountUrl', CreateAccountUrlSchema);
  const AccountTwitterSettingsSchemaRef = registry.register(
    'AccountTwitterSettings',
    AccountTwitterSettingsSchema,
  );
  const SponsorSchemaRef = registry.register('Sponsor', SponsorSchema);
  const SponsorListSchemaRef = registry.register('SponsorList', SponsorListSchema);
  const CreateSponsorSchemaRef = registry.register('CreateSponsor', CreateSponsorSchema);
  const MemberBusinessSchemaRef = registry.register('MemberBusiness', MemberBusinessSchema);
  const MemberBusinessListSchemaRef = registry.register(
    'MemberBusinessList',
    MemberBusinessListSchema,
  );
  const CreateMemberBusinessSchemaRef = registry.register(
    'CreateMemberBusiness',
    CreateMemberBusinessSchema,
  );
  const MemberBusinessQueryParamsSchemaRef = registry.register(
    'MemberBusinessQueryParams',
    MemberBusinessQueryParamsSchema,
  );
  const PlayersWantedClassifiedSchemaRef = registry.register(
    'PlayersWantedClassified',
    PlayersWantedClassifiedSchema,
  );
  const PlayersWantedClassifiedPagedSchemaRef = registry.register(
    'PlayersWantedClassifiedPaged',
    PlayersWantedClassifiedPagedSchema,
  );
  const UpsertPlayersWantedClassifiedSchemaRef = registry.register(
    'UpsertPlayersWantedClassified',
    UpsertPlayersWantedClassifiedSchema,
  );
  const PlayerClassifiedSearchQuerySchemaRef = registry.register(
    'PlayerClassifiedSearchQuery',
    PlayerClassifiedSearchQuerySchema,
  );
  const TeamsWantedPublicClassifiedPagedSchemaRef = registry.register(
    'TeamsWantedPublicClassifiedPaged',
    TeamsWantedPublicClassifiedPagedSchema,
  );
  const TeamsWantedOwnerClassifiedSchemaRef = registry.register(
    'TeamsWantedOwnerClassified',
    TeamsWantedOwnerClassifiedSchema,
  );
  const UpsertTeamsWantedClassifiedSchemaRef = registry.register(
    'UpsertTeamsWantedClassified',
    UpsertTeamsWantedClassifiedSchema,
  );
  const TeamsWantedAccessCodeSchemaRef = registry.register(
    'TeamsWantedAccessCode',
    TeamsWantedAccessCodeSchema,
  );
  const TeamsWantedContactInfoSchemaRef = registry.register(
    'TeamsWantedContactInfo',
    TeamsWantedContactInfoSchema,
  );
  const TeamsWantedContactQuerySchemaRef = registry.register(
    'TeamsWantedContactQuery',
    TeamsWantedContactQuerySchema,
  );
  const StandingsLeagueSchemaRef = registry.register('StandingsLeague', StandingsLeagueSchema);
  const StandingsTeamSchemaRef = registry.register('StandingsTeam', StandingsTeamSchema);
  const TeamSeasonRecordSchemaRef = registry.register('TeamSeasonRecord', TeamSeasonRecordSchema);
  const SeasonStandingsResponseSchemaRef = registry.registerComponent(
    'schemas',
    'SeasonStandingsResponse',
    {
      oneOf: [
        {
          type: 'array',
          items: {
            $ref: '#/components/schemas/StandingsLeague',
          },
        },
        {
          type: 'array',
          items: {
            $ref: '#/components/schemas/StandingsTeam',
          },
        },
      ],
    },
  ).ref;
  const ContactPlayersWantedCreatorSchemaRef = registry.register(
    'ContactPlayersWantedCreator',
    ContactPlayersWantedCreatorSchema,
  );
  const ContactSearchParamsSchemaRef = registry.register(
    'ContactSearchParams',
    ContactSearchParamsSchema,
  );
  const PlayerBattingStatsSchemaRef = registry.register(
    'PlayerBattingStats',
    PlayerBattingStatsSchema,
  );
  const PlayerBattingStatsBriefSchemaRef = registry.register(
    'PlayerBattingStatsBrief',
    PlayerBattingStatsBriefSchema,
  );
  const PlayerPitchingStatsSchemaRef = registry.register(
    'PlayerPitchingStats',
    PlayerPitchingStatsSchema,
  );
  const PlayerPitchingStatsBriefSchemaRef = registry.register(
    'PlayerPitchingStatsBrief',
    PlayerPitchingStatsBriefSchema,
  );
  const PlayerCareerStatisticsSchemaRef = registry.register(
    'PlayerCareerStatistics',
    PlayerCareerStatisticsSchema,
  );
  const PublicContactSummarySchemaRef = registry.register(
    'PublicContactSummary',
    PublicContactSummarySchema,
  );
  const PublicContactSearchResponseSchemaRef = registry.register(
    'PublicContactSearchResponse',
    PublicContactSearchResponseSchema,
  );
  const PublicContactSearchQuerySchemaRef = registry.register(
    'PublicContactSearchQuery',
    PublicContactSearchQuerySchema,
  );
  const TeamStatsPlayerSummarySchemaRef = registry.register(
    'TeamStatsPlayerSummary',
    TeamStatsPlayerSummarySchema,
  );
  const GameBattingStatLineSchemaRef = registry.register(
    'GameBattingStatLine',
    GameBattingStatLineSchema,
  );
  const GameBattingStatsSchemaRef = registry.register('GameBattingStats', GameBattingStatsSchema);
  const GamePitchingStatLineSchemaRef = registry.register(
    'GamePitchingStatLine',
    GamePitchingStatLineSchema,
  );
  const GamePitchingStatsSchemaRef = registry.register(
    'GamePitchingStats',
    GamePitchingStatsSchema,
  );
  const CreateGameBattingStatSchemaRef = registry.register(
    'CreateGameBattingStat',
    CreateGameBattingStatSchema,
  );
  const UpdateGameBattingStatSchemaRef = registry.register(
    'UpdateGameBattingStat',
    UpdateGameBattingStatSchema,
  );
  const CreateGamePitchingStatSchemaRef = registry.register(
    'CreateGamePitchingStat',
    CreateGamePitchingStatSchema,
  );
  const UpdateGamePitchingStatSchemaRef = registry.register(
    'UpdateGamePitchingStat',
    UpdateGamePitchingStatSchema,
  );
  const TeamCompletedGameSchemaRef = registry.register(
    'TeamCompletedGame',
    TeamCompletedGameSchema,
  );
  const TeamCompletedGamesSchemaRef = registry.register(
    'TeamCompletedGames',
    TeamCompletedGamesSchema,
  );
  const GameAttendanceSchemaRef = registry.register('GameAttendance', GameAttendanceSchema);
  const UpdateGameAttendanceSchemaRef = registry.register(
    'UpdateGameAttendance',
    UpdateGameAttendanceSchema,
  );
  const BattingStatisticsFiltersSchemaRef = registry.register(
    'BattingStatisticsFilters',
    BattingStatisticsFiltersSchema,
  );
  const PitchingStatisticsFiltersSchemaRef = registry.register(
    'PitchingStatisticsFilters',
    PitchingStatisticsFiltersSchema,
  );
  const LeaderStatisticsFiltersSchemaRef = registry.register(
    'LeaderStatisticsFilters',
    LeaderStatisticsFiltersSchema,
  );
  const LeaderRowSchemaRef = registry.register('LeaderRow', LeaderRowSchema);
  const LeaderCategoriesSchemaRef = registry.register('LeaderCategories', LeaderCategoriesSchema);
  const RecentGamesQuerySchemaRef = registry.register('RecentGamesQuery', RecentGamesQuerySchema);
  const BaseballPositionSchemaRef = registry.register('BaseballPosition', BaseballPositionSchema);
  const ExperienceLevelSchemaRef = registry.register('ExperienceLevel', ExperienceLevelSchema);
  const AccountPollSchemaRef = registry.register('AccountPoll', AccountPollSchema);
  const CreatePollSchemaRef = registry.register('CreatePoll', CreatePollSchema);
  const UpdatePollSchemaRef = registry.register('UpdatePoll', UpdatePollSchema);
  const PollVoteRequestSchemaRef = registry.register('PollVoteRequest', PollVoteRequestSchema);
  const HofContactSummarySchemaRef = registry.register(
    'HofContactSummary',
    HofContactSummarySchema,
  );
  const HofMemberSchemaRef = registry.register('HofMember', HofMemberSchema);
  const HofClassSummarySchemaRef = registry.register('HofClassSummary', HofClassSummarySchema);
  const HofClassWithMembersSchemaRef = registry.register(
    'HofClassWithMembers',
    HofClassWithMembersSchema,
  );
  const HofEligibleContactsQuerySchemaRef = registry.register(
    'HofEligibleContactsQuery',
    HofEligibleContactsQuerySchema,
  );
  const HofEligibleContactsResponseSchemaRef = registry.register(
    'HofEligibleContactsResponse',
    HofEligibleContactsResponseSchema,
  );
  const CreateHofMemberSchemaRef = registry.register('CreateHofMember', CreateHofMemberSchema);
  const UpdateHofMemberSchemaRef = registry.register('UpdateHofMember', UpdateHofMemberSchema);
  const SubmitHofNominationSchemaRef = registry.register(
    'SubmitHofNomination',
    SubmitHofNominationSchema,
  );
  const UpdateHofNominationSchemaRef = registry.register(
    'UpdateHofNomination',
    UpdateHofNominationSchema,
  );
  const HofNominationSchemaRef = registry.register('HofNomination', HofNominationSchema);
  const HofNominationListSchemaRef = registry.register(
    'HofNominationList',
    HofNominationListSchema,
  );
  const HofNominationQuerySchemaRef = registry.register(
    'HofNominationQuery',
    HofNominationQuerySchema,
  );
  const HofNominationSetupSchemaRef = registry.register(
    'HofNominationSetup',
    HofNominationSetupSchema,
  );
  const HofNominationInductSchemaRef = registry.register(
    'HofNominationInduct',
    HofNominationInductSchema,
  );
  const UpdateHofNominationSetupSchemaRef = registry.register(
    'UpdateHofNominationSetup',
    UpdateHofNominationSetupSchema,
  );
  const WorkoutSummarySchemaRef = registry.register('WorkoutSummary', WorkoutSummarySchema);
  const WorkoutSchemaRef = registry.register('Workout', WorkoutSchema);
  const UpsertWorkoutSchemaRef = registry.register('UpsertWorkout', UpsertWorkoutSchema);
  const WorkoutRegistrationSchemaRef = registry.register(
    'WorkoutRegistration',
    WorkoutRegistrationSchema,
  );
  const WorkoutRegistrationsSchemaRef = registry.register(
    'WorkoutRegistrations',
    WorkoutRegistrationsSchema,
  );
  const UpsertWorkoutRegistrationSchemaRef = registry.register(
    'WorkoutRegistrationUpsert',
    UpsertWorkoutRegistrationSchema,
  );
  const WorkoutSourcesSchemaRef = registry.register('WorkoutSources', WorkoutSourcesSchema);
  const WorkoutSourceOptionPayloadSchemaRef = registry.register(
    'WorkoutSourceOptionPayload',
    WorkoutSourceOptionPayloadSchema,
  );
  const WorkoutListQuerySchemaRef = registry.register('WorkoutListQuery', WorkoutListQuerySchema);
  const WorkoutRegistrationsQuerySchemaRef = registry.register(
    'WorkoutRegistrationsQuery',
    WorkoutRegistrationsQuerySchema,
  );
  const WorkoutRegistrationsEmailRequestSchemaRef = registry.register(
    'WorkoutRegistrationsEmailRequest',
    WorkoutRegistrationsEmailRequestSchema,
  );
  const DivisionSeasonSchemaRef = registry.register('DivisionSeason', DivisionSeasonSchema);
  const DivisionSeasonWithTeamsSchemaRef = registry.register(
    'DivisionSeasonWithTeams',
    DivisionSeasonWithTeamsSchema,
  );
  const LeagueSeasonQueryParamsSchemaRef = registry.register(
    'LeagueSeasonQueryParams',
    LeagueSeasonQueryParamsSchema,
  );
  const LeagueSeasonSchemaRef = registry.register('LeagueSeason', LeagueSeasonSchema);
  const LeagueSeasonWithDivisionSchemaRef = registry.register(
    'LeagueSeasonWithDivision',
    LeagueSeasonWithDivisionSchema,
  );
  const LeagueSeasonWithDivisionTeamsAndUnassignedSchemaRef = registry.register(
    'LeagueSeasonWithDivisionTeamsAndUnassigned',
    LeagueSeasonWithDivisionTeamsAndUnassignedSchema,
  );
  const LeagueSetupSchemaRef = registry.register('LeagueSetup', LeagueSetupSchema);
  const LeagueSchemaRef = registry.register('League', LeagueSchema);
  const UpsertLeagueSchemaRef = registry.register('UpsertLeague', UpsertLeagueSchema);
  const GameSchemaRef = registry.register('Game', GameSchema);
  const GameResultSchemaRef = registry.register('GameResult', GameResultSchema);
  const RecentGamesSchemaRef = registry.register('RecentGames', RecentGamesSchema);
  const GamesWithRecapsSchemaRef = registry.register('GamesWithRecaps', GamesWithRecapsSchema);
  const HandoutSchemaRef = registry.register('Handout', HandoutSchema);
  const HandoutListSchemaRef = registry.register('HandoutList', HandoutListSchema);
  const UpsertHandoutSchemaRef = registry.register('UpsertHandout', UpsertHandoutSchema);
  const CreatePhotoGalleryPhotoSchemaRef = registry.register(
    'CreatePhotoGalleryPhoto',
    CreatePhotoGalleryPhotoSchema,
  );
  const UpdatePhotoGalleryPhotoSchemaRef = registry.register(
    'UpdatePhotoGalleryPhoto',
    UpdatePhotoGalleryPhotoSchema,
  );
  const PhotoGalleryPhotoSchemaRef = registry.register(
    'PhotoGalleryPhoto',
    PhotoGalleryPhotoSchema,
  );
  const CreatePhotoGalleryAlbumSchemaRef = registry.register(
    'CreatePhotoGalleryAlbum',
    CreatePhotoGalleryAlbumSchema,
  );
  const UpdatePhotoGalleryAlbumSchemaRef = registry.register(
    'UpdatePhotoGalleryAlbum',
    UpdatePhotoGalleryAlbumSchema,
  );
  const PhotoGalleryAlbumSchemaRef = registry.register(
    'PhotoGalleryAlbum',
    PhotoGalleryAlbumSchema,
  );
  const PhotoGalleryAdminAlbumSchemaRef = registry.register(
    'PhotoGalleryAdminAlbum',
    PhotoGalleryAdminAlbumSchema,
  );
  const PhotoGalleryAdminAlbumListSchemaRef = registry.register(
    'PhotoGalleryAdminAlbumList',
    PhotoGalleryAdminAlbumListSchema,
  );
  const PhotoGalleryListSchemaRef = registry.register('PhotoGalleryList', PhotoGalleryListSchema);
  const PhotoGalleryQuerySchemaRef = registry.register(
    'PhotoGalleryQuery',
    PhotoGalleryQuerySchema,
  );
  const PhotoSubmissionSchemaRef = registry.register(
    'PhotoSubmission',
    PhotoSubmissionRecordSchema,
  );
  const PhotoSubmissionDetailSchemaRef = registry.register(
    'PhotoSubmissionDetail',
    PhotoSubmissionDetailSchema,
  );
  const PhotoSubmissionListSchemaRef = registry.register(
    'PhotoSubmissionList',
    PhotoSubmissionListSchema,
  );
  const CreatePhotoSubmissionFormSchemaRef = registry.register(
    'CreatePhotoSubmissionForm',
    CreatePhotoSubmissionFormSchema,
  );
  const DenyPhotoSubmissionRequestSchemaRef = registry.register(
    'DenyPhotoSubmissionRequest',
    DenyPhotoSubmissionRequestSchema,
  );
  const UpdateGameResultsSchemaRef = registry.register(
    'UpdateGameResults',
    UpdateGameResultsSchema,
  );
  const UpsertGameSchemaRef = registry.register('UpsertGame', UpsertGameSchema);
  const UpsertGameRecapSchemaRef = registry.register('UpsertGameRecap', UpsertGameRecapSchema);
  const UpsertSeasonSchemaRef = registry.register('UpsertSeason', UpsertSeasonSchema);
  const UpsertDivisionSeasonSchemaRef = registry.register(
    'UpsertDivisionSeason',
    UpsertDivisionSeasonSchema,
  );

  const ValidationErrorSchemaRef = registry.register('ValidationError', ValidationErrorSchema);
  const AuthenticationErrorSchemaRef = registry.register(
    'AuthenticationError',
    AuthenticationErrorSchema,
  );
  const AuthorizationErrorSchemaRef = registry.register(
    'AuthorizationError',
    AuthorizationErrorSchema,
  );
  const NotFoundErrorSchemaRef = registry.register('NotFoundError', NotFoundErrorSchema);
  const ConflictErrorSchemaRef = registry.register('ConflictError', ConflictErrorSchema);
  const InternalServerErrorSchemaRef = registry.register(
    'InternalServerError',
    InternalServerErrorSchema,
  );
  const PagingSchemaRef = registry.register('Paging', PagingSchema);
  const RoleWithContactSchemaRef = registry.register('RoleWithContact', RoleWithContactSchema);
  const VerifyTokenRequestSchemaRef = registry.register(
    'VerifyTokenRequest',
    VerifyTokenRequestSchema,
  );
  const ChangePasswordRequestSchemaRef = registry.register(
    'ChangePasswordRequest',
    ChangePasswordRequestSchema,
  );
  const RoleCheckResponseSchemaRef = registry.register(
    'RoleCheckResponse',
    RoleCheckResponseSchema,
  );
  const ContactValidationSchemaRef = registry.register(
    'ContactValidation',
    ContactValidationSchema,
  );
  return {
    RosterMemberSchemaRef,
    RosterPlayerSchemaRef,
    SignRosterMemberSchemaRef,
    UpdateRosterMemberSchemaRef,
    ContactSchemaRef,
    BaseContactSchemaRef,
    NamedContactSchemaRef,
    ContactWithContactRolesSchemaRef,
    FieldSchemaRef,
    FieldsSchemaRef,
    UpsertFieldSchemaRef,
    SeasonManagerSchemaRef,
    SeasonManagerListSchemaRef,
    SeasonManagerWithLeagueSchemaRef,
    SeasonSchemaRef,
    CurrentSeasonResponseSchemaRef,
    SeasonParticipantCountDataSchemaRef,
    TeamManagerSchemaRef,
    TeamRosterMembersSchemaRef,
    TeamSeasonSchemaRef,
    UpsertTeamManagerSchemaRef,
    UpsertTeamSeasonSchemaRef,
    UpsertTeamSeasonWithLogoSchemaRef,
    CreateContactSchemaRef,
    CreateContactRoleSchemaRef,
    EmailComposeSchemaRef,
    EmailSendSchemaRef,
    EmailDetailSchemaRef,
    EmailListPagedSchemaRef,
    EmailTemplateSchemaRef,
    UpsertEmailTemplateSchemaRef,
    EmailTemplatesListSchemaRef,
    AttachmentUploadResultSchemaRef,
    ContactRoleSchemaRef,
    UmpireSchemaRef,
    UmpiresSchemaRef,
    BaseRoleSchemaRef,
    RoleCheckSchemaRef,
    RegisteredUserSchemaRef,
    RegisteredUserWithRolesSchemaRef,
    SignInCredentialsSchemaRef,
    ContactValidationWithSignInSchemaRef,
    ContactValidationSchemaRef,
    PagedContactSchemaRef,
    AccountSchemaRef,
    AccountSearchQuerySchemaRef,
    AccountDomainLookupHeadersSchemaRef,
    AccountWithSeasonsSchemaRef,
    AccountDetailsQuerySchemaRef,
    CreateAccountSchemaRef,
    AccountNameSchemaRef,
    AccountHeaderSchemaRef,
    AccountAffiliationSchemaRef,
    AccountTypeSchemaRef,
    AccountUrlSchemaRef,
    CreateAccountUrlSchemaRef,
    AccountTwitterSettingsSchemaRef,
    AutomaticRoleHoldersSchemaRef,
    RoleMetadataSchemaRef,
    SponsorSchemaRef,
    SponsorListSchemaRef,
    CreateSponsorSchemaRef,
    MemberBusinessSchemaRef,
    MemberBusinessListSchemaRef,
    CreateMemberBusinessSchemaRef,
    MemberBusinessQueryParamsSchemaRef,
    PlayersWantedClassifiedSchemaRef,
    PlayersWantedClassifiedPagedSchemaRef,
    UpsertPlayersWantedClassifiedSchemaRef,
    PlayerClassifiedSearchQuerySchemaRef,
    TeamsWantedPublicClassifiedPagedSchemaRef,
    TeamsWantedOwnerClassifiedSchemaRef,
    UpsertTeamsWantedClassifiedSchemaRef,
    TeamsWantedAccessCodeSchemaRef,
    TeamsWantedContactInfoSchemaRef,
    TeamsWantedContactQuerySchemaRef,
    StandingsLeagueSchemaRef,
    StandingsTeamSchemaRef,
    TeamSeasonRecordSchemaRef,
    SeasonStandingsResponseSchemaRef,
    ContactPlayersWantedCreatorSchemaRef,
    BaseballPositionSchemaRef,
    ExperienceLevelSchemaRef,
    AccountPollSchemaRef,
    CreatePollSchemaRef,
    UpdatePollSchemaRef,
    PollVoteRequestSchemaRef,
    HofContactSummarySchemaRef,
    HofMemberSchemaRef,
    HofClassSummarySchemaRef,
    HofClassWithMembersSchemaRef,
    HofEligibleContactsQuerySchemaRef,
    HofEligibleContactsResponseSchemaRef,
    CreateHofMemberSchemaRef,
    UpdateHofMemberSchemaRef,
    SubmitHofNominationSchemaRef,
    UpdateHofNominationSchemaRef,
    HofNominationSchemaRef,
    HofNominationQuerySchemaRef,
    HofNominationListSchemaRef,
    HofNominationSetupSchemaRef,
    HofNominationInductSchemaRef,
    UpdateHofNominationSetupSchemaRef,
    WorkoutSummarySchemaRef,
    WorkoutSchemaRef,
    UpsertWorkoutSchemaRef,
    WorkoutRegistrationSchemaRef,
    WorkoutRegistrationsSchemaRef,
    UpsertWorkoutRegistrationSchemaRef,
    WorkoutSourcesSchemaRef,
    WorkoutSourceOptionPayloadSchemaRef,
    WorkoutListQuerySchemaRef,
    WorkoutRegistrationsQuerySchemaRef,
    WorkoutRegistrationsEmailRequestSchemaRef,
    DivisionSeasonSchemaRef,
    DivisionSeasonWithTeamsSchemaRef,
    LeagueSeasonQueryParamsSchemaRef,
    LeagueSeasonSchemaRef,
    LeagueSeasonWithDivisionSchemaRef,
    LeagueSeasonWithDivisionTeamsAndUnassignedSchemaRef,
    LeagueSetupSchemaRef,
    LeagueSchemaRef,
    UpsertLeagueSchemaRef,
    GameSchemaRef,
    GameResultSchemaRef,
    RecentGamesSchemaRef,
    GamesWithRecapsSchemaRef,
    HandoutSchemaRef,
    HandoutListSchemaRef,
    UpsertHandoutSchemaRef,
    CreatePhotoGalleryPhotoSchemaRef,
    UpdatePhotoGalleryPhotoSchemaRef,
    PhotoGalleryPhotoSchemaRef,
    CreatePhotoGalleryAlbumSchemaRef,
    UpdatePhotoGalleryAlbumSchemaRef,
    PhotoGalleryAlbumSchemaRef,
    PhotoGalleryAdminAlbumSchemaRef,
    PhotoGalleryAdminAlbumListSchemaRef,
    PhotoGalleryListSchemaRef,
    PhotoGalleryQuerySchemaRef,
    UpdateGameResultsSchemaRef,
    UpsertGameSchemaRef,
    UpsertGameRecapSchemaRef,
    UpsertSeasonSchemaRef,
    UpsertDivisionSeasonSchemaRef,
    ValidationErrorSchemaRef,
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    NotFoundErrorSchemaRef,
    ConflictErrorSchemaRef,
    InternalServerErrorSchemaRef,
    PagingSchemaRef,
    ContactSearchParamsSchemaRef,
    PhotoSubmissionSchemaRef,
    PhotoSubmissionDetailSchemaRef,
    PhotoSubmissionListSchemaRef,
    CreatePhotoSubmissionFormSchemaRef,
    DenyPhotoSubmissionRequestSchemaRef,
    PlayerBattingStatsSchemaRef,
    PlayerBattingStatsBriefSchemaRef,
    PlayerPitchingStatsSchemaRef,
    PlayerPitchingStatsBriefSchemaRef,
    PlayerCareerStatisticsSchemaRef,
    PublicContactSummarySchemaRef,
    PublicContactSearchResponseSchemaRef,
    PublicContactSearchQuerySchemaRef,
    TeamStatsPlayerSummarySchemaRef,
    GameBattingStatLineSchemaRef,
    GameBattingStatsSchemaRef,
    GamePitchingStatLineSchemaRef,
    GamePitchingStatsSchemaRef,
    CreateGameBattingStatSchemaRef,
    UpdateGameBattingStatSchemaRef,
    CreateGamePitchingStatSchemaRef,
    UpdateGamePitchingStatSchemaRef,
    TeamCompletedGameSchemaRef,
    TeamCompletedGamesSchemaRef,
    GameAttendanceSchemaRef,
    UpdateGameAttendanceSchemaRef,
    BattingStatisticsFiltersSchemaRef,
    PitchingStatisticsFiltersSchemaRef,
    LeaderStatisticsFiltersSchemaRef,
    LeaderRowSchemaRef,
    LeaderCategoriesSchemaRef,
    RecentGamesQuerySchemaRef,
    RoleWithContactSchemaRef,
    VerifyTokenRequestSchemaRef,
    ChangePasswordRequestSchemaRef,
    RoleCheckResponseSchemaRef,
  };
};

export type SchemaRefs = ReturnType<typeof registerSchemaRefs>;

export type RegisterContext = {
  registry: OpenAPIRegistry;
  schemaRefs: SchemaRefs;
  z: (typeof import('zod'))['z'];
};
