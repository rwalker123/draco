import HomeClientWrapper from './HomeClientWrapper';
import { DEFAULT_DESCRIPTION, DEFAULT_SITE_NAME, buildSeoMetadata } from '../lib/seoMetadata';

export async function generateMetadata() {
  return buildSeoMetadata({
    title: DEFAULT_SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    path: '/',
  });
}

export default function Page() {
  return <HomeClientWrapper />;
}
