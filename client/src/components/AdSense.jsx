import { useEffect } from 'react';

/**
 * Google AdSense Component
 * @param {string} client - Your AdSense client ID (ca-pub-XXXXXXXXXXXXXXXX)
 * @param {string} slot - Ad unit slot ID
 * @param {string} format - Ad format (auto, rectangle, horizontal, vertical)
 * @param {boolean} responsive - Whether the ad is responsive
 * @param {string} style - Additional inline styles
 */
export default function AdSense({ 
  client = import.meta.env.VITE_ADSENSE_CLIENT_ID || 'ca-pub-XXXXXXXXXXXXXXXX',
  slot = '1234567890',
  format = 'auto',
  responsive = true,
  style = {},
  className = ''
}) {
  const adsEnabled = import.meta.env.VITE_ADSENSE_ENABLED === 'true';

  useEffect(() => {
    try {
      // Push ad to AdSense
      if (window.adsbygoogle && import.meta.env.PROD && adsEnabled) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  // Don't show ads in development mode or if disabled
  if (!import.meta.env.PROD || !adsEnabled) {
    return (
      <div className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center ${className}`}>
        <div className="text-gray-500 text-sm font-semibold">AdSense Placeholder</div>
        <div className="text-gray-400 text-xs mt-1">Ads will appear here in production</div>
        <div className="text-gray-400 text-xs mt-1">Client: {client} | Slot: {slot}</div>
      </div>
    );
  }

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

// Banner ad for top/bottom of pages
export function BannerAd({ className = '' }) {
  return (
    <AdSense
      client={import.meta.env.VITE_ADSENSE_CLIENT_ID}
      slot={import.meta.env.VITE_ADSENSE_BANNER_SLOT || "1234567890"}
      format="horizontal"
      className={className}
      style={{ height: '90px' }}
    />
  );
}

// Rectangle ad for sidebars
export function RectangleAd({ className = '' }) {
  return (
    <AdSense
      client={import.meta.env.VITE_ADSENSE_CLIENT_ID}
      slot={import.meta.env.VITE_ADSENSE_RECTANGLE_SLOT || "0987654321"}
      format="rectangle"
      className={className}
      style={{ minHeight: '250px' }}
    />
  );
}

// Responsive display ad
export function DisplayAd({ className = '' }) {
  return (
    <AdSense
      client={import.meta.env.VITE_ADSENSE_CLIENT_ID}
      slot={import.meta.env.VITE_ADSENSE_DISPLAY_SLOT || "1122334455"}
      format="auto"
      responsive={true}
      className={className}
    />
  );
}

// In-feed ad for lists
export function InFeedAd({ className = '' }) {
  return (
    <AdSense
      client={import.meta.env.VITE_ADSENSE_CLIENT_ID}
      slot={import.meta.env.VITE_ADSENSE_INFEED_SLOT || "5544332211"}
      format="fluid"
      className={className}
      style={{ minHeight: '200px' }}
    />
  );
}
