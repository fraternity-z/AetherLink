import type { Model } from '../../types';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ModelProvider } from '../../config/defaultModels';
import { findModelInProviders, getModelIdentityKey, modelMatchesIdentity, parseModelIdentityKey } from '../../utils/modelUtils';
import type { SettingsState } from './types';

export const ensureModelIdentityKey = (identifier: string | undefined, providers: ModelProvider[]): string | undefined => {
  if (!identifier) return undefined;

  const parsed = parseModelIdentityKey(identifier);
  if (!parsed) return undefined;

  if (parsed.provider) {
    return getModelIdentityKey(parsed);
  }

  const matched = findModelInProviders(providers, identifier, { includeDisabled: true });
  if (matched) {
    return getModelIdentityKey({
      id: matched.model.id,
      provider: matched.model.provider || matched.provider.id
    });
  }

  return getModelIdentityKey(parsed);
};

export const setDefaultFlags = (providers: ModelProvider[], identityKey?: string): void => {
  const identity = parseModelIdentityKey(identityKey);

  providers.forEach(provider => {
    provider.models = provider.models.map(model => ({
      ...model,
      isDefault: modelMatchesIdentity(model, identity, provider.id)
    }));
  });
};

export const canonicalModelKey = (model: Model, providerId: string): string => {
  return getModelIdentityKey({ id: model.id, provider: model.provider || providerId });
};

// 简单属性 setter 工厂，减少样板代码
export const createSetter = <K extends keyof SettingsState>(key: K) =>
  (state: SettingsState, action: PayloadAction<SettingsState[K]>) => {
    state[key] = action.payload;
  };
