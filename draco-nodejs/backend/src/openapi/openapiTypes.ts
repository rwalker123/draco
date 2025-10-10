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
  SignInCredentialsSchema,
  RegisteredUserWithRolesSchema,
  RegisteredUserSchema,
  CreateAccountSchema,
  CreateContactSchema,
  CreateContactRoleSchema,
  CreatePollSchema,
  CreateSponsorSchema,
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
  PlayerPitchingStatsSchema,
  PlayerPitchingStatsBriefSchema,
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
  RosterMemberSchema,
  RosterPlayerSchema,
  SignRosterMemberSchema,
  SponsorListSchema,
  SponsorSchema,
  SeasonManagerListSchema,
  SeasonManagerSchema,
  SeasonManagerWithLeagueSchema,
  SeasonParticipantCountDataSchema,
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
  UpsertWorkoutSchema,
  ValidationErrorSchema,
  PagedContactSchema,
  PagingSchema,
  WorkoutListQuerySchema,
  WorkoutRegistrationSchema,
  WorkoutRegistrationsQuerySchema,
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
} from '@draco/shared-schemas';

export const registerSchemaRefs = (registry: OpenAPIRegistry) => {
  const RosterMemberSchemaRef = registry.register('RosterMember', RosterMemberSchema);
  const RosterPlayerSchemaRef = registry.register('RosterPlayer', RosterPlayerSchema);
  const SignRosterMemberSchemaRef = registry.register('SignRosterMember', SignRosterMemberSchema);
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
  return {
    RosterMemberSchemaRef,
    RosterPlayerSchemaRef,
    SignRosterMemberSchemaRef,
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
    PlayerBattingStatsSchemaRef,
    PlayerBattingStatsBriefSchemaRef,
    PlayerPitchingStatsSchemaRef,
    PlayerPitchingStatsBriefSchemaRef,
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
