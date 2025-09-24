import Link from 'next/link';
import { headers } from 'next/headers';
import {
  DEFAULT_SITE_NAME,
  buildCanonicalUrl,
  resolveCurrentPath,
} from '../lib/seoMetadata';

const CRAWLER_USER_AGENT_REGEX = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|sogou|facebot|ia_archiver/i;

function getHeaderSafe(key: string): string | undefined {
  try {
    return headers().get(key) ?? undefined;
  } catch {
    return undefined;
  }
}

function getUserAgent(): string {
  return getHeaderSafe('user-agent') ?? '';
}

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  console.error('Global application error captured by Next.js boundary', {
    message: error.message,
    digest: error.digest,
  });

  const userAgent = getUserAgent();
  const requestPath = resolveCurrentPath() ?? '/';
  const canonical = buildCanonicalUrl(requestPath);
  const isCrawler = CRAWLER_USER_AGENT_REGEX.test(userAgent);

  if (isCrawler) {
    return (
      <html lang="en">
        <head>
          <title>{`${DEFAULT_SITE_NAME} | Temporary content issue`}</title>
          <meta
            name="description"
            content="We encountered a temporary issue while rendering this page. Please check back soon for the latest schedules, rosters, and announcements."
          />
          <meta
            name="robots"
            content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1"
          />
          <link rel="canonical" href={canonical} />
          <style>{`
            body{font-family:Arial,Helvetica,sans-serif;margin:0;padding:0;background:#f4f6f8;color:#101828;}
            main{max-width:720px;margin:0 auto;padding:72px 24px;text-align:center;}
            h1{font-size:2rem;margin-bottom:16px;}
            p{font-size:1rem;line-height:1.6;margin:0 0 12px;}
          `}</style>
        </head>
        <body>
          <main>
            <h1>We&rsquo;ll be right back</h1>
            <p>
              Draco Sports Manager is temporarily unable to load this content. Rankings and structured data
              will be restored shortly.
            </p>
            <p>
              Please retry this request soon to keep indexes synchronized with the latest sports schedules and
              updates.
            </p>
          </main>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        <title>Something went wrong | {DEFAULT_SITE_NAME}</title>
        <meta name="robots" content="noindex, nofollow" />
        <style>{`
          body{font-family:Arial,Helvetica,sans-serif;margin:0;padding:0;background:#f4f6f8;color:#101828;}
          main{max-width:640px;margin:0 auto;padding:72px 24px;text-align:center;}
          h1{font-size:2rem;margin-bottom:16px;}
          p{font-size:1rem;line-height:1.6;margin:0 0 20px;}
          a{color:#2563eb;text-decoration:none;font-weight:600;}
        `}</style>
      </head>
      <body>
        <main>
          <h1>Something went wrong</h1>
          <p>
            We couldn&rsquo;t finish loading this page. Try refreshing the page or return to your home dashboard to
            continue working.
          </p>
          <p>
            <Link href="/">Return to home</Link>
          </p>
        </main>
      </body>
    </html>
  );
}
