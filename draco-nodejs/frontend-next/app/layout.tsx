import '../app/globals.css';
import { AuthProvider } from '../context/AuthContext';
import { RoleProvider } from '../context/RoleContext';
import { AccountProvider } from '../context/AccountContext';
import ThemeClientProvider from '../components/ThemeClientProvider';

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
