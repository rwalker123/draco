import { buildSeoMetadata } from '@/lib/seoMetadata';
import ContactPage from './ContactPage';

export async function generateMetadata() {
  return buildSeoMetadata({
    title: 'Contact Us | ezRecSports',
    description:
      "Get in touch with the ezRecSports team. We're here to help you manage your sports organization.",
    path: '/contact',
    index: true,
  });
}

export default function Page() {
  return <ContactPage />;
}
