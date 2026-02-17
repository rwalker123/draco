import type { Metadata } from 'next';
import '../app/globals.css';
import ThemedProviders from '../components/ThemedProviders';
import React, { Suspense } from 'react';
import Script from 'next/script';
import { DEFAULT_DESCRIPTION, DEFAULT_KEYWORDS, DEFAULT_SITE_NAME } from '../lib/seoMetadata';

const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL;
const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const ADSENSE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_ADSENSE === 'true';

export const metadata: Metadata = {
  metadataBase: publicSiteUrl ? new URL(publicSiteUrl) : undefined,
  title: {
    default: DEFAULT_SITE_NAME,
    template: `%s | ${DEFAULT_SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  applicationName: DEFAULT_SITE_NAME,
  openGraph: {
    title: DEFAULT_SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    siteName: DEFAULT_SITE_NAME,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_SITE_NAME,
    description: DEFAULT_DESCRIPTION,
  },
};

const themeBootstrapScript = `(function(){try{var k='draco-theme';var t=window.localStorage.getItem(k);if(!t){var m=document.cookie.match(/draco-theme=(dark|light)/);t=m?m[1]:'light';window.localStorage.setItem(k,t)}if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.setAttribute('data-theme','dark');document.body.style.backgroundColor='#1e1e1e';document.body.style.color='#e0e0e0'}}catch(e){console.info('[ThemeBootstrap]',e)}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body style={{ backgroundColor: '#ffffff', color: '#0f172a' }} suppressHydrationWarning>
        {ADSENSE_ENABLED && ADSENSE_CLIENT_ID ? (
          <Script
            id="google-adsense-script"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
            strategy="beforeInteractive"
            crossOrigin="anonymous"
          />
        ) : null}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        <Suspense>
          <ThemedProviders>{children}</ThemedProviders>
        </Suspense>
      </body>
    </html>
  );
}
