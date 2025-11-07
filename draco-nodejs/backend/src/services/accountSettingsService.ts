import {
  ACCOUNT_SETTING_DEFINITIONS,
  AccountSettingDefinition,
  AccountSettingKey,
  AccountSettingState,
  AccountSettingValue,
  AccountSettingValueTypeEnum,
  AccountSettingDependency,
} from '@draco/shared-schemas';
import { RepositoryFactory, IAccountSettingsRepository } from '../repositories/index.js';
import { AccountSettingsResponseFormatter } from '../responseFormatters/index.js';
import { ConflictError, NotFoundError, ValidationError } from '../utils/customErrors.js';

type SettingsValueCache = {
  values: Map<AccountSettingKey, AccountSettingValue>;
  persistedKeys: Set<AccountSettingKey>;
};

export class AccountSettingsService {
  private readonly accountSettingsRepository: IAccountSettingsRepository;
  private readonly definitions: AccountSettingDefinition[] = ACCOUNT_SETTING_DEFINITIONS;
  private readonly definitionMap: Map<AccountSettingKey, AccountSettingDefinition>;
  private readonly dependentsMap: Map<AccountSettingKey, AccountSettingDefinition[]>;

  constructor(repository?: IAccountSettingsRepository) {
    this.accountSettingsRepository = repository ?? RepositoryFactory.getAccountSettingsRepository();
    this.definitionMap = new Map(
      this.definitions.map((definition) => [definition.key, definition]),
    );
    this.dependentsMap = this.buildDependentsMap();
  }

  async getAccountSettings(accountId: bigint): Promise<AccountSettingState[]> {
    const records = await this.accountSettingsRepository.findByAccountId(accountId);
    const cache = this.buildValueCache(records);
    return this.buildStateResponse(cache);
  }

  async updateAccountSetting(
    accountId: bigint,
    settingKey: AccountSettingKey,
    incomingValue: AccountSettingValue,
  ): Promise<AccountSettingState> {
    const definition = this.definitionMap.get(settingKey);

    if (!definition) {
      throw new NotFoundError('Setting not found');
    }

    const normalizedValue = this.normalizeInput(definition, incomingValue);
    const records = await this.accountSettingsRepository.findByAccountId(accountId);
    const cache = this.buildValueCache(records);

    cache.values.set(definition.key, normalizedValue);
    this.ensureDependenciesSatisfied(definition, normalizedValue, cache.values);

    if (this.shouldPersist(definition, normalizedValue)) {
      await this.accountSettingsRepository.upsert(
        accountId,
        definition.key,
        this.toStorage(definition, normalizedValue),
      );
      cache.persistedKeys.add(definition.key);
    } else {
      await this.accountSettingsRepository.delete(accountId, definition.key);
      cache.persistedKeys.delete(definition.key);
    }

    await this.enforceDependentConsistency(accountId, cache, definition.key);

    return this.buildStateForKey(definition, cache);
  }

  private buildDependentsMap(): Map<AccountSettingKey, AccountSettingDefinition[]> {
    const dependents = new Map<AccountSettingKey, AccountSettingDefinition[]>();

    for (const definition of this.definitions) {
      for (const requirement of definition.requires ?? []) {
        const list = dependents.get(requirement.key) ?? [];
        list.push(definition);
        dependents.set(requirement.key, list);
      }
    }

    return dependents;
  }

  private buildValueCache(
    records: { settingkey: string; settingvalue: string }[],
  ): SettingsValueCache {
    const persistedKeys = new Set<AccountSettingKey>();
    const rawMap = new Map<AccountSettingKey, string>();

    for (const record of records) {
      const key = record.settingkey as AccountSettingKey;
      rawMap.set(key, record.settingvalue);
      persistedKeys.add(key);
    }

    const values = new Map<AccountSettingKey, AccountSettingValue>();
    for (const definition of this.definitions) {
      const storedValue = rawMap.get(definition.key);
      const parsedValue = storedValue
        ? this.parseStoredValue(definition, storedValue)
        : definition.defaultValue;
      values.set(definition.key, parsedValue);

      if (parsedValue === definition.defaultValue && !storedValue) {
        persistedKeys.delete(definition.key);
      }
    }

    return { values, persistedKeys };
  }

  private buildStateResponse(cache: SettingsValueCache): AccountSettingState[] {
    const statePayload = this.definitions.map((definition) => {
      const value = cache.values.get(definition.key) ?? definition.defaultValue;
      const requirementsSatisfied = this.areRequirementsSatisfied(definition, cache.values);
      const lockedReason = requirementsSatisfied
        ? undefined
        : this.buildLockedReason(definition, cache.values);

      return {
        definition,
        value,
        effectiveValue: requirementsSatisfied ? value : definition.defaultValue,
        isDefault: !cache.persistedKeys.has(definition.key) && value === definition.defaultValue,
        isLocked: !requirementsSatisfied,
        lockedReason,
      };
    });

    return AccountSettingsResponseFormatter.formatMany(statePayload);
  }

  private buildStateForKey(
    definition: AccountSettingDefinition,
    cache: SettingsValueCache,
  ): AccountSettingState {
    const value = cache.values.get(definition.key) ?? definition.defaultValue;
    const requirementsSatisfied = this.areRequirementsSatisfied(definition, cache.values);
    const lockedReason = requirementsSatisfied
      ? undefined
      : this.buildLockedReason(definition, cache.values);

    return AccountSettingsResponseFormatter.format({
      definition,
      value,
      effectiveValue: requirementsSatisfied ? value : definition.defaultValue,
      isDefault: !cache.persistedKeys.has(definition.key) && value === definition.defaultValue,
      isLocked: !requirementsSatisfied,
      lockedReason,
    });
  }

  private normalizeInput(
    definition: AccountSettingDefinition,
    value: AccountSettingValue,
  ): AccountSettingValue {
    if (definition.valueType === AccountSettingValueTypeEnum.enum.boolean) {
      if (typeof value !== 'boolean') {
        throw new ValidationError(`${definition.label} expects a boolean value.`);
      }
      return value;
    }

    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new ValidationError(`${definition.label} expects a numeric value.`);
    }

    if (!Number.isInteger(value)) {
      throw new ValidationError(`${definition.label} must be a whole number.`);
    }

    const min = definition.valueRange?.min;
    const max = definition.valueRange?.max;

    if (typeof min === 'number' && value < min) {
      throw new ValidationError(`${definition.label} must be at least ${min}.`);
    }

    if (typeof max === 'number' && value > max) {
      throw new ValidationError(`${definition.label} must be at most ${max}.`);
    }

    return value;
  }

  private parseStoredValue(
    definition: AccountSettingDefinition,
    storedValue: string,
  ): AccountSettingValue {
    if (definition.valueType === AccountSettingValueTypeEnum.enum.boolean) {
      return storedValue.toLowerCase() === 'true';
    }

    const parsed = Number(storedValue);
    if (!Number.isFinite(parsed)) {
      return definition.defaultValue;
    }
    return Math.trunc(parsed);
  }

  private toStorage(definition: AccountSettingDefinition, value: AccountSettingValue): string {
    if (definition.valueType === AccountSettingValueTypeEnum.enum.boolean) {
      return (value as boolean) ? 'true' : 'false';
    }
    return String(value);
  }

  private shouldPersist(definition: AccountSettingDefinition, value: AccountSettingValue): boolean {
    return value !== definition.defaultValue;
  }

  private ensureDependenciesSatisfied(
    definition: AccountSettingDefinition,
    candidateValue: AccountSettingValue,
    values: Map<AccountSettingKey, AccountSettingValue>,
  ): void {
    if (!definition.requires?.length) {
      return;
    }

    const unmetRequirement = definition.requires.find((requirement: AccountSettingDependency) => {
      if (candidateValue !== requirement.value) {
        return false;
      }

      const currentValue =
        requirement.key === definition.key
          ? candidateValue
          : (values.get(requirement.key) ??
            this.definitionMap.get(requirement.key)?.defaultValue ??
            requirement.value);

      return currentValue !== requirement.value;
    });

    if (unmetRequirement) {
      const requiredDefinition = this.definitionMap.get(unmetRequirement.key);
      const requiredLabel = requiredDefinition?.label ?? unmetRequirement.key;
      const requiredValueLabel =
        typeof unmetRequirement.value === 'boolean'
          ? unmetRequirement.value
            ? 'enabled'
            : 'disabled'
          : `${unmetRequirement.value}`;

      throw new ConflictError(
        `${definition.label} requires ${requiredLabel} to be ${requiredValueLabel}.`,
      );
    }
  }

  private async enforceDependentConsistency(
    accountId: bigint,
    cache: SettingsValueCache,
    changedKey: AccountSettingKey,
    visited: Set<AccountSettingKey> = new Set(),
  ): Promise<void> {
    if (visited.has(changedKey)) {
      return;
    }
    visited.add(changedKey);

    const dependents = this.dependentsMap.get(changedKey);
    if (!dependents?.length) {
      return;
    }

    for (const dependent of dependents) {
      const requirementsSatisfied = this.areRequirementsSatisfied(dependent, cache.values);
      if (requirementsSatisfied) {
        continue;
      }

      const currentValue = cache.values.get(dependent.key);
      if (currentValue !== dependent.defaultValue || cache.persistedKeys.has(dependent.key)) {
        cache.values.set(dependent.key, dependent.defaultValue);
        if (cache.persistedKeys.has(dependent.key)) {
          await this.accountSettingsRepository.delete(accountId, dependent.key);
          cache.persistedKeys.delete(dependent.key);
        }
      }

      await this.enforceDependentConsistency(accountId, cache, dependent.key, visited);
    }
  }

  private areRequirementsSatisfied(
    definition: AccountSettingDefinition,
    values: Map<AccountSettingKey, AccountSettingValue>,
  ): boolean {
    if (!definition.requires?.length) {
      return true;
    }

    return definition.requires.every((requirement: AccountSettingDependency) => {
      const actualValue =
        values.get(requirement.key) ??
        this.definitionMap.get(requirement.key)?.defaultValue ??
        requirement.value;
      return actualValue === requirement.value;
    });
  }

  private buildLockedReason(
    definition: AccountSettingDefinition,
    values: Map<AccountSettingKey, AccountSettingValue>,
  ): string | undefined {
    if (!definition.requires?.length) {
      return undefined;
    }

    const firstUnmet = definition.requires.find((requirement: AccountSettingDependency) => {
      const actualValue =
        values.get(requirement.key) ??
        this.definitionMap.get(requirement.key)?.defaultValue ??
        requirement.value;
      return actualValue !== requirement.value;
    });

    if (!firstUnmet) {
      return undefined;
    }

    return (
      firstUnmet.description ??
      `Requires ${this.definitionMap.get(firstUnmet.key)?.label ?? firstUnmet.key} to be ${
        typeof firstUnmet.value === 'boolean'
          ? firstUnmet.value
            ? 'enabled'
            : 'disabled'
          : firstUnmet.value
      }.`
    );
  }
}
