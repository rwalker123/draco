export type MetadataSearchParams = Promise<URLSearchParams> | undefined;

type SearchParamsInput =
  | MetadataSearchParams
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

const cloneRecord = (
  record: Record<string, string | string[] | undefined>,
): Record<string, string | string[] | undefined> => ({ ...record });

const isPromise = (value: unknown): value is Promise<unknown> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof (value as { then: unknown }).then === 'function'
  );
};

const urlSearchParamsToRecord = (params: URLSearchParams) => {
  const entries: Record<string, string | string[]> = {};
  params.forEach((value, key) => {
    if (entries[key]) {
      const existing = entries[key];
      entries[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
    } else {
      entries[key] = value;
    }
  });
  return entries;
};

export const normalizeSearchParams = async (
  searchParams: SearchParamsInput,
): Promise<Record<string, string | string[] | undefined>> => {
  if (!searchParams) {
    return {};
  }

  const resolved = isPromise(searchParams) ? await searchParams : searchParams;

  if (!resolved) {
    return {};
  }

  if (resolved instanceof URLSearchParams) {
    return urlSearchParamsToRecord(resolved);
  }

  return cloneRecord(resolved);
};

export const getFirstQueryValue = async (
  searchParams: SearchParamsInput,
  key: string,
): Promise<string | undefined> => {
  const params = await normalizeSearchParams(searchParams);
  const value = params[key];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value ?? undefined;
};

export type MetadataParams<P extends Record<string, string>> = Promise<P>;

export const resolveRouteParams = async <P extends Record<string, string>>(
  params: MetadataParams<P> | P,
): Promise<P> => {
  if (isPromise(params)) {
    return await params;
  }

  return params as P;
};
