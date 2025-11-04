import AccountsClientWrapper from './AccountsClientWrapper';
import { buildSeoMetadata, DEFAULT_SITE_NAME } from '../../lib/seoMetadata';

export async function generateMetadata() {
  return buildSeoMetadata({
    title: `Accounts - ${DEFAULT_SITE_NAME}`,
    description: `Explore leagues, clubs, and programs powered by ${DEFAULT_SITE_NAME} to discover schedules, rosters, and team information.`,
    path: '/accounts',
  });
}

export default function Page() {
  return <AccountsClientWrapper />;
}
