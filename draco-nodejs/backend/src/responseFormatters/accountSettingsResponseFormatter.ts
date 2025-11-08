import {
  AccountSettingDefinition,
  AccountSettingState,
  AccountSettingValue,
} from '@draco/shared-schemas';

interface AccountSettingStateParams {
  definition: AccountSettingDefinition;
  value: AccountSettingValue;
  effectiveValue: AccountSettingValue;
  isDefault: boolean;
  isLocked: boolean;
  lockedReason?: string;
}

export class AccountSettingsResponseFormatter {
  static format(params: AccountSettingStateParams): AccountSettingState {
    return {
      definition: params.definition,
      value: params.value,
      effectiveValue: params.effectiveValue,
      isDefault: params.isDefault,
      isLocked: params.isLocked,
      lockedReason: params.lockedReason,
    };
  }

  static formatMany(states: AccountSettingStateParams[]): AccountSettingState[] {
    return states.map((state) => this.format(state));
  }
}
