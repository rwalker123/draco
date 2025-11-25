import { z } from 'zod';

export const AccountSettingValueTypeEnum = z.enum(['boolean', 'number']);
export type AccountSettingValueType = z.infer<typeof AccountSettingValueTypeEnum>;

export const ACCOUNT_SETTING_KEYS = [
  'ShowBusinessDirectory',
  'ShowPlayerClassified',
  'ShowPlayerSurvey',
  'ShowHOF',
  'AllowPhotoUploads',
  'TrackWaiver',
  'ShowWaiver',
  'TrackIdentification',
  'ShowIdentification',
  'TrackGamesPlayed',
  'ShowRosterCard',
  'ShowUserInfoOnRosterPage',
  'ShowContactInfo',
  'EditContactInfo',
  'PostGameResultsToDiscord',
  'PostGameResultsToTwitter',
  'PostGameResultsToBluesky',
  'SyncInstagramToGallery',
] as const;

export const AccountSettingKeySchema = z.enum(ACCOUNT_SETTING_KEYS);
export type AccountSettingKey = z.infer<typeof AccountSettingKeySchema>;

export const AccountSettingValueSchema = z.union([z.boolean(), z.number().finite()]);
export type AccountSettingValue = z.infer<typeof AccountSettingValueSchema>;

export const AccountSettingGroupEnum = z.enum([
  'accountFeatures',
  'playerData',
  'contactInformation',
  'teamPages',
]);
export type AccountSettingGroupId = z.infer<typeof AccountSettingGroupEnum>;

export const AccountSettingHiddenBehaviorEnum = z.enum(['omit', 'notFound']);
export type AccountSettingHiddenBehavior = z.infer<typeof AccountSettingHiddenBehaviorEnum>;

export const AccountSettingComponentGateSchema = z.object({
  id: z.string().min(1, 'Component id is required.'),
  type: z.enum(['page', 'widget']),
  displayName: z.string(),
  hiddenBehavior: AccountSettingHiddenBehaviorEnum.optional(),
  expectedValue: AccountSettingValueSchema.optional(),
});
export type AccountSettingComponentGate = z.infer<typeof AccountSettingComponentGateSchema>;

export const AccountSettingDependencySchema = z.object({
  key: AccountSettingKeySchema,
  value: AccountSettingValueSchema,
  description: z.string().optional(),
});
export type AccountSettingDependency = z.infer<typeof AccountSettingDependencySchema>;

export const AccountSettingDefinitionSchema = z.object({
  key: AccountSettingKeySchema,
  label: z.string(),
  description: z.string(),
  groupId: AccountSettingGroupEnum,
  groupLabel: z.string(),
  sortOrder: z.number().int(),
  valueType: AccountSettingValueTypeEnum,
  defaultValue: AccountSettingValueSchema,
  valueRange: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
  requires: z.array(AccountSettingDependencySchema).optional(),
  componentGates: z.array(AccountSettingComponentGateSchema).optional(),
});
export type AccountSettingDefinition = z.infer<typeof AccountSettingDefinitionSchema>;

const booleanSetting = (
  partial: Omit<AccountSettingDefinition, 'valueType' | 'defaultValue'> & {
    defaultValue?: boolean;
  },
): AccountSettingDefinition => ({
  valueType: AccountSettingValueTypeEnum.enum.boolean,
  defaultValue: partial.defaultValue ?? false,
  ...partial,
});

export const ACCOUNT_SETTING_DEFINITIONS: AccountSettingDefinition[] = [
  booleanSetting({
    key: 'ShowBusinessDirectory',
    label: 'Show Member Business Directory',
    description:
      'Enables the Member Business Directory page and related navigation for this account.',
    groupId: AccountSettingGroupEnum.enum.accountFeatures,
    groupLabel: 'Account Features',
    sortOrder: 10,
    componentGates: [
      {
        id: 'account.memberBusiness.page',
        type: 'page',
        displayName: 'Member Business Directory Page',
        hiddenBehavior: 'notFound',
        expectedValue: true,
      },
      {
        id: 'navigation.memberBusiness.link',
        type: 'widget',
        displayName: 'Member Business Navigation Link',
        expectedValue: true,
      },
      {
        id: 'profile.memberBusiness.card',
        type: 'widget',
        displayName: 'Member Business Profile Card',
        expectedValue: true,
      },
      {
        id: 'admin.memberBusiness.toggle',
        type: 'widget',
        displayName: 'Member Business Directory Toggle',
        expectedValue: true,
      },
    ],
  }),
  booleanSetting({
    key: 'ShowPlayerClassified',
    label: 'Show Player Classifieds',
    description: 'Enables the player/teams wanted classifieds section and pages.',
    groupId: AccountSettingGroupEnum.enum.accountFeatures,
    groupLabel: 'Account Features',
    sortOrder: 30,
    componentGates: [
      {
        id: 'account.playerClassified.page',
        type: 'page',
        displayName: 'Player Classified Page',
        hiddenBehavior: 'notFound',
        expectedValue: true,
      },
      {
        id: 'navigation.playerClassified.link',
        type: 'widget',
        displayName: 'Player Classified Navigation Link',
        expectedValue: true,
      },
      {
        id: 'home.playerClassified.widget',
        type: 'widget',
        displayName: 'Account Home Player Classified Widget',
        expectedValue: true,
      },
      {
        id: 'team.playerClassified.cta',
        type: 'widget',
        displayName: 'Team Page Player Classified CTA',
        expectedValue: true,
      },
    ],
  }),
  booleanSetting({
    key: 'ShowPlayerSurvey',
    label: 'Show Player Survey',
    description: 'Turns on player survey links, widgets, and interview features.',
    groupId: AccountSettingGroupEnum.enum.accountFeatures,
    groupLabel: 'Account Features',
    sortOrder: 40,
    componentGates: [
      {
        id: 'account.playerSurvey.page',
        type: 'page',
        displayName: 'Player Survey Page',
        hiddenBehavior: 'notFound',
        expectedValue: true,
      },
      {
        id: 'account.playerSurvey.widget',
        type: 'widget',
        displayName: 'Player Survey Widget',
        expectedValue: true,
      },
      {
        id: 'profile.contactSurvey.link',
        type: 'widget',
        displayName: 'Contact Card Player Survey Shortcut',
        expectedValue: true,
      },
      {
        id: 'team.playerInterview.widget',
        type: 'widget',
        displayName: 'Player Interview Widget',
        expectedValue: true,
      },
      {
        id: 'admin.playerSurvey.toggle',
        type: 'widget',
        displayName: 'Player Survey Availability Toggle',
        expectedValue: true,
      },
    ],
  }),
  booleanSetting({
    key: 'ShowHOF',
    label: 'Show Hall Of Fame',
    description: 'Makes the Hall of Fame page and widgets available when data exists.',
    groupId: AccountSettingGroupEnum.enum.accountFeatures,
    groupLabel: 'Account Features',
    sortOrder: 60,
    componentGates: [
      {
        id: 'account.hallOfFame.page',
        type: 'page',
        displayName: 'Hall Of Fame Page',
        hiddenBehavior: 'notFound',
        expectedValue: true,
      },
      {
        id: 'account.home.hallOfFame',
        type: 'widget',
        displayName: 'Hall Of Fame Widget',
        expectedValue: true,
      },
      {
        id: 'admin.hallOfFame.toggle',
        type: 'widget',
        displayName: 'Hall Of Fame Availability Toggle',
        expectedValue: true,
      },
    ],
  }),
  booleanSetting({
    key: 'AllowPhotoUploads',
    label: 'Allow Users to Upload Photos',
    description: 'Enables users to upload photos for approval to Account and Teams.',
    groupId: AccountSettingGroupEnum.enum.accountFeatures,
    groupLabel: 'Account Features',
    sortOrder: 70,
    componentGates: [
      {
        id: 'account.home.photoUploadWidget',
        type: 'widget',
        displayName: 'Photo Upload Widget',
        expectedValue: true,
      },
    ],
  }),
  booleanSetting({
    key: 'PostGameResultsToDiscord',
    label: 'Post game results to Discord',
    description:
      'Automatically share final scores in a Discord game results channel and mirror updates to team channels.',
    groupId: AccountSettingGroupEnum.enum.accountFeatures,
    groupLabel: 'Account Features',
    sortOrder: 80,
  }),
  booleanSetting({
    key: 'PostGameResultsToTwitter',
    label: 'Post game results to Twitter',
    description: 'Publish final scores to the connected Twitter account when games are completed.',
    groupId: AccountSettingGroupEnum.enum.accountFeatures,
    groupLabel: 'Account Features',
    sortOrder: 90,
  }),
  booleanSetting({
    key: 'PostGameResultsToBluesky',
    label: 'Post game results to Bluesky',
    description: 'Publish final scores to the connected Bluesky account when games are completed.',
    groupId: AccountSettingGroupEnum.enum.accountFeatures,
    groupLabel: 'Account Features',
    sortOrder: 95,
  }),
  booleanSetting({
    key: 'SyncInstagramToGallery',
    label: 'Sync Instagram photos to gallery',
    description:
      'When enabled, newly ingested Instagram media is added to your Photo Gallery albums.',
    groupId: AccountSettingGroupEnum.enum.accountFeatures,
    groupLabel: 'Account Features',
    sortOrder: 96,
  }),
  booleanSetting({
    key: 'TrackWaiver',
    label: 'Track Player Waivers',
    description: 'Allows managers to record player waiver submissions.',
    groupId: AccountSettingGroupEnum.enum.playerData,
    groupLabel: 'Player Data',
    sortOrder: 10,
    componentGates: [
      {
        id: 'roster.waiverTracking',
        type: 'widget',
        displayName: 'Waiver Tracking Controls',
        expectedValue: true,
      },
    ],
  }),
  booleanSetting({
    key: 'ShowWaiver',
    label: 'Show Waiver Status',
    description: 'Displays waiver status columns on roster pages.',
    groupId: AccountSettingGroupEnum.enum.playerData,
    groupLabel: 'Player Data',
    sortOrder: 20,
    requires: [
      {
        key: 'TrackWaiver',
        value: true,
        description: 'Waiver status can only be shown when waiver tracking is enabled.',
      },
    ],
    componentGates: [
      {
        id: 'roster.waiverStatus',
        type: 'widget',
        displayName: 'Roster Waiver Status Column',
        expectedValue: true,
      },
    ],
  }),
  booleanSetting({
    key: 'TrackIdentification',
    label: 'Track Player Identification',
    description: 'Allows managers to track whether ID documents have been received.',
    groupId: AccountSettingGroupEnum.enum.playerData,
    groupLabel: 'Player Data',
    sortOrder: 30,
    componentGates: [
      {
        id: 'roster.identificationTracking',
        type: 'widget',
        displayName: 'Identification Tracking Controls',
        expectedValue: true,
      },
    ],
  }),
  booleanSetting({
    key: 'ShowIdentification',
    label: 'Show Identification Status',
    description: 'Displays identification status columns when tracking is enabled.',
    groupId: AccountSettingGroupEnum.enum.playerData,
    groupLabel: 'Player Data',
    sortOrder: 40,
    requires: [
      {
        key: 'TrackIdentification',
        value: true,
        description: 'Identification status can only be shown when tracking is enabled.',
      },
    ],
    componentGates: [
      {
        id: 'roster.identificationStatus',
        type: 'widget',
        displayName: 'Roster Identification Status Column',
        expectedValue: true,
      },
    ],
  }),
  booleanSetting({
    key: 'TrackGamesPlayed',
    label: 'Track Games Played',
    description: 'Records each player’s games played for roster, schedule, and scoreboard views.',
    groupId: AccountSettingGroupEnum.enum.playerData,
    groupLabel: 'Player Data',
    sortOrder: 50,
    componentGates: [
      {
        id: 'roster.gamesPlayed',
        type: 'widget',
        displayName: 'Roster Games Played Column',
        expectedValue: true,
      },
      {
        id: 'schedule.gamesPlayed',
        type: 'widget',
        displayName: 'Schedule Games Played Indicator',
        expectedValue: true,
      },
      {
        id: 'scoreboard.gamesPlayed',
        type: 'widget',
        displayName: 'Scoreboard Games Played Widget',
        expectedValue: true,
      },
    ],
  }),
  booleanSetting({
    key: 'ShowRosterCard',
    label: 'Show Printable Roster Card',
    description: 'Makes the printable roster card available to team managers.',
    groupId: AccountSettingGroupEnum.enum.teamPages,
    groupLabel: 'Team Pages',
    sortOrder: 10,
    componentGates: [
      {
        id: 'team.printableRosterCard',
        type: 'widget',
        displayName: 'Printable Roster Card',
        expectedValue: true,
        hiddenBehavior: 'notFound',
      },
    ],
  }),
  booleanSetting({
    key: 'ShowUserInfoOnRosterPage',
    label: 'Show Contact Info on Roster',
    description: 'Displays player contact information on roster screens.',
    groupId: AccountSettingGroupEnum.enum.teamPages,
    groupLabel: 'Team Pages',
    sortOrder: 20,
    componentGates: [
      {
        id: 'roster.contactInformation',
        type: 'widget',
        displayName: 'Roster Contact Information block',
        expectedValue: true,
      },
    ],
  }),
  booleanSetting({
    key: 'ShowContactInfo',
    label: 'Show Contact Information page',
    description: 'Allows end users to view their saved contact information.',
    groupId: AccountSettingGroupEnum.enum.contactInformation,
    groupLabel: 'Contact Information',
    sortOrder: 10,
    componentGates: [
      {
        id: 'account.manage.contactInfo',
        type: 'page',
        displayName: 'My Information Page',
        hiddenBehavior: 'notFound',
        expectedValue: true,
      },
    ],
  }),
  booleanSetting({
    key: 'EditContactInfo',
    label: 'Allow users to edit contact information',
    description: 'Permits contacts to edit their profile details within My Information.',
    groupId: AccountSettingGroupEnum.enum.contactInformation,
    groupLabel: 'Contact Information',
    sortOrder: 20,
    requires: [
      {
        key: 'ShowContactInfo',
        value: true,
        description: 'Editing is only available when contact info is visible.',
      },
    ],
    componentGates: [
      {
        id: 'account.manage.contactInfo.editing',
        type: 'widget',
        displayName: 'Contact Info Editing Controls',
        expectedValue: true,
      },
    ],
  }),
];

export const AccountSettingDefinitionsSchema = z.array(AccountSettingDefinitionSchema);
export type AccountSettingDefinitions = z.infer<typeof AccountSettingDefinitionsSchema>;

export const AccountSettingStateSchema = z.object({
  definition: AccountSettingDefinitionSchema,
  value: AccountSettingValueSchema,
  effectiveValue: AccountSettingValueSchema,
  isDefault: z.boolean(),
  isLocked: z.boolean(),
  lockedReason: z.string().optional(),
});
export type AccountSettingState = z.infer<typeof AccountSettingStateSchema>;

export const AccountSettingsStateListSchema = z.array(AccountSettingStateSchema);
export type AccountSettingsStateList = z.infer<typeof AccountSettingsStateListSchema>;

export const AccountSettingUpdateRequestSchema = z.object({
  value: AccountSettingValueSchema,
});
export type AccountSettingUpdateRequest = z.infer<typeof AccountSettingUpdateRequestSchema>;
