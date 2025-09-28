import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
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
  BaseballPositionSchema,
  ConflictErrorSchema,
  ContactPlayersWantedCreatorSchema,
  ContactSchema,
  ContactRoleSchema,
  BaseContactSchema,
  ContactValidationWithSignInSchema,
  RegisteredUserSchema,
  CreateAccountSchema,
  CreateContactSchema,
  CreateContactRoleSchema,
  CreatePollSchema,
  CreateSponsorSchema,
  CreateTeamManagerSchema,
  UpdatePollSchema,
  ExperienceLevelSchema,
  InternalServerErrorSchema,
  NotFoundErrorSchema,
  PlayerClassifiedSearchQuerySchema,
  PlayersWantedClassifiedPagedSchema,
  PlayersWantedClassifiedSchema,
  PollVoteRequestSchema,
  RosterMemberSchema,
  RosterPlayerSchema,
  SignRosterMemberSchema,
  SponsorListSchema,
  SponsorSchema,
  TeamManagerSchema,
  TeamsWantedAccessCodeSchema,
  TeamsWantedContactInfoSchema,
  TeamsWantedContactQuerySchema,
  TeamsWantedOwnerClassifiedSchema,
  TeamsWantedPublicClassifiedPagedSchema,
  UpsertPlayersWantedClassifiedSchema,
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
} from '@draco/shared-schemas';

export const registerSchemaRefs = (registry: OpenAPIRegistry) => {
  const RosterMemberSchemaRef = registry.register('RosterMember', RosterMemberSchema);
  const RosterPlayerSchemaRef = registry.register('RosterPlayer', RosterPlayerSchema);
  const SignRosterMemberSchemaRef = registry.register('SignRosterMember', SignRosterMemberSchema);
  const ContactSchemaRef = registry.register('Contact', ContactSchema);
  const BaseContactSchemaRef = registry.register('BaseContact', BaseContactSchema);
  const ContactValidationWithSignInSchemaRef = registry.register(
    'ContactValidationWithSignIn',
    ContactValidationWithSignInSchema,
  );
  const RegisteredUserSchemaRef = registry.register('RegisteredUser', RegisteredUserSchema);
  const TeamManagerSchemaRef = registry.register('TeamManager', TeamManagerSchema);
  const CreateTeamManagerSchemaRef = registry.register(
    'CreateTeamManager',
    CreateTeamManagerSchema,
  );
  const CreateContactSchemaRef = registry.register('CreateContact', CreateContactSchema);
  const CreateContactRoleSchemaRef = registry.register(
    'CreateContactRole',
    CreateContactRoleSchema,
  );
  const PagedContactSchemaRef = registry.register('PagedContact', PagedContactSchema);
  const ContactRoleSchemaRef = registry.register('ContactRole', ContactRoleSchema);
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
  const ContactPlayersWantedCreatorSchemaRef = registry.register(
    'ContactPlayersWantedCreator',
    ContactPlayersWantedCreatorSchema,
  );
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
  return {
    RosterMemberSchemaRef,
    RosterPlayerSchemaRef,
    SignRosterMemberSchemaRef,
    ContactSchemaRef,
    BaseContactSchemaRef,
    TeamManagerSchemaRef,
    CreateTeamManagerSchemaRef,
    CreateContactSchemaRef,
    CreateContactRoleSchemaRef,
    ContactRoleSchemaRef,
    RegisteredUserSchemaRef,
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
    ValidationErrorSchemaRef,
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    NotFoundErrorSchemaRef,
    ConflictErrorSchemaRef,
    InternalServerErrorSchemaRef,
    PagingSchemaRef,
  };
};

export type SchemaRefs = ReturnType<typeof registerSchemaRefs>;

export type RegisterContext = {
  registry: OpenAPIRegistry;
  schemaRefs: SchemaRefs;
  z: (typeof import('zod'))['z'];
};
