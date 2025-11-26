import { GET } from '../ads.txt/route';

describe('ads.txt route', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns 404 when not configured', async () => {
    delete process.env.ADSENSE_PUBLISHER_ID;

    const response = GET();

    expect(response.status).toBe(404);
    expect(await response.text()).toBe('ads.txt not configured\n');
  });

  it('returns ads.txt content when configured', async () => {
    process.env.ADSENSE_PUBLISHER_ID = 'ca-pub-123456789';

    const response = GET();
    const content = await response.text();

    expect(response.status).toBe(200);
    expect(content).toBe('google.com, pub-123456789, DIRECT, f08c47fec0942fa0\n');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=86400, must-revalidate');
  });

  it('honors relationship override', async () => {
    process.env.ADSENSE_PUBLISHER_ID = 'pub-987654321';
    process.env.ADSENSE_ACCOUNT_RELATIONSHIP = 'RESELLER';

    const response = GET();

    expect(await response.text()).toBe('google.com, pub-987654321, RESELLER, f08c47fec0942fa0\n');
  });
});
