import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

/**
 * Native Banner Component (320x50 Standard Mobile Leaderboard)
 * 
 * Non-intrusive, native aesthetic fitting the Japandi architecture design.
 * Positioned cleanly within document flow (e.g. above footer or between sections).
 * Supports Adsterra / CPM network script snippets (<script ...></script><div id="..."></div>)
 * with automatic fallback to direct image + link if scripts are blocked by ad blockers.
 */
export function NativeBanner({ placement = 'footer', className = '' }) {
  const [banner, setBanner] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scriptLoadFailed, setScriptLoadFailed] = useState(false);
  const adScriptContainerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    api.getNativeBanner()
      .then((res) => {
        if (isMounted && res && res.data) {
          setBanner(res.data);
        }
      })
      .catch((err) => {
        console.warn('[NativeBanner] Failed to load banner:', err.message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Determine if this instance should run the script when placement === 'both'
  const isHomePage = typeof window !== 'undefined' && (window.location.pathname === '/' || window.location.pathname === '');
  const hasScriptSnippet = Boolean(banner?.adScriptCode && banner.adScriptCode.trim());
  const shouldRunScript = hasScriptSnippet && !scriptLoadFailed && (
    banner?.placement !== 'both' ||
    (placement === 'home_mid' && isHomePage) ||
    (placement === 'footer' && !isHomePage)
  );

  // When adScriptCode is provided, dynamically inject and execute script elements in React
  useEffect(() => {
    if (!shouldRunScript || !adScriptContainerRef.current || !banner?.adScriptCode) return;

    const container = adScriptContainerRef.current;
    container.innerHTML = '';

    let checkTimer = null;

    try {
      const parser = new DOMParser();
      const parsedDoc = parser.parseFromString(banner.adScriptCode, 'text/html');

      // 1. Extract ALL script tags from anywhere in parsedDoc (both <head> and <body>)
      const scripts = Array.from(parsedDoc.querySelectorAll('script'));

      // 2. Remove script tags from parsedDoc so they don't get inserted as static unexecuted tags
      scripts.forEach((s) => s.remove());

      // 3. Mount the non-script DOM elements (like <div id="container-...">)
      const nonScriptHtml = (parsedDoc.head?.innerHTML || '') + (parsedDoc.body?.innerHTML || '');
      container.innerHTML = nonScriptHtml;

      // 4. Dynamically create executable <script> elements and append them
      scripts.forEach((oldScript) => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        if (oldScript.innerHTML) {
          newScript.innerHTML = oldScript.innerHTML;
        }

        // Catch ad blocker blocks (e.g. net::ERR_BLOCKED_BY_CLIENT)
        newScript.onerror = () => {
          console.warn('[NativeBanner] External ad script blocked or failed to load. Switching to fallback banner.');
          setScriptLoadFailed(true);
        };

        container.appendChild(newScript);
      });

      // 5. Watchdog timer: If ad container remains completely empty after 3.5s (ad blocker or 0 fill rate),
      // switch to the direct image/link fallback banner so users never see blank empty space
      checkTimer = setTimeout(() => {
        if (container) {
          const targetDiv = container.querySelector('[id^="container-"]');
          if (targetDiv && targetDiv.childElementCount === 0 && targetDiv.innerHTML.trim() === '') {
            console.warn('[NativeBanner] Ad container remained empty after 3.5s. Rendering fallback banner creative.');
            setScriptLoadFailed(true);
          }
        }
      }, 3500);

    } catch (err) {
      console.warn('[NativeBanner] Script injection error:', err);
      setScriptLoadFailed(true);
    }

    return () => {
      if (checkTimer) clearTimeout(checkTimer);
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [shouldRunScript, banner?.adScriptCode]);

  // Do not render if loading, inactive, or not matching placement rule
  if (isLoading || !banner || !banner.isActive) {
    return null;
  }

  // Filter by placement: 'footer' | 'home_mid' | 'both'
  const isMatchPlacement =
    banner.placement === 'both' ||
    banner.placement === placement ||
    (!banner.placement && placement === 'footer');

  if (!isMatchPlacement) {
    return null;
  }

  const destinationUrl = banner.adestraLink || '#';
  const openInNew = banner.openInNewTab !== false;

  return (
    <aside
      className={`native-banner-wrapper ${className}`}
      aria-label="Sponsored Promotion"
    >
      <div className={`native-banner-inner ${shouldRunScript ? 'has-ad-widget' : 'is-single-banner'}`}>
        {/* Subtle, non-intrusive sponsored label */}
        <div className="native-banner-meta">
          <span className="native-banner-badge">{banner.badgeText || 'SPONSORED'}</span>
          {banner.title && banner.title.toLowerCase() !== (banner.badgeText || '').toLowerCase() ? (
            <span className="native-banner-sponsor-title">{banner.title}</span>
          ) : (
            <span className="native-banner-sponsor-title">Architectural Partner Recommendations</span>
          )}
        </div>

        {/* 1. Dynamic Adsterra / CPM Network Script Embed Slot */}
        {shouldRunScript ? (
          <div
            className="native-banner-script-slot"
            ref={adScriptContainerRef}
          />
        ) : (
          /* 2. Exact 320x50 Direct Image & Adestra Link Slot (Active or Fallback) */
          <a
            href={destinationUrl}
            target={openInNew ? '_blank' : '_self'}
            rel="noopener noreferrer sponsored"
            className="native-banner-slot"
            title={banner.title || 'Explore Partner Offer'}
          >
            {banner.imageUrl ? (
              <img
                src={banner.imageUrl}
                alt={banner.altText || banner.title || 'Sponsored Advertisement'}
                className="native-banner-img"
                width="320"
                height="50"
                loading="lazy"
              />
            ) : (
              /* Elegant native fallback card when no custom 320x50 image has been uploaded */
              <div className="native-banner-fallback">
                <div className="fallback-icon-col">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    <path d="M2 17l10 5 10-5"></path>
                    <path d="M2 12l10 5 10-5"></path>
                  </svg>
                </div>
                <div className="fallback-copy-col">
                  <strong className="fallback-title">
                    {banner.title || 'ShahLajuk Architectural Collections'}
                  </strong>
                  <span className="fallback-tagline">
                    Crafted in Trishal · Tap to explore collections
                  </span>
                </div>
                <div className="fallback-cta-col">
                  <span className="fallback-arrow-pill">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </span>
                </div>
              </div>
            )}
          </a>
        )}
      </div>
    </aside>
  );
}

export default NativeBanner;
