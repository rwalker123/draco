const ADSENSE_CERT_AUTHORITY_ID = 'f08c47fec0942fa0';

const normalizePublisherId = (publisherId: string) => {
  const withoutCaPrefix = publisherId.replace(/^ca-/, '');

  if (withoutCaPrefix.startsWith('pub-')) {
    return withoutCaPrefix;
  }

  return `pub-${withoutCaPrefix}`;
};

export function GET() {
  const publisherId = process.env.ADSENSE_PUBLISHER_ID;
  const accountRelationship = process.env.ADSENSE_ACCOUNT_RELATIONSHIP ?? 'DIRECT';

  if (!publisherId) {
    return new Response('ads.txt not configured\n', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const normalizedPublisherId = normalizePublisherId(publisherId);
  const lines = [`google.com, ${normalizedPublisherId}, ${accountRelationship}, ${ADSENSE_CERT_AUTHORITY_ID}`];

  return new Response(`${lines.join('\n')}\n`, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, must-revalidate',
    },
  });
}
