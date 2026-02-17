import { cookies } from 'next/headers';
import { AuthProvider } from '../context/AuthContext';
import { RoleProvider } from '../context/RoleContext';
import { AccountProvider } from '../context/AccountContext';
import ThemeClientProvider from './ThemeClientProvider';
import { MemoryTracker } from './MemoryTracker';
import React from 'react';

export default async function ThemedProviders({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get('draco-theme')?.value;
  const initialTheme =
    cookieTheme === 'dark' || cookieTheme === 'light' ? (cookieTheme as 'dark' | 'light') : 'light';

  return (
    <>
      {process.env.NODE_ENV === 'development' && <MemoryTracker />}
      <AuthProvider>
        <RoleProvider>
          <AccountProvider>
            <ThemeClientProvider initialThemeName={initialTheme}>{children}</ThemeClientProvider>
          </AccountProvider>
        </RoleProvider>
      </AuthProvider>
    </>
  );
}
