import type { Metadata } from 'next';
import { headers } from 'next/headers';

import { DEFAULT_ACCOUNT_FAVICON_PATH } from './metadataFetchers';
import { DEFAULT_KEYWORDS, DEFAULT_SITE_NAME } from './seoConstants';
export { DEFAULT_DESCRIPTION, DEFAULT_KEYWORDS, DEFAULT_SITE_NAME } from './seoConstants';

function normalizePath(path?: string): string {
  if (!path || path === '/') {
    return '/';
  }
  return path.startsWith('/') ? path : `/${path}`;
}

async function resolveOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const host = requestHeaders.get('host');
  if (!host) {
    throw new Error('seoMetadata.resolveOrigin: missing "host" header on request');
  }
  const proto = requestHeaders.get('x-forwarded-proto') ?? 'https';
  return `${proto}://${host}`;
}

export async function buildCanonicalUrl(path?: string): Promise<string> {
  const origin = await resolveOrigin();
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
  siteName?: string;
}

export async function buildSeoMetadata({
  title,
  description,
  path,
  image,
  icon,
  index = true,
  keywords,
  siteName,
}: BuildSeoMetadataOptions): Promise<Metadata> {
  const canonicalUrl = await buildCanonicalUrl(path);
  const resolvedKeywords = resolveKeywords(keywords);
  const openGraphImages = image ? [image] : undefined;
  const twitterImages = image ? [image] : undefined;
  const resolvedIcon = icon ?? DEFAULT_ACCOUNT_FAVICON_PATH;
  const resolvedSiteName = siteName ?? DEFAULT_SITE_NAME;

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
      siteName: resolvedSiteName,
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
