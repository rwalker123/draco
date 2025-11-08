import {
  ACCOUNT_SETTING_DEFINITIONS,
  type AccountSettingDefinition,
  type AccountSettingKey,
  type AccountSettingValue,
} from '@draco/shared-schemas';

export type ComponentGateConfig = {
  settingKey: AccountSettingKey;
  expectedValue: AccountSettingValue;
  hiddenBehavior: 'omit' | 'notFound';
  definition: AccountSettingDefinition;
};

const gateMap = new Map<string, ComponentGateConfig>();

for (const definition of ACCOUNT_SETTING_DEFINITIONS) {
  for (const gate of definition.componentGates ?? []) {
    gateMap.set(gate.id, {
      settingKey: definition.key,
      expectedValue: gate.expectedValue ?? true,
      hiddenBehavior: gate.hiddenBehavior ?? 'omit',
      definition,
    });
  }
}

export function getComponentGate(componentId: string): ComponentGateConfig | undefined {
  return gateMap.get(componentId);
}
