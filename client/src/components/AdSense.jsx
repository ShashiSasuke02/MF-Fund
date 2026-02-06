import { useEffect, useState } from 'react';

// Env check - strict boolean
const ADS_ENABLED = import.meta.env.VITE_ADSENSE_ENABLED === 'true';
const CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID || 'ca-pub-XXXXXXXXXXXXXXXX';

// DEBUG LOG
console.log('[AdSense Debug] Init:', {
  ADS_ENABLED,
  DEV: import.meta.env.DEV,
  rawEnv: import.meta.env.VITE_ADSENSE_ENABLED
});

/**
 * Hook to dynamically load AdSense script
 * Only loads once, and only if ads are enabled
 */
function useAdSenseScript() {
  useEffect(() => {
    if (!ADS_ENABLED || import.meta.env.DEV) return;

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
  if (!ADS_ENABLED) {
    console.log('[AdSense Debug] Disabled by ENV');
    return null;
  }

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

  // 4. Render Ad Unit
  // Dev Mode: Render visible placeholder
  if (import.meta.env.DEV) {
    console.log('[AdSense Debug] Rendering Dev Placeholder');
    return (
      <div
        className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-center p-4 text-xs font-mono text-gray-500 uppercase tracking-wider ${className}`}
        style={{ ...style, display: 'flex' }}
      >
        <div className="font-bold text-gray-400 mb-1">AdSense Unit</div>
        <div className="text-[10px] break-all">Client: {client.slice(0, 10)}...</div>
        <div className="text-[10px]">Slot: {slot}</div>
        <div className="text-[10px]">Format: {format}</div>
      </div>
    );
  }

  // Production: Render actual AdSense unit
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
