import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

/**
 * Native Banner Component (320x50 Standard Mobile Leaderboard)
 * 
 * Non-intrusive, native aesthetic fitting the Japandi architecture design.
 * Positioned cleanly within document flow (e.g. above footer or between sections).
 * Supports Adsterra / CPM network script snippets (<script ...></script><div id="..."></div>)
 * as well as direct image + link fallback.
 */
export function NativeBanner({ placement = 'footer', className = '' }) {
  const [banner, setBanner] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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

  // When adScriptCode is provided, dynamically inject and execute script elements in React
  useEffect(() => {
    if (!banner?.adScriptCode || !adScriptContainerRef.current) return;

    const container = adScriptContainerRef.current;
    container.innerHTML = '';

    try {
      const parser = new DOMParser();
      const parsedDoc = parser.parseFromString(banner.adScriptCode, 'text/html');

      const childNodes = Array.from(parsedDoc.body.childNodes);
      const scriptsToInject = [];

      // 1. Insert non-script DOM elements (like <div id="container-...">)
      childNodes.forEach((node) => {
        if (node.nodeName.toLowerCase() === 'script') {
          scriptsToInject.push(node);
        } else {
          container.appendChild(node.cloneNode(true));
        }
      });

      // 2. Dynamically create and execute scripts so Adsterra invoke.js runs in React
      scriptsToInject.forEach((oldScript) => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        if (oldScript.innerHTML) {
          newScript.innerHTML = oldScript.innerHTML;
        }
        container.appendChild(newScript);
      });
    } catch (err) {
      console.warn('[NativeBanner] Script injection error:', err);
    }

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [banner?.adScriptCode]);

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
  const hasScriptSnippet = Boolean(banner.adScriptCode && banner.adScriptCode.trim());

  return (
    <aside
      className={`native-banner-wrapper ${className}`}
      aria-label="Sponsored Promotion"
    >
      <div className="native-banner-inner">
        {/* Subtle, non-intrusive sponsored label */}
        <div className="native-banner-meta">
          <span className="native-banner-badge">{banner.badgeText || 'SPONSORED'}</span>
          <span className="native-banner-sponsor-title">{banner.title || 'Partner Promotion'}</span>
        </div>

        {/* 1. Dynamic Adsterra / CPM Network Script Embed Slot */}
        {hasScriptSnippet ? (
          <div
            className="native-banner-script-slot"
            ref={adScriptContainerRef}
            style={{
              minWidth: '320px',
              minHeight: '50px',
              width: '320px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'visible'
            }}
          />
        ) : (
          /* 2. Exact 320x50 Direct Image & Adestra Link Slot */
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
