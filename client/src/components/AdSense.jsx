import { useEffect, useState } from 'react';

// Env check - strict boolean
const ADS_ENABLED = import.meta.env.VITE_isAdsEnabled === 'true';
const CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID || 'ca-pub-XXXXXXXXXXXXXXXX';

/**
 * Hook to dynamically load AdSense script
 * Only loads once, and only if ads are enabled
 */
function useAdSenseScript() {
  useEffect(() => {
    if (!ADS_ENABLED) return;

    // Check if duplicate
    if (document.querySelector(`script[src*="adsbygoogle.js"]`)) return;

    const script = document.createElement('script');
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT_ID}`;
    script.async = true;
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);

    return () => {
      // Create cleanup if necessary, though typical google ads persist
    };
  }, []);
}

/**
 * Google AdSense Component
 */
export default function AdSense({
  client = CLIENT_ID,
  slot = '1234567890',
  format = 'auto',
  responsive = true,
  style = {},
  className = ''
}) {
  // 1. If disabled via ENV, Render NOTHING. No placeholders.
  if (!ADS_ENABLED) return null;

  // 2. Inject Script (idempotent)
  useAdSenseScript();

  // 3. Push to window.adsbygoogle
  useEffect(() => {
    try {
      if (ADS_ENABLED) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  // 4. Render Ad Unit (Only in Production behavior is standard, but here we obey the flag)
  // Note: Localhost will just show blank space unless we allow dev mode or have test ads.
  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          ...style
        }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
}

/**
 * Predefined ad component variants
 */

export function BannerAd({ className = '' }) {
  if (!ADS_ENABLED) return null;
  return (
    <AdSense
      client={CLIENT_ID}
      slot={import.meta.env.VITE_ADSENSE_BANNER_SLOT || "1234567890"}
      format="horizontal"
      className={className}
      style={{ height: '90px' }}
    />
  );
}

export function RectangleAd({ className = '' }) {
  if (!ADS_ENABLED) return null;
  return (
    <AdSense
      client={CLIENT_ID}
      slot={import.meta.env.VITE_ADSENSE_RECTANGLE_SLOT || "0987654321"}
      format="rectangle"
      className={className}
      style={{ minHeight: '250px' }}
    />
  );
}

export function DisplayAd({ className = '' }) {
  if (!ADS_ENABLED) return null;
  return (
    <AdSense
      client={CLIENT_ID}
      slot={import.meta.env.VITE_ADSENSE_DISPLAY_SLOT || "1122334455"}
      format="auto"
      responsive={true}
      className={className}
    />
  );
}

export function InFeedAd({ className = '' }) {
  if (!ADS_ENABLED) return null;
  return (
    <AdSense
      client={CLIENT_ID}
      slot={import.meta.env.VITE_ADSENSE_INFEED_SLOT || "5544332211"}
      format="fluid"
      className={className}
      style={{ minHeight: '200px' }}
    />
  );
}
