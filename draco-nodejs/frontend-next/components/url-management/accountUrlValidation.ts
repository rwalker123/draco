import { CreateAccountUrlSchema } from '@draco/shared-schemas';

export type AccountUrlProtocol = 'https://' | 'http://';

const accountUrlSchema = CreateAccountUrlSchema.shape.url;

export const sanitizeDomainInput = (domain: string): string => {
  return domain.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
};

export const buildAccountUrlPreview = (
  protocol: AccountUrlProtocol,
  domain: string,
): string | null => {
  const sanitizedDomain = sanitizeDomainInput(domain);

  if (!sanitizedDomain) {
    return null;
  }

  return `${protocol}${sanitizedDomain}`;
};

export const validateAccountUrlInput = (
  protocol: AccountUrlProtocol,
  domain: string,
):
  | { success: true; url: string }
  | { success: false; error: string } => {
  const sanitizedDomain = sanitizeDomainInput(domain);
  const candidateUrl = sanitizedDomain ? `${protocol}${sanitizedDomain}` : '';
  const result = accountUrlSchema.safeParse(candidateUrl);

  if (!result.success) {
    const message =
      result.error.issues[0]?.message ??
      'Invalid URL format. Please use http:// or https:// followed by a valid domain.';

    return { success: false, error: message };
  }

  return { success: true, url: result.data };
};
