'use client';
import Accounts from './Accounts';
import { buildSeoMetadata } from '../../lib/seoMetadata';

export async function generateMetadata() {
  return buildSeoMetadata({
    title: 'Sports Organizations on Draco Sports Manager',
    description:
      'Explore leagues, clubs, and programs powered by Draco Sports Manager to discover schedules, rosters, and team information.',
    path: '/accounts',
  });
}

export default function Page() {
  return <Accounts />;
}
