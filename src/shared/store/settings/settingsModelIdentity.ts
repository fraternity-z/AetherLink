import type { ModelProvider } from '../../config/defaultModels';
import { findModelInProviders, getModelIdentityKey, modelMatchesIdentity, parseModelIdentityKey } from '../../utils/modelUtils';

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

export const canonicalModelKey = (model: { id: string; provider?: string }, providerId: string): string => {
  return getModelIdentityKey({ id: model.id, provider: model.provider || providerId });
};
