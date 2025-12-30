'use client';

import { useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const DEFAULT_AD_SLOT = process.env.NEXT_PUBLIC_ADSENSE_ACCOUNT_HEADER_SLOT;
const ADSENSE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_ADSENSE === 'true';
const IS_DEV = process.env.NODE_ENV !== 'production';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

type AdPlacementProps = {
  slot?: string | null;
  layout?: 'auto' | 'in-article' | 'fluid' | 'horizontal';
  minHeight?: number;
  wrapperSx?: SxProps<Theme>;
};

const AdPlacement: React.FC<AdPlacementProps> = ({
  slot = DEFAULT_AD_SLOT ?? undefined,
  layout = 'horizontal',
  minHeight = 90,
  wrapperSx,
}) => {
  const adUnitRef = useRef<HTMLElement>(null);
  const hasRequestedAd = useRef(false);
  const resolvedSlot = slot ?? undefined;
  const shouldRender = Boolean(ADSENSE_ENABLED && ADSENSE_CLIENT_ID && resolvedSlot);

  useEffect(() => {
    if (!shouldRender || !adUnitRef.current) {
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
  }, [shouldRender]);

  if (!shouldRender) {
    return null;
  }

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        pt: 2,
        px: { xs: 1.5, sm: 3 },
        ...wrapperSx,
      }}
    >
      <ins
        ref={(node) => {
          adUnitRef.current = node;
        }}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', minHeight }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={resolvedSlot}
        data-adtest={IS_DEV ? 'on' : undefined}
        data-ad-format={layout}
        data-full-width-responsive="true"
        aria-label="Advertisement"
      />
    </Box>
  );
};

export default AdPlacement;
