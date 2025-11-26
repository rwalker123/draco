'use client';

import { useEffect, useRef } from 'react';
import Box from '@mui/material/Box';

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const ACCOUNT_HEADER_AD_SLOT = process.env.NEXT_PUBLIC_ADSENSE_ACCOUNT_HEADER_SLOT;
const ADSENSE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_ADSENSE === 'true';
const IS_DEV = process.env.NODE_ENV !== 'production';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

const AdSenseBanner: React.FC = () => {
  const adUnitRef = useRef<HTMLElement>(null);
  const hasRequestedAd = useRef(false);
  const shouldRenderAd = Boolean(ADSENSE_ENABLED && ADSENSE_CLIENT_ID && ACCOUNT_HEADER_AD_SLOT);

  useEffect(() => {
    if (!shouldRenderAd || !adUnitRef.current) {
      return;
    }

    const adElement = adUnitRef.current;

    // Avoid pushing twice in dev/StrictMode or fast refresh if the unit is already initialized
    if (hasRequestedAd.current || adElement.getAttribute('data-adsbygoogle-status')) {
      return;
    }

    hasRequestedAd.current = true;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      hasRequestedAd.current = false;
      console.error('Adsense error', error);
    }
  }, [shouldRenderAd]);

  if (!shouldRenderAd) {
    return null;
  }

  return (
    <>
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          pt: 2,
          px: { xs: 1.5, sm: 3 },
        }}
      >
        <ins
          ref={(node) => {
            adUnitRef.current = node;
          }}
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', minHeight: 90 }}
          data-ad-client={ADSENSE_CLIENT_ID}
          data-ad-slot={ACCOUNT_HEADER_AD_SLOT}
          data-adtest={IS_DEV ? 'on' : undefined}
          data-ad-format="auto"
          data-full-width-responsive="true"
          aria-label="Advertisement"
        />
      </Box>
    </>
  );
};

export default AdSenseBanner;
