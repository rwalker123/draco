'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import Box from '@mui/material/Box';

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const ACCOUNT_HEADER_AD_SLOT = process.env.NEXT_PUBLIC_ADSENSE_ACCOUNT_HEADER_SLOT;
const ADSENSE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_ADSENSE === 'true';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

const AdSenseBanner: React.FC = () => {
  const adUnitRef = useRef<HTMLModElement>(null);
  const shouldRenderAd = Boolean(ADSENSE_ENABLED && ADSENSE_CLIENT_ID && ACCOUNT_HEADER_AD_SLOT);

  useEffect(() => {
    if (!shouldRenderAd || !adUnitRef.current) {
      return;
    }

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.error('Adsense error', error);
    }
  }, [shouldRenderAd]);

  if (!shouldRenderAd) {
    return null;
  }

  return (
    <>
      <Script
        id="google-adsense-script"
        strategy="afterInteractive"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
        async
        crossOrigin="anonymous"
      />
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
          ref={adUnitRef}
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', minHeight: 90 }}
          data-ad-client={ADSENSE_CLIENT_ID}
          data-ad-slot={ACCOUNT_HEADER_AD_SLOT}
          data-ad-format="auto"
          data-full-width-responsive="true"
          aria-label="Advertisement"
        />
      </Box>
    </>
  );
};

export default AdSenseBanner;
