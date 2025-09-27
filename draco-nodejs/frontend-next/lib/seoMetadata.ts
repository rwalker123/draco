import type { Metadata } from 'next';

import { DEFAULT_ACCOUNT_FAVICON_PATH } from './metadataFetchers';
import { DEFAULT_KEYWORDS, DEFAULT_SITE_NAME } from './seoConstants';
export { DEFAULT_DESCRIPTION, DEFAULT_KEYWORDS, DEFAULT_SITE_NAME } from './seoConstants';

const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL;
const FALLBACK_ORIGIN = process.env.NEXT_PUBLIC_FALLBACK_URL ?? 'http://localhost:3000';

function normalizePath(path?: string): string {
  if (!path || path === '/') {
    return '/';
  }
  return path.startsWith('/') ? path : `/${path}`;
}

function resolveOrigin(): string {
  if (PUBLIC_SITE_URL) {
    try {
      const url = new URL(PUBLIC_SITE_URL);
      url.pathname = '/';
      return url.toString().replace(/\/$/, '');
    } catch {
      // Fall back to environment-based resolution
    }
  }

  return FALLBACK_ORIGIN.replace(/\/$/, '');
}

export function buildCanonicalUrl(path?: string): string {
  const origin = resolveOrigin();
  const pathname = normalizePath(path);
  try {
    return new URL(pathname, origin).toString();
  } catch {
    return `${origin}${pathname}`;
  }
}

function buildRobots(index: boolean) {
  return {
    index,
    follow: index,
    googleBot: {
      index,
      follow: index,
      'max-snippet': -1,
      'max-image-preview': 'large' as const,
      'max-video-preview': -1,
    },
  };
}

function resolveKeywords(keywords?: string[]): string[] {
  if (!keywords || keywords.length === 0) {
    return DEFAULT_KEYWORDS;
  }
  const keywordSet = new Set<string>([...DEFAULT_KEYWORDS, ...keywords]);
  return Array.from(keywordSet);
}

interface BuildSeoMetadataOptions {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  icon?: string | null;
  index?: boolean;
  keywords?: string[];
}

export function buildSeoMetadata({
  title,
  description,
  path,
  image,
  icon,
  index = true,
  keywords,
}: BuildSeoMetadataOptions): Metadata {
  const canonicalUrl = buildCanonicalUrl(path);
  const resolvedKeywords = resolveKeywords(keywords);
  const openGraphImages = image ? [image] : undefined;
  const twitterImages = image ? [image] : undefined;
  const resolvedIcon = icon ?? DEFAULT_ACCOUNT_FAVICON_PATH;

  return {
    title,
    description,
    keywords: resolvedKeywords,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: buildRobots(index),
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: DEFAULT_SITE_NAME,
      type: 'website',
      ...(openGraphImages ? { images: openGraphImages } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(twitterImages ? { images: twitterImages } : {}),
    },
    icons: {
      icon: resolvedIcon,
    },
  } satisfies Metadata;
}
