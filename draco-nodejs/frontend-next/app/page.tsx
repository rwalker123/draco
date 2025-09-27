import HomeClientWrapper from './HomeClientWrapper';
import { DEFAULT_DESCRIPTION, buildSeoMetadata } from '../lib/seoMetadata';

export async function generateMetadata() {
  return buildSeoMetadata({
    title: 'Draco Sports Manager',
    description: DEFAULT_DESCRIPTION,
    path: '/',
  });
}

export default function Page() {
  return <HomeClientWrapper />;
}
