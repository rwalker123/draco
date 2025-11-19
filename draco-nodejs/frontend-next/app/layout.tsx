import type { Metadata } from 'next';
import '../app/globals.css';
import { AuthProvider } from '../context/AuthContext';
import { RoleProvider } from '../context/RoleContext';
import { AccountProvider } from '../context/AccountContext';
import ThemeClientProvider from '../components/ThemeClientProvider';
import React from 'react';
import { cookies } from 'next/headers';
import { DEFAULT_DESCRIPTION, DEFAULT_KEYWORDS, DEFAULT_SITE_NAME } from '../lib/seoMetadata';

const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL;

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get('draco-theme')?.value;
  const initialTheme =
    cookieTheme === 'dark' || cookieTheme === 'light' ? (cookieTheme as 'dark' | 'light') : 'light';
  const themeInitScript = `
    (function() {
      try {
        var storageKey = 'draco-theme';
        var existing = window.localStorage.getItem(storageKey);
        if (!existing) {
          window.localStorage.setItem(storageKey, '${initialTheme}');
        }
      } catch (error) {
        console.info('[ThemeBootstrap] Failed to sync localStorage', error);
      }
    })();
  `;

  const bodyBackground = initialTheme === 'dark' ? '#1e1e1e' : '#f4f6fb';
  const bodyColor = initialTheme === 'dark' ? '#e0e0e0' : '#0f172a';

  return (
    <html
      lang="en"
      className={initialTheme === 'dark' ? 'dark' : undefined}
      data-theme={initialTheme}
    >
      <body style={{ backgroundColor: bodyBackground, color: bodyColor }}>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <AuthProvider>
          <RoleProvider>
            <AccountProvider>
              <ThemeClientProvider initialThemeName={initialTheme}>{children}</ThemeClientProvider>
            </AccountProvider>
          </RoleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
