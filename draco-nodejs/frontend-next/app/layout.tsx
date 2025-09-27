import type { Metadata } from 'next';
import '../app/globals.css';
import { AuthProvider } from '../context/AuthContext';
import { RoleProvider } from '../context/RoleContext';
import { AccountProvider } from '../context/AccountContext';
import ThemeClientProvider from '../components/ThemeClientProvider';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_SITE_NAME,
} from '../lib/seoMetadata';

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <RoleProvider>
            <AccountProvider>
              <ThemeClientProvider>{children}</ThemeClientProvider>
            </AccountProvider>
          </RoleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
