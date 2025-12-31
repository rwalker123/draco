import GolfLeagueSetupPageClient from './GolfLeagueSetupPageClient';

export const metadata = {
  title: 'League Setup | Golf Admin',
  description: 'Configure golf league schedule, officers, and scoring rules',
};

export default function LeagueSetupPage() {
  return <GolfLeagueSetupPageClient />;
}
