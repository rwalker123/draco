'use client';

import * as React from 'react';
import createCache from '@emotion/cache';
import type { EmotionCache } from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { useServerInsertedHTML } from 'next/navigation';

interface EmotionCacheProviderProps {
  children: React.ReactNode;
}

type EmotionCacheRecord = {
  cache: EmotionCache;
  flush: () => string[];
};

function createEmotionCacheRecord(): EmotionCacheRecord {
  const cache = createCache({ key: 'mui', prepend: true });
  cache.compat = true;

  const prevInsert = cache.insert;
  const insertedNames = new Set<string>();

  cache.insert = (...args) => {
    const [, serialized] = args;
    if (cache.inserted[serialized.name] === undefined) {
      insertedNames.add(serialized.name);
    }
    return prevInsert(...args);
  };

  const flush = () => {
    const names = Array.from(insertedNames);
    insertedNames.clear();
    return names;
  };

  return { cache, flush };
}

export default function EmotionCacheProvider({ children }: EmotionCacheProviderProps) {
  const [{ cache, flush }] = React.useState(createEmotionCacheRecord);

  useServerInsertedHTML(() => {
    const names = flush();

    if (names.length === 0) {
      return null;
    }

    const styles = names.map((name) => cache.inserted[name]).join('');

    return (
      <style
        dangerouslySetInnerHTML={{ __html: styles }}
        data-emotion={`${cache.key} ${names.join(' ')}`}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
