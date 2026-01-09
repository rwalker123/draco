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
  AccountBlueskySettingsSchema,
  AccountInstagramSettingsSchema,
  AccountTwitterSettingsSchema,
  AccountTwitterAuthorizationUrlSchema,
  AccountTwitterOAuthStartSchema,
  AccountFacebookCredentialsSchema,
  AccountFacebookOAuthStartSchema,
  AccountFacebookAuthorizationUrlSchema,
  FacebookPageListSchema,
  FacebookPageSelectionSchema,
  FacebookConnectionStatusSchema,
  AccountSettingsStateListSchema,
  AccountSettingStateSchema,
  AccountSettingUpdateRequestSchema,
  AccountSettingKeySchema,
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
  HofRandomMembersQuerySchema,
  HofNominationQuerySchema,
  PlayerCareerStatisticsSchema,
  PlayerPitchingStatsSchema,
  PlayerPitchingStatsBriefSchema,
  PlayerSurveyAnswerSchema,
  PlayerSurveyAnswerUpsertSchema,
  PublicContactSummarySchema,
  PublicContactSearchResponseSchema,
  PublicContactSearchQuerySchema,
  PlayerSurveyCategorySchema,
  PlayerSurveyDetailSchema,
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
  PlayerSurveyListQuerySchema,
  PlayerSurveySummaryListResponseSchema,
  PlayerSurveyQuestionSchema,
  RecentGamesQuerySchema,
  RecentGamesSchema,
  UmpireSchema,
  UmpiresSchema,
  CreateUmpireSchema,
  RoleCheckSchema,
  RoleMetadataSchema,
  SubmitHofNominationSchema,
  PublicRosterMemberSchema,
  TeamRosterCardSchema,
  RosterCardPlayerSchema,
  PublicTeamRosterResponseSchema,
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
  SeasonCopyResponseSchema,
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
  WorkoutRegistrationAccessCodeSchema,
  UpdateHofNominationSchema,
  UpdateHofNominationSetupSchema,
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
  DiscordAccountConfigSchema,
  DiscordAccountConfigUpdateSchema,
  DiscordChannelMappingSchema,
  DiscordChannelMappingListSchema,
  DiscordChannelMappingCreateSchema,
  DiscordGuildChannelSchema,
  DiscordLinkStatusSchema,
  DiscordOAuthStartResponseSchema,
  DiscordRoleMappingSchema,
  DiscordRoleMappingListSchema,
  DiscordRoleMappingUpdateSchema,
  DiscordFeatureSyncStatusSchema,
  DiscordFeatureSyncUpdateSchema,
  DiscordTeamForumListSchema,
  DiscordTeamForumQuerySchema,
  DiscordTeamForumRepairResultSchema,
  DiscordTeamForumRemoveRequestSchema,
  DiscordFeatureSyncFeatureEnum,
  WorkoutSourcesSchema,
  WorkoutSummarySchema,
  ContactSearchParamsSchema,
  DivisionSeasonSchema,
  DivisionSeasonWithTeamsSchema,
  UpdateDivisionSeasonResponseSchema,
  LeagueSchema,
  LeagueFaqListSchema,
  LeagueFaqSchema,
  LeagueSeasonQueryParamsSchema,
  LeagueSeasonSchema,
  LeagueSeasonWithDivisionSchema,
  LeagueSeasonWithDivisionTeamsAndUnassignedSchema,
  LeagueSetupSchema,
  UpsertDivisionSeasonSchema,
  UpsertLeagueSchema,
  UpsertLeagueFaqSchema,
  UpsertSeasonSchema,
  GameSchema,
  GameResultSchema,
  GamesWithRecapsSchema,
  HandoutListSchema,
  HandoutSchema,
  AlertListSchema,
  AlertSchema,
  AnnouncementListSchema,
  AnnouncementSchema,
  UpsertAlertSchema,
  UpsertAnnouncementSchema,
  LeaderCategoriesSchema,
  LeaderRowSchema,
  LeaderStatisticsFiltersSchema,
  UpdateGameResultsSchema,
  UpsertGameSchema,
  UpsertGameRecapSchema,
  CreatePlayerSurveyCategorySchema,
  UpdatePlayerSurveyCategorySchema,
  CreatePlayerSurveyQuestionSchema,
  UpdatePlayerSurveyQuestionSchema,
  PlayerSurveySpotlightSchema,
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
  SocialFeedItemSchema,
  SocialFeedListSchema,
  SocialFeedQuerySchema,
  SocialVideoSchema,
  SocialVideoListSchema,
  SocialVideoQuerySchema,
  CommunityMessagePreviewSchema,
  CommunityMessageListSchema,
  CommunityMessageQuerySchema,
  CommunityChannelQuerySchema,
  CommunityChannelSchema,
  CommunityChannelListSchema,
  LiveEventSchema,
  LiveEventListSchema,
  LiveEventQuerySchema,
  LiveEventCreateSchema,
  LiveEventUpdateSchema,
  WelcomeMessageSchema,
  WelcomeMessageListSchema,
  UpsertWelcomeMessageSchema,
  AutoRegisterContactResponseSchema,
  SchedulerProblemSpecSchema,
  SchedulerProblemSpecPreviewSchema,
  SchedulerSeasonSolveRequestSchema,
  SchedulerSeasonApplyRequestSchema,
  SchedulerSolveResultSchema,
  SchedulerApplyRequestSchema,
  SchedulerApplyResultSchema,
  SchedulerFieldAvailabilityRuleSchema,
  SchedulerFieldAvailabilityRuleUpsertSchema,
  SchedulerFieldAvailabilityRulesSchema,
  SchedulerFieldExclusionDateSchema,
  SchedulerFieldExclusionDateUpsertSchema,
  SchedulerFieldExclusionDatesSchema,
  SchedulerSeasonWindowConfigSchema,
  SchedulerSeasonWindowConfigUpsertSchema,
  SchedulerSeasonExclusionSchema,
  SchedulerSeasonExclusionUpsertSchema,
  SchedulerSeasonExclusionsSchema,
  SchedulerTeamExclusionSchema,
  SchedulerTeamExclusionUpsertSchema,
  SchedulerTeamExclusionsSchema,
  SchedulerUmpireExclusionSchema,
  SchedulerUmpireExclusionUpsertSchema,
  SchedulerUmpireExclusionsSchema,
  AdminDashboardSummarySchema,
  GolfCourseSchema,
  GolfCourseWithTeesSchema,
  GolfCourseTeeSchema,
  GolfLeagueCourseSchema,
  CreateGolfCourseSchema,
  UpdateGolfCourseSchema,
  CreateGolfCourseTeeSchema,
  UpdateGolfCourseTeeSchema,
  AddLeagueCourseSchema,
  UpdateTeePrioritiesSchema,
  ImportExternalCourseSchema,
  GolfLeagueSetupSchema,
  UpdateGolfLeagueSetupSchema,
  GolfAccountInfoSchema,
  GolfFlightSchema,
  GolfFlightWithTeamCountSchema,
  CreateGolfFlightSchema,
  UpdateGolfFlightSchema,
  GolfTeamSchema,
  GolfTeamWithPlayerCountSchema,
  GolfTeamWithRosterSchema,
  CreateGolfTeamSchema,
  UpdateGolfTeamSchema,
  GolfPlayerSchema,
  GolfRosterEntrySchema,
  GolfSubstituteSchema,
  CreateGolfPlayerSchema,
  UpdateGolfPlayerSchema,
  SignPlayerSchema,
  ReleasePlayerSchema,
  AvailablePlayerSchema,
  GolfMatchSchema,
  GolfMatchWithScoresSchema,
  CreateGolfMatchSchema,
  UpdateGolfMatchSchema,
  GolfScoreSchema,
  GolfScoreWithDetailsSchema,
  CreateGolfScoreSchema,
  UpdateGolfScoreSchema,
  SubmitMatchResultsSchema,
  PlayerMatchScoreSchema,
  GolfDifferentialSchema,
  PlayerHandicapSchema,
  LeagueHandicapsSchema,
  CourseHandicapSchema,
  ESCMaxScoreSchema,
  BatchCourseHandicapRequestSchema,
  PlayerCourseHandicapSchema,
  BatchCourseHandicapResponseSchema,
  GolfTeamStandingSchema,
  GolfFlightStandingsSchema,
  GolfLeagueStandingsSchema,
  GolfLeaderSchema,
  GolfScoringAverageSchema,
  GolfSkinsEntrySchema,
  GolfFlightLeadersSchema,
  ExternalCourseSearchResultSchema,
  ExternalCourseDetailSchema,
  ExternalCourseTeeSchema,
  CreateIndividualGolfAccountSchema,
  CreateAuthenticatedGolfAccountSchema,
  IndividualGolfAccountResponseSchema,
  AuthenticatedGolfAccountResponseSchema,
  GolferSchema,
  GolferSummarySchema,
  UpdateGolferHomeCourseSchema,
  PlayerSeasonScoresResponseSchema,
  ContactIndividualGolfAccountSchema,
  LiveScoringStateSchema,
  LiveSessionStatusSchema,
  LiveHoleScoreSchema,
  StartLiveScoringSchema,
  SubmitLiveHoleScoreSchema,
  AdvanceHoleSchema,
  FinalizeLiveScoringSchema,
  StopLiveScoringSchema,
  SseTicketResponseSchema,
  IndividualLiveScoringStateSchema,
  IndividualLiveSessionStatusSchema,
  IndividualLiveHoleScoreSchema,
  StartIndividualLiveScoringSchema,
  SubmitIndividualLiveHoleScoreSchema,
  AdvanceIndividualLiveHoleSchema,
  BaseballLiveScoringStateSchema,
  BaseballLiveSessionStatusSchema,
  BaseballLiveInningScoreSchema,
  StartBaseballLiveScoringSchema,
  SubmitBaseballLiveInningScoreSchema,
  AdvanceBaseballInningSchema,
  FinalizeBaseballLiveScoringSchema,
  StopBaseballLiveScoringSchema,
  IndividualSseTicketResponseSchema,
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
  const AutoRegisterContactResponseSchemaRef = registry.register(
    'AutoRegisterContactResponse',
    AutoRegisterContactResponseSchema,
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
  const SeasonCopyResponseSchemaRef = registry.register(
    'SeasonCopyResponse',
    SeasonCopyResponseSchema,
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
  const PublicRosterMemberSchemaRef = registry.register(
    'PublicRosterMember',
    PublicRosterMemberSchema,
  );
  const PublicTeamRosterResponseSchemaRef = registry.register(
    'PublicTeamRosterResponse',
    PublicTeamRosterResponseSchema,
  );
  const RosterCardPlayerSchemaRef = registry.register('RosterCardPlayer', RosterCardPlayerSchema);
  const TeamRosterCardSchemaRef = registry.register('TeamRosterCard', TeamRosterCardSchema);
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
  const CreateUmpireSchemaRef = registry.register('CreateUmpire', CreateUmpireSchema);
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
  const CreateIndividualGolfAccountSchemaRef = registry.register(
    'CreateIndividualGolfAccount',
    CreateIndividualGolfAccountSchema,
  );
  const CreateAuthenticatedGolfAccountSchemaRef = registry.register(
    'CreateAuthenticatedGolfAccount',
    CreateAuthenticatedGolfAccountSchema,
  );
  const IndividualGolfAccountResponseSchemaRef = registry.register(
    'IndividualGolfAccountResponse',
    IndividualGolfAccountResponseSchema,
  );
  const AuthenticatedGolfAccountResponseSchemaRef = registry.register(
    'AuthenticatedGolfAccountResponse',
    AuthenticatedGolfAccountResponseSchema,
  );
  const AccountNameSchemaRef = registry.register('AccountName', AccountNameSchema);
  const AccountHeaderSchemaRef = registry.register('AccountHeader', AccountHeaderSchema);
  const AccountAffiliationSchemaRef = registry.register(
    'AccountAffiliation',
    AccountAffiliationSchema,
  );
  const AccountTypeSchemaRef = registry.register('AccountType', AccountTypeSchema);
  const AccountUrlSchemaRef = registry.register('AccountUrl', AccountUrlSchema);
  const CreateAccountUrlSchemaRef = registry.register('CreateAccountUrl', CreateAccountUrlSchema);
  const AccountBlueskySettingsSchemaRef = registry.register(
    'AccountBlueskySettings',
    AccountBlueskySettingsSchema,
  );
  const AccountInstagramSettingsSchemaRef = registry.register(
    'AccountInstagramSettings',
    AccountInstagramSettingsSchema,
  );
  const AccountTwitterSettingsSchemaRef = registry.register(
    'AccountTwitterSettings',
    AccountTwitterSettingsSchema,
  );
  const AccountFacebookCredentialsSchemaRef = registry.register(
    'AccountFacebookCredentials',
    AccountFacebookCredentialsSchema,
  );
  const AccountTwitterOAuthStartSchemaRef = registry.register(
    'AccountTwitterOAuthStart',
    AccountTwitterOAuthStartSchema,
  );
  const AccountTwitterAuthorizationUrlSchemaRef = registry.register(
    'AccountTwitterAuthorizationUrl',
    AccountTwitterAuthorizationUrlSchema,
  );
  const AccountFacebookOAuthStartSchemaRef = registry.register(
    'AccountFacebookOAuthStart',
    AccountFacebookOAuthStartSchema,
  );
  const AccountFacebookAuthorizationUrlSchemaRef = registry.register(
    'AccountFacebookAuthorizationUrl',
    AccountFacebookAuthorizationUrlSchema,
  );
  const FacebookPageSelectionSchemaRef = registry.register(
    'FacebookPageSelection',
    FacebookPageSelectionSchema,
  );
  const FacebookPageListSchemaRef = registry.register('FacebookPageList', FacebookPageListSchema);
  const FacebookConnectionStatusSchemaRef = registry.register(
    'FacebookConnectionStatus',
    FacebookConnectionStatusSchema,
  );
  const AccountSettingsStateListSchemaRef = registry.register(
    'AccountSettingsStateList',
    AccountSettingsStateListSchema,
  );
  const AccountSettingStateSchemaRef = registry.register(
    'AccountSettingState',
    AccountSettingStateSchema,
  );
  const AccountSettingUpdateRequestSchemaRef = registry.register(
    'AccountSettingUpdateRequest',
    AccountSettingUpdateRequestSchema,
  );
  const AccountSettingKeySchemaRef = registry.register(
    'AccountSettingKey',
    AccountSettingKeySchema,
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
  const DiscordAccountConfigSchemaRef = registry.register(
    'DiscordAccountConfig',
    DiscordAccountConfigSchema,
  );
  const DiscordAccountConfigUpdateSchemaRef = registry.register(
    'DiscordAccountConfigUpdate',
    DiscordAccountConfigUpdateSchema,
  );
  const DiscordRoleMappingSchemaRef = registry.register(
    'DiscordRoleMapping',
    DiscordRoleMappingSchema,
  );
  const DiscordRoleMappingListSchemaRef = registry.register(
    'DiscordRoleMappingList',
    DiscordRoleMappingListSchema,
  );
  const DiscordRoleMappingUpdateSchemaRef = registry.register(
    'DiscordRoleMappingUpdate',
    DiscordRoleMappingUpdateSchema,
  );
  const DiscordChannelMappingSchemaRef = registry.register(
    'DiscordChannelMapping',
    DiscordChannelMappingSchema,
  );
  const DiscordChannelMappingListSchemaRef = registry.register(
    'DiscordChannelMappingList',
    DiscordChannelMappingListSchema,
  );
  const DiscordChannelMappingCreateSchemaRef = registry.register(
    'DiscordChannelMappingCreate',
    DiscordChannelMappingCreateSchema,
  );
  const DiscordGuildChannelSchemaRef = registry.register(
    'DiscordGuildChannel',
    DiscordGuildChannelSchema,
  );
  const DiscordOAuthStartResponseSchemaRef = registry.register(
    'DiscordOAuthStartResponse',
    DiscordOAuthStartResponseSchema,
  );
  const DiscordLinkStatusSchemaRef = registry.register(
    'DiscordLinkStatus',
    DiscordLinkStatusSchema,
  );
  const DiscordFeatureSyncStatusSchemaRef = registry.register(
    'DiscordFeatureSyncStatus',
    DiscordFeatureSyncStatusSchema,
  );
  const DiscordFeatureSyncUpdateSchemaRef = registry.register(
    'DiscordFeatureSyncUpdate',
    DiscordFeatureSyncUpdateSchema,
  );
  const DiscordFeatureSyncFeatureSchemaRef = registry.register(
    'DiscordFeatureSyncFeature',
    DiscordFeatureSyncFeatureEnum,
  );
  const DiscordTeamForumListSchemaRef = registry.register(
    'DiscordTeamForumList',
    DiscordTeamForumListSchema,
  );
  const DiscordTeamForumQuerySchemaRef = registry.register(
    'DiscordTeamForumQuery',
    DiscordTeamForumQuerySchema,
  );
  const DiscordTeamForumRepairResultSchemaRef = registry.register(
    'DiscordTeamForumRepairResult',
    DiscordTeamForumRepairResultSchema,
  );
  const DiscordTeamForumRemoveRequestSchemaRef = registry.register(
    'DiscordTeamForumRemoveRequest',
    DiscordTeamForumRemoveRequestSchema,
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
  const PlayerSurveyCategorySchemaRef = registry.register(
    'PlayerSurveyCategory',
    PlayerSurveyCategorySchema,
  );
  const CreatePlayerSurveyCategorySchemaRef = registry.register(
    'CreatePlayerSurveyCategory',
    CreatePlayerSurveyCategorySchema,
  );
  const UpdatePlayerSurveyCategorySchemaRef = registry.register(
    'UpdatePlayerSurveyCategory',
    UpdatePlayerSurveyCategorySchema,
  );
  const PlayerSurveyQuestionSchemaRef = registry.register(
    'PlayerSurveyQuestion',
    PlayerSurveyQuestionSchema,
  );
  const CreatePlayerSurveyQuestionSchemaRef = registry.register(
    'CreatePlayerSurveyQuestion',
    CreatePlayerSurveyQuestionSchema,
  );
  const UpdatePlayerSurveyQuestionSchemaRef = registry.register(
    'UpdatePlayerSurveyQuestion',
    UpdatePlayerSurveyQuestionSchema,
  );
  const PlayerSurveyAnswerSchemaRef = registry.register(
    'PlayerSurveyAnswer',
    PlayerSurveyAnswerSchema,
  );
  const PlayerSurveyAnswerUpsertSchemaRef = registry.register(
    'PlayerSurveyAnswerUpsert',
    PlayerSurveyAnswerUpsertSchema,
  );
  const PlayerSurveyDetailSchemaRef = registry.register(
    'PlayerSurveyDetail',
    PlayerSurveyDetailSchema,
  );
  const PlayerSurveySummaryListResponseSchemaRef = registry.register(
    'PlayerSurveySummaryListResponse',
    PlayerSurveySummaryListResponseSchema,
  );
  const PlayerSurveyListQuerySchemaRef = registry.register(
    'PlayerSurveyListQuery',
    PlayerSurveyListQuerySchema,
  );
  const PlayerSurveySpotlightSchemaRef = registry.register(
    'PlayerSurveySpotlight',
    PlayerSurveySpotlightSchema,
  );
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
  const HofRandomMembersQuerySchemaRef = registry.register(
    'HofRandomMembersQuery',
    HofRandomMembersQuerySchema,
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
  const WorkoutRegistrationAccessCodeSchemaRef = registry.register(
    'WorkoutRegistrationAccessCode',
    WorkoutRegistrationAccessCodeSchema,
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
  const LeagueFaqSchemaRef = registry.register('LeagueFaq', LeagueFaqSchema);
  const UpsertLeagueFaqSchemaRef = registry.register('UpsertLeagueFaq', UpsertLeagueFaqSchema);
  const LeagueFaqListSchemaRef = registry.register('LeagueFaqList', LeagueFaqListSchema);
  const GameSchemaRef = registry.register('Game', GameSchema);
  const GameResultSchemaRef = registry.register('GameResult', GameResultSchema);
  const RecentGamesSchemaRef = registry.register('RecentGames', RecentGamesSchema);
  const GamesWithRecapsSchemaRef = registry.register('GamesWithRecaps', GamesWithRecapsSchema);
  const HandoutSchemaRef = registry.register('Handout', HandoutSchema);
  const HandoutListSchemaRef = registry.register('HandoutList', HandoutListSchema);
  const UpsertHandoutSchemaRef = registry.register('UpsertHandout', UpsertHandoutSchema);
  const AlertSchemaRef = registry.register('Alert', AlertSchema);
  const AlertListSchemaRef = registry.register('AlertList', AlertListSchema);
  const UpsertAlertSchemaRef = registry.register('UpsertAlert', UpsertAlertSchema);
  const AnnouncementSchemaRef = registry.register('Announcement', AnnouncementSchema);
  const AnnouncementListSchemaRef = registry.register('AnnouncementList', AnnouncementListSchema);
  const AnnouncementSummarySchema = AnnouncementSchema.omit({ body: true }).openapi({
    title: 'AnnouncementSummary',
    description: 'Announcement metadata without the body content.',
  });
  const AnnouncementSummarySchemaRef = registry.register(
    'AnnouncementSummary',
    AnnouncementSummarySchema,
  );
  const AnnouncementSummaryListSchema = z
    .object({
      announcements: AnnouncementSummarySchema.array(),
    })
    .openapi({
      title: 'AnnouncementSummaryList',
      description: 'Collection wrapper for announcement summary responses.',
    });
  const AnnouncementSummaryListSchemaRef = registry.register(
    'AnnouncementSummaryList',
    AnnouncementSummaryListSchema,
  );
  const UpsertAnnouncementSchemaRef = registry.register(
    'UpsertAnnouncement',
    UpsertAnnouncementSchema,
  );
  const WelcomeMessageSchemaRef = registry.register('WelcomeMessage', WelcomeMessageSchema);
  const WelcomeMessageListSchemaRef = registry.register(
    'WelcomeMessageList',
    WelcomeMessageListSchema,
  );
  const UpsertWelcomeMessageSchemaRef = registry.register(
    'UpsertWelcomeMessage',
    UpsertWelcomeMessageSchema,
  );
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
  const SocialFeedItemSchemaRef = registry.register('SocialFeedItem', SocialFeedItemSchema);
  const SocialFeedListSchemaRef = registry.register('SocialFeedList', SocialFeedListSchema);
  const SocialFeedQuerySchemaRef = registry.register('SocialFeedQuery', SocialFeedQuerySchema);
  const SocialVideoSchemaRef = registry.register('SocialVideo', SocialVideoSchema);
  const SocialVideoListSchemaRef = registry.register('SocialVideoList', SocialVideoListSchema);
  const SocialVideoQuerySchemaRef = registry.register('SocialVideoQuery', SocialVideoQuerySchema);
  const CommunityMessagePreviewSchemaRef = registry.register(
    'CommunityMessagePreview',
    CommunityMessagePreviewSchema,
  );
  const CommunityMessageListSchemaRef = registry.register(
    'CommunityMessageList',
    CommunityMessageListSchema,
  );
  const CommunityMessageQuerySchemaRef = registry.register(
    'CommunityMessageQuery',
    CommunityMessageQuerySchema,
  );
  const CommunityChannelSchemaRef = registry.register('CommunityChannel', CommunityChannelSchema);
  const CommunityChannelListSchemaRef = registry.register(
    'CommunityChannelList',
    CommunityChannelListSchema,
  );
  const CommunityChannelQuerySchemaRef = registry.register(
    'CommunityChannelQuery',
    CommunityChannelQuerySchema,
  );
  const LiveEventSchemaRef = registry.register('LiveEvent', LiveEventSchema);
  const LiveEventListSchemaRef = registry.register('LiveEventList', LiveEventListSchema);
  const LiveEventQuerySchemaRef = registry.register('LiveEventQuery', LiveEventQuerySchema);
  const LiveEventCreateSchemaRef = registry.register('LiveEventCreate', LiveEventCreateSchema);
  const LiveEventUpdateSchemaRef = registry.register('LiveEventUpdate', LiveEventUpdateSchema);
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
  const UpdateDivisionSeasonResponseSchemaRef = registry.register(
    'UpdateDivisionSeasonResponse',
    UpdateDivisionSeasonResponseSchema,
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
  const SchedulerProblemSpecSchemaRef = registry.register(
    'SchedulerProblemSpec',
    SchedulerProblemSpecSchema,
  );
  const SchedulerProblemSpecPreviewSchemaRef = registry.register(
    'SchedulerProblemSpecPreview',
    SchedulerProblemSpecPreviewSchema,
  );
  const SchedulerSeasonSolveRequestSchemaRef = registry.register(
    'SchedulerSeasonSolveRequest',
    SchedulerSeasonSolveRequestSchema,
  );
  const SchedulerSeasonApplyRequestSchemaRef = registry.register(
    'SchedulerSeasonApplyRequest',
    SchedulerSeasonApplyRequestSchema,
  );
  const SchedulerSolveResultSchemaRef = registry.register(
    'SchedulerSolveResult',
    SchedulerSolveResultSchema,
  );
  const SchedulerApplyRequestSchemaRef = registry.register(
    'SchedulerApplyRequest',
    SchedulerApplyRequestSchema,
  );
  const SchedulerApplyResultSchemaRef = registry.register(
    'SchedulerApplyResult',
    SchedulerApplyResultSchema,
  );
  const SchedulerFieldAvailabilityRuleSchemaRef = registry.register(
    'SchedulerFieldAvailabilityRule',
    SchedulerFieldAvailabilityRuleSchema,
  );
  const SchedulerFieldAvailabilityRuleUpsertSchemaRef = registry.register(
    'SchedulerFieldAvailabilityRuleUpsert',
    SchedulerFieldAvailabilityRuleUpsertSchema,
  );
  const SchedulerFieldAvailabilityRulesSchemaRef = registry.register(
    'SchedulerFieldAvailabilityRules',
    SchedulerFieldAvailabilityRulesSchema,
  );
  const SchedulerFieldExclusionDateSchemaRef = registry.register(
    'SchedulerFieldExclusionDate',
    SchedulerFieldExclusionDateSchema,
  );
  const SchedulerFieldExclusionDateUpsertSchemaRef = registry.register(
    'SchedulerFieldExclusionDateUpsert',
    SchedulerFieldExclusionDateUpsertSchema,
  );
  const SchedulerFieldExclusionDatesSchemaRef = registry.register(
    'SchedulerFieldExclusionDates',
    SchedulerFieldExclusionDatesSchema,
  );
  const SchedulerSeasonWindowConfigSchemaRef = registry.register(
    'SchedulerSeasonWindowConfig',
    SchedulerSeasonWindowConfigSchema,
  );
  const SchedulerSeasonWindowConfigUpsertSchemaRef = registry.register(
    'SchedulerSeasonWindowConfigUpsert',
    SchedulerSeasonWindowConfigUpsertSchema,
  );
  const SchedulerSeasonExclusionSchemaRef = registry.register(
    'SchedulerSeasonExclusion',
    SchedulerSeasonExclusionSchema,
  );
  const SchedulerSeasonExclusionUpsertSchemaRef = registry.register(
    'SchedulerSeasonExclusionUpsert',
    SchedulerSeasonExclusionUpsertSchema,
  );
  const SchedulerSeasonExclusionsSchemaRef = registry.register(
    'SchedulerSeasonExclusions',
    SchedulerSeasonExclusionsSchema,
  );
  const SchedulerTeamExclusionSchemaRef = registry.register(
    'SchedulerTeamExclusion',
    SchedulerTeamExclusionSchema,
  );
  const SchedulerTeamExclusionUpsertSchemaRef = registry.register(
    'SchedulerTeamExclusionUpsert',
    SchedulerTeamExclusionUpsertSchema,
  );
  const SchedulerTeamExclusionsSchemaRef = registry.register(
    'SchedulerTeamExclusions',
    SchedulerTeamExclusionsSchema,
  );
  const SchedulerUmpireExclusionSchemaRef = registry.register(
    'SchedulerUmpireExclusion',
    SchedulerUmpireExclusionSchema,
  );
  const SchedulerUmpireExclusionUpsertSchemaRef = registry.register(
    'SchedulerUmpireExclusionUpsert',
    SchedulerUmpireExclusionUpsertSchema,
  );
  const SchedulerUmpireExclusionsSchemaRef = registry.register(
    'SchedulerUmpireExclusions',
    SchedulerUmpireExclusionsSchema,
  );
  const RoleCheckResponseSchemaRef = registry.register(
    'RoleCheckResponse',
    RoleCheckResponseSchema,
  );
  const ContactValidationSchemaRef = registry.register(
    'ContactValidation',
    ContactValidationSchema,
  );
  const AdminDashboardSummarySchemaRef = registry.register(
    'AdminDashboardSummary',
    AdminDashboardSummarySchema,
  );
  const GolfCourseSchemaRef = registry.register('GolfCourse', GolfCourseSchema);
  const GolfCourseWithTeesSchemaRef = registry.register(
    'GolfCourseWithTees',
    GolfCourseWithTeesSchema,
  );
  const GolfCourseTeeSchemaRef = registry.register('GolfCourseTee', GolfCourseTeeSchema);
  const GolfLeagueCourseSchemaRef = registry.register('GolfLeagueCourse', GolfLeagueCourseSchema);
  const CreateGolfCourseSchemaRef = registry.register('CreateGolfCourse', CreateGolfCourseSchema);
  const UpdateGolfCourseSchemaRef = registry.register('UpdateGolfCourse', UpdateGolfCourseSchema);
  const CreateGolfCourseTeeSchemaRef = registry.register(
    'CreateGolfCourseTee',
    CreateGolfCourseTeeSchema,
  );
  const UpdateGolfCourseTeeSchemaRef = registry.register(
    'UpdateGolfCourseTee',
    UpdateGolfCourseTeeSchema,
  );
  const AddLeagueCourseSchemaRef = registry.register('AddLeagueCourse', AddLeagueCourseSchema);
  const UpdateTeePrioritiesSchemaRef = registry.register(
    'UpdateTeePriorities',
    UpdateTeePrioritiesSchema,
  );
  const ImportExternalCourseSchemaRef = registry.register(
    'ImportExternalCourse',
    ImportExternalCourseSchema,
  );
  const GolfLeagueSetupSchemaRef = registry.register('GolfLeagueSetup', GolfLeagueSetupSchema);
  const UpdateGolfLeagueSetupSchemaRef = registry.register(
    'UpdateGolfLeagueSetup',
    UpdateGolfLeagueSetupSchema,
  );
  const GolfAccountInfoSchemaRef = registry.register('GolfAccountInfo', GolfAccountInfoSchema);
  const GolfFlightSchemaRef = registry.register('GolfFlight', GolfFlightSchema);
  const GolfFlightWithTeamCountSchemaRef = registry.register(
    'GolfFlightWithTeamCount',
    GolfFlightWithTeamCountSchema,
  );
  const CreateGolfFlightSchemaRef = registry.register('CreateGolfFlight', CreateGolfFlightSchema);
  const UpdateGolfFlightSchemaRef = registry.register('UpdateGolfFlight', UpdateGolfFlightSchema);
  const GolfTeamSchemaRef = registry.register('GolfTeam', GolfTeamSchema);
  const GolfTeamWithPlayerCountSchemaRef = registry.register(
    'GolfTeamWithPlayerCount',
    GolfTeamWithPlayerCountSchema,
  );
  const GolfTeamWithRosterSchemaRef = registry.register(
    'GolfTeamWithRoster',
    GolfTeamWithRosterSchema,
  );
  const CreateGolfTeamSchemaRef = registry.register('CreateGolfTeam', CreateGolfTeamSchema);
  const UpdateGolfTeamSchemaRef = registry.register('UpdateGolfTeam', UpdateGolfTeamSchema);
  const GolfPlayerSchemaRef = registry.register('GolfPlayer', GolfPlayerSchema);
  const GolfRosterEntrySchemaRef = registry.register('GolfRosterEntry', GolfRosterEntrySchema);
  const GolfSubstituteSchemaRef = registry.register('GolfSubstitute', GolfSubstituteSchema);
  const CreateGolfPlayerSchemaRef = registry.register('CreateGolfPlayer', CreateGolfPlayerSchema);
  const UpdateGolfPlayerSchemaRef = registry.register('UpdateGolfPlayer', UpdateGolfPlayerSchema);
  const SignPlayerSchemaRef = registry.register('SignPlayer', SignPlayerSchema);
  const ReleasePlayerSchemaRef = registry.register('ReleasePlayer', ReleasePlayerSchema);
  const AvailablePlayerSchemaRef = registry.register('AvailablePlayer', AvailablePlayerSchema);
  const GolfMatchSchemaRef = registry.register('GolfMatch', GolfMatchSchema);
  const GolfMatchWithScoresSchemaRef = registry.register(
    'GolfMatchWithScores',
    GolfMatchWithScoresSchema,
  );
  const CreateGolfMatchSchemaRef = registry.register('CreateGolfMatch', CreateGolfMatchSchema);
  const UpdateGolfMatchSchemaRef = registry.register('UpdateGolfMatch', UpdateGolfMatchSchema);
  const GolfScoreSchemaRef = registry.register('GolfScore', GolfScoreSchema);
  const GolfScoreWithDetailsSchemaRef = registry.register(
    'GolfScoreWithDetails',
    GolfScoreWithDetailsSchema,
  );
  const CreateGolfScoreSchemaRef = registry.register('CreateGolfScore', CreateGolfScoreSchema);
  const UpdateGolfScoreSchemaRef = registry.register('UpdateGolfScore', UpdateGolfScoreSchema);
  const SubmitMatchResultsSchemaRef = registry.register(
    'SubmitMatchResults',
    SubmitMatchResultsSchema,
  );
  const PlayerMatchScoreSchemaRef = registry.register('PlayerMatchScore', PlayerMatchScoreSchema);
  const GolfDifferentialSchemaRef = registry.register('GolfDifferential', GolfDifferentialSchema);
  const PlayerHandicapSchemaRef = registry.register('PlayerHandicap', PlayerHandicapSchema);
  const LeagueHandicapsSchemaRef = registry.register('LeagueHandicaps', LeagueHandicapsSchema);
  const CourseHandicapSchemaRef = registry.register('CourseHandicap', CourseHandicapSchema);
  const ESCMaxScoreSchemaRef = registry.register('ESCMaxScore', ESCMaxScoreSchema);
  const BatchCourseHandicapRequestSchemaRef = registry.register(
    'BatchCourseHandicapRequest',
    BatchCourseHandicapRequestSchema,
  );
  const PlayerCourseHandicapSchemaRef = registry.register(
    'PlayerCourseHandicap',
    PlayerCourseHandicapSchema,
  );
  const BatchCourseHandicapResponseSchemaRef = registry.register(
    'BatchCourseHandicapResponse',
    BatchCourseHandicapResponseSchema,
  );
  const GolfTeamStandingSchemaRef = registry.register('GolfTeamStanding', GolfTeamStandingSchema);
  const GolfFlightStandingsSchemaRef = registry.register(
    'GolfFlightStandings',
    GolfFlightStandingsSchema,
  );
  const GolfLeagueStandingsSchemaRef = registry.register(
    'GolfLeagueStandings',
    GolfLeagueStandingsSchema,
  );
  const GolfLeaderSchemaRef = registry.register('GolfLeader', GolfLeaderSchema);
  const GolfScoringAverageSchemaRef = registry.register(
    'GolfScoringAverage',
    GolfScoringAverageSchema,
  );
  const GolfSkinsEntrySchemaRef = registry.register('GolfSkinsEntry', GolfSkinsEntrySchema);
  const GolfFlightLeadersSchemaRef = registry.register(
    'GolfFlightLeaders',
    GolfFlightLeadersSchema,
  );
  const ExternalCourseSearchResultSchemaRef = registry.register(
    'ExternalCourseSearchResult',
    ExternalCourseSearchResultSchema,
  );
  const ExternalCourseDetailSchemaRef = registry.register(
    'ExternalCourseDetail',
    ExternalCourseDetailSchema,
  );
  const ExternalCourseTeeSchemaRef = registry.register(
    'ExternalCourseTee',
    ExternalCourseTeeSchema,
  );
  const GolferSchemaRef = registry.register('Golfer', GolferSchema);
  const GolferSummarySchemaRef = registry.register('GolferSummary', GolferSummarySchema);
  const UpdateGolferHomeCourseSchemaRef = registry.register(
    'UpdateGolferHomeCourse',
    UpdateGolferHomeCourseSchema,
  );
  const PlayerSeasonScoresResponseSchemaRef = registry.register(
    'PlayerSeasonScoresResponse',
    PlayerSeasonScoresResponseSchema,
  );
  const ContactIndividualGolfAccountSchemaRef = registry.register(
    'ContactIndividualGolfAccount',
    ContactIndividualGolfAccountSchema,
  );
  const LiveScoringStateSchemaRef = registry.register('LiveScoringState', LiveScoringStateSchema);
  const LiveSessionStatusSchemaRef = registry.register(
    'LiveSessionStatus',
    LiveSessionStatusSchema,
  );
  const LiveHoleScoreSchemaRef = registry.register('LiveHoleScore', LiveHoleScoreSchema);
  const StartLiveScoringSchemaRef = registry.register('StartLiveScoring', StartLiveScoringSchema);
  const SubmitLiveHoleScoreSchemaRef = registry.register(
    'SubmitLiveHoleScore',
    SubmitLiveHoleScoreSchema,
  );
  const AdvanceHoleSchemaRef = registry.register('AdvanceHole', AdvanceHoleSchema);
  const FinalizeLiveScoringSchemaRef = registry.register(
    'FinalizeLiveScoring',
    FinalizeLiveScoringSchema,
  );
  const StopLiveScoringSchemaRef = registry.register('StopLiveScoring', StopLiveScoringSchema);
  const SseTicketResponseSchemaRef = registry.register(
    'SseTicketResponse',
    SseTicketResponseSchema,
  );
  const IndividualLiveScoringStateSchemaRef = registry.register(
    'IndividualLiveScoringState',
    IndividualLiveScoringStateSchema,
  );
  const IndividualLiveSessionStatusSchemaRef = registry.register(
    'IndividualLiveSessionStatus',
    IndividualLiveSessionStatusSchema,
  );
  const IndividualLiveHoleScoreSchemaRef = registry.register(
    'IndividualLiveHoleScore',
    IndividualLiveHoleScoreSchema,
  );
  const StartIndividualLiveScoringSchemaRef = registry.register(
    'StartIndividualLiveScoring',
    StartIndividualLiveScoringSchema,
  );
  const SubmitIndividualLiveHoleScoreSchemaRef = registry.register(
    'SubmitIndividualLiveHoleScore',
    SubmitIndividualLiveHoleScoreSchema,
  );
  const AdvanceIndividualLiveHoleSchemaRef = registry.register(
    'AdvanceIndividualLiveHole',
    AdvanceIndividualLiveHoleSchema,
  );
  const IndividualSseTicketResponseSchemaRef = registry.register(
    'IndividualSseTicketResponse',
    IndividualSseTicketResponseSchema,
  );
  const BaseballLiveScoringStateSchemaRef = registry.register(
    'BaseballLiveScoringState',
    BaseballLiveScoringStateSchema,
  );
  const BaseballLiveSessionStatusSchemaRef = registry.register(
    'BaseballLiveSessionStatus',
    BaseballLiveSessionStatusSchema,
  );
  const BaseballLiveInningScoreSchemaRef = registry.register(
    'BaseballLiveInningScore',
    BaseballLiveInningScoreSchema,
  );
  const StartBaseballLiveScoringSchemaRef = registry.register(
    'StartBaseballLiveScoring',
    StartBaseballLiveScoringSchema,
  );
  const SubmitBaseballLiveInningScoreSchemaRef = registry.register(
    'SubmitBaseballLiveInningScore',
    SubmitBaseballLiveInningScoreSchema,
  );
  const AdvanceBaseballInningSchemaRef = registry.register(
    'AdvanceBaseballInning',
    AdvanceBaseballInningSchema,
  );
  const FinalizeBaseballLiveScoringSchemaRef = registry.register(
    'FinalizeBaseballLiveScoring',
    FinalizeBaseballLiveScoringSchema,
  );
  const StopBaseballLiveScoringSchemaRef = registry.register(
    'StopBaseballLiveScoring',
    StopBaseballLiveScoringSchema,
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
    AutoRegisterContactResponseSchemaRef,
    FieldSchemaRef,
    FieldsSchemaRef,
    UpsertFieldSchemaRef,
    SeasonManagerSchemaRef,
    SeasonManagerListSchemaRef,
    SeasonManagerWithLeagueSchemaRef,
    SeasonSchemaRef,
    CurrentSeasonResponseSchemaRef,
    SeasonCopyResponseSchemaRef,
    SeasonParticipantCountDataSchemaRef,
    TeamManagerSchemaRef,
    TeamRosterMembersSchemaRef,
    PublicRosterMemberSchemaRef,
    PublicTeamRosterResponseSchemaRef,
    RosterCardPlayerSchemaRef,
    TeamRosterCardSchemaRef,
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
    CreateUmpireSchemaRef,
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
    CreateIndividualGolfAccountSchemaRef,
    CreateAuthenticatedGolfAccountSchemaRef,
    IndividualGolfAccountResponseSchemaRef,
    AuthenticatedGolfAccountResponseSchemaRef,
    AccountNameSchemaRef,
    AccountHeaderSchemaRef,
    AccountAffiliationSchemaRef,
    AccountTypeSchemaRef,
    AccountUrlSchemaRef,
    CreateAccountUrlSchemaRef,
    AccountBlueskySettingsSchemaRef,
    AccountInstagramSettingsSchemaRef,
    AccountTwitterSettingsSchemaRef,
    AccountFacebookCredentialsSchemaRef,
    AccountTwitterOAuthStartSchemaRef,
    AccountTwitterAuthorizationUrlSchemaRef,
    AccountFacebookOAuthStartSchemaRef,
    AccountFacebookAuthorizationUrlSchemaRef,
    FacebookPageSelectionSchemaRef,
    FacebookPageListSchemaRef,
    FacebookConnectionStatusSchemaRef,
    AccountSettingsStateListSchemaRef,
    AccountSettingStateSchemaRef,
    AccountSettingUpdateRequestSchemaRef,
    AccountSettingKeySchemaRef,
    AutomaticRoleHoldersSchemaRef,
    RoleMetadataSchemaRef,
    SponsorSchemaRef,
    SponsorListSchemaRef,
    CreateSponsorSchemaRef,
    MemberBusinessSchemaRef,
    MemberBusinessListSchemaRef,
    CreateMemberBusinessSchemaRef,
    MemberBusinessQueryParamsSchemaRef,
    DiscordAccountConfigSchemaRef,
    DiscordAccountConfigUpdateSchemaRef,
    DiscordRoleMappingSchemaRef,
    DiscordRoleMappingListSchemaRef,
    DiscordRoleMappingUpdateSchemaRef,
    DiscordChannelMappingSchemaRef,
    DiscordChannelMappingListSchemaRef,
    DiscordChannelMappingCreateSchemaRef,
    DiscordGuildChannelSchemaRef,
    DiscordOAuthStartResponseSchemaRef,
    DiscordLinkStatusSchemaRef,
    DiscordFeatureSyncStatusSchemaRef,
    DiscordFeatureSyncUpdateSchemaRef,
    DiscordFeatureSyncFeatureSchemaRef,
    DiscordTeamForumListSchemaRef,
    DiscordTeamForumQuerySchemaRef,
    DiscordTeamForumRepairResultSchemaRef,
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
    PlayerSurveyCategorySchemaRef,
    CreatePlayerSurveyCategorySchemaRef,
    UpdatePlayerSurveyCategorySchemaRef,
    PlayerSurveyQuestionSchemaRef,
    CreatePlayerSurveyQuestionSchemaRef,
    UpdatePlayerSurveyQuestionSchemaRef,
    PlayerSurveyAnswerSchemaRef,
    PlayerSurveyAnswerUpsertSchemaRef,
    PlayerSurveyDetailSchemaRef,
    PlayerSurveySummaryListResponseSchemaRef,
    PlayerSurveyListQuerySchemaRef,
    PlayerSurveySpotlightSchemaRef,
    HofContactSummarySchemaRef,
    HofMemberSchemaRef,
    HofClassSummarySchemaRef,
    HofClassWithMembersSchemaRef,
    HofEligibleContactsQuerySchemaRef,
    HofEligibleContactsResponseSchemaRef,
    HofRandomMembersQuerySchemaRef,
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
    WorkoutRegistrationAccessCodeSchemaRef,
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
    LeagueFaqSchemaRef,
    UpsertLeagueFaqSchemaRef,
    LeagueFaqListSchemaRef,
    GameSchemaRef,
    GameResultSchemaRef,
    RecentGamesSchemaRef,
    GamesWithRecapsSchemaRef,
    HandoutSchemaRef,
    HandoutListSchemaRef,
    UpsertHandoutSchemaRef,
    AlertSchemaRef,
    AlertListSchemaRef,
    UpsertAlertSchemaRef,
    AnnouncementSchemaRef,
    AnnouncementListSchemaRef,
    AnnouncementSummarySchemaRef,
    AnnouncementSummaryListSchemaRef,
    UpsertAnnouncementSchemaRef,
    WelcomeMessageSchemaRef,
    WelcomeMessageListSchemaRef,
    UpsertWelcomeMessageSchemaRef,
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
    SocialFeedItemSchemaRef,
    SocialFeedListSchemaRef,
    SocialFeedQuerySchemaRef,
    SocialVideoSchemaRef,
    SocialVideoListSchemaRef,
    SocialVideoQuerySchemaRef,
    CommunityMessagePreviewSchemaRef,
    CommunityMessageListSchemaRef,
    CommunityMessageQuerySchemaRef,
    CommunityChannelSchemaRef,
    CommunityChannelListSchemaRef,
    CommunityChannelQuerySchemaRef,
    LiveEventSchemaRef,
    LiveEventListSchemaRef,
    LiveEventQuerySchemaRef,
    LiveEventCreateSchemaRef,
    LiveEventUpdateSchemaRef,
    UpdateGameResultsSchemaRef,
    UpsertGameSchemaRef,
    UpsertGameRecapSchemaRef,
    UpsertSeasonSchemaRef,
    UpsertDivisionSeasonSchemaRef,
    UpdateDivisionSeasonResponseSchemaRef,
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
    SchedulerProblemSpecSchemaRef,
    SchedulerProblemSpecPreviewSchemaRef,
    SchedulerSeasonSolveRequestSchemaRef,
    SchedulerSeasonApplyRequestSchemaRef,
    SchedulerSolveResultSchemaRef,
    SchedulerApplyRequestSchemaRef,
    SchedulerApplyResultSchemaRef,
    SchedulerFieldAvailabilityRuleSchemaRef,
    SchedulerFieldAvailabilityRuleUpsertSchemaRef,
    SchedulerFieldAvailabilityRulesSchemaRef,
    SchedulerFieldExclusionDateSchemaRef,
    SchedulerFieldExclusionDateUpsertSchemaRef,
    SchedulerFieldExclusionDatesSchemaRef,
    SchedulerSeasonWindowConfigSchemaRef,
    SchedulerSeasonWindowConfigUpsertSchemaRef,
    SchedulerSeasonExclusionSchemaRef,
    SchedulerSeasonExclusionUpsertSchemaRef,
    SchedulerSeasonExclusionsSchemaRef,
    SchedulerTeamExclusionSchemaRef,
    SchedulerTeamExclusionUpsertSchemaRef,
    SchedulerTeamExclusionsSchemaRef,
    SchedulerUmpireExclusionSchemaRef,
    SchedulerUmpireExclusionUpsertSchemaRef,
    SchedulerUmpireExclusionsSchemaRef,
    RoleCheckResponseSchemaRef,
    DiscordTeamForumRemoveRequestSchemaRef,
    AdminDashboardSummarySchemaRef,
    GolfCourseSchemaRef,
    GolfCourseWithTeesSchemaRef,
    GolfCourseTeeSchemaRef,
    GolfLeagueCourseSchemaRef,
    CreateGolfCourseSchemaRef,
    UpdateGolfCourseSchemaRef,
    CreateGolfCourseTeeSchemaRef,
    UpdateGolfCourseTeeSchemaRef,
    AddLeagueCourseSchemaRef,
    UpdateTeePrioritiesSchemaRef,
    ImportExternalCourseSchemaRef,
    GolfLeagueSetupSchemaRef,
    UpdateGolfLeagueSetupSchemaRef,
    GolfAccountInfoSchemaRef,
    GolfFlightSchemaRef,
    GolfFlightWithTeamCountSchemaRef,
    CreateGolfFlightSchemaRef,
    UpdateGolfFlightSchemaRef,
    GolfTeamSchemaRef,
    GolfTeamWithPlayerCountSchemaRef,
    GolfTeamWithRosterSchemaRef,
    CreateGolfTeamSchemaRef,
    UpdateGolfTeamSchemaRef,
    GolfPlayerSchemaRef,
    GolfRosterEntrySchemaRef,
    GolfSubstituteSchemaRef,
    CreateGolfPlayerSchemaRef,
    UpdateGolfPlayerSchemaRef,
    SignPlayerSchemaRef,
    ReleasePlayerSchemaRef,
    AvailablePlayerSchemaRef,
    GolfMatchSchemaRef,
    GolfMatchWithScoresSchemaRef,
    CreateGolfMatchSchemaRef,
    UpdateGolfMatchSchemaRef,
    GolfScoreSchemaRef,
    GolfScoreWithDetailsSchemaRef,
    CreateGolfScoreSchemaRef,
    UpdateGolfScoreSchemaRef,
    SubmitMatchResultsSchemaRef,
    PlayerMatchScoreSchemaRef,
    GolfDifferentialSchemaRef,
    PlayerHandicapSchemaRef,
    LeagueHandicapsSchemaRef,
    CourseHandicapSchemaRef,
    ESCMaxScoreSchemaRef,
    BatchCourseHandicapRequestSchemaRef,
    PlayerCourseHandicapSchemaRef,
    BatchCourseHandicapResponseSchemaRef,
    GolfTeamStandingSchemaRef,
    GolfFlightStandingsSchemaRef,
    GolfLeagueStandingsSchemaRef,
    GolfLeaderSchemaRef,
    GolfScoringAverageSchemaRef,
    GolfSkinsEntrySchemaRef,
    GolfFlightLeadersSchemaRef,
    ExternalCourseSearchResultSchemaRef,
    ExternalCourseDetailSchemaRef,
    ExternalCourseTeeSchemaRef,
    GolferSchemaRef,
    GolferSummarySchemaRef,
    UpdateGolferHomeCourseSchemaRef,
    PlayerSeasonScoresResponseSchemaRef,
    ContactIndividualGolfAccountSchemaRef,
    LiveScoringStateSchemaRef,
    LiveSessionStatusSchemaRef,
    LiveHoleScoreSchemaRef,
    StartLiveScoringSchemaRef,
    SubmitLiveHoleScoreSchemaRef,
    AdvanceHoleSchemaRef,
    FinalizeLiveScoringSchemaRef,
    StopLiveScoringSchemaRef,
    SseTicketResponseSchemaRef,
    IndividualLiveScoringStateSchemaRef,
    IndividualLiveSessionStatusSchemaRef,
    IndividualLiveHoleScoreSchemaRef,
    StartIndividualLiveScoringSchemaRef,
    SubmitIndividualLiveHoleScoreSchemaRef,
    AdvanceIndividualLiveHoleSchemaRef,
    IndividualSseTicketResponseSchemaRef,
    BaseballLiveScoringStateSchemaRef,
    BaseballLiveSessionStatusSchemaRef,
    BaseballLiveInningScoreSchemaRef,
    StartBaseballLiveScoringSchemaRef,
    SubmitBaseballLiveInningScoreSchemaRef,
    AdvanceBaseballInningSchemaRef,
    FinalizeBaseballLiveScoringSchemaRef,
    StopBaseballLiveScoringSchemaRef,
  };
};

export type SchemaRefs = ReturnType<typeof registerSchemaRefs>;

export type RegisterContext = {
  registry: OpenAPIRegistry;
  schemaRefs: SchemaRefs;
  z: (typeof import('zod'))['z'];
};
