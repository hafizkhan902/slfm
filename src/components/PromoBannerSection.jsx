import React, { useState, useEffect } from 'react';
import { useProducts } from '../context/ProductContext';
import { api } from '../services/api';

// Custom Vector SVG Art for Promo Posters
function PromoTeakArt() {
  return (
    <svg viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="promo-z-svg-art">
      <defs>
        <radialGradient id="promoGoldGlowZ" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C9A876" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#6B4226" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="zWoodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C9A876" />
          <stop offset="100%" stopColor="#6B4226" />
        </linearGradient>
      </defs>
      <circle cx="160" cy="110" r="90" fill="url(#promoGoldGlowZ)" />
      <path d="M 40 180 C 60 90 260 90 280 180" stroke="#C9A876" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />

      {/* Mid-Century Minimal Sofa Vector */}
      <rect x="75" y="125" width="170" height="18" rx="4" fill="url(#zWoodGrad)" stroke="#4A2C19" strokeWidth="1.5" />
      <path d="M 70 90 C 70 80 85 75 160 75 C 235 75 250 80 250 90 L 245 125 L 75 125 Z" fill="#F8F5EF" stroke="#4A2C19" strokeWidth="2" />
      <line x1="85" y1="143" x2="70" y2="185" stroke="#4A2C19" strokeWidth="4" strokeLinecap="round" />
      <line x1="235" y1="143" x2="250" y2="185" stroke="#4A2C19" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="160" cy="186" rx="90" ry="6" fill="#231D18" opacity="0.25" />
    </svg>
  );
}

function PromoJoineryArt() {
  return (
    <svg viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="promo-z-svg-art">
      <defs>
        <radialGradient id="promoSageGlowZ" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#D7DECE" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#5C6B54" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="110" r="85" fill="url(#promoSageGlowZ)" />

      {/* Modular Architectural Wardrobe */}
      <rect x="95" y="45" width="130" height="135" rx="5" fill="#F8F5EF" stroke="#5C6B54" strokeWidth="2.2" />
      <line x1="160" y1="45" x2="160" y2="180" stroke="#5C6B54" strokeWidth="1.8" />
      <circle cx="150" cy="115" r="3" fill="#5C6B54" />
      <circle cx="170" cy="115" r="3" fill="#5C6B54" />

      {/* Plant & Leaf Details */}
      <path d="M 55 180 C 50 145 38 135 25 140 C 20 150 42 162 60 180" fill="#5C6B54" opacity="0.85" />
      <ellipse cx="160" cy="181" rx="80" ry="5" fill="#231D18" opacity="0.2" />
    </svg>
  );
}

export function PromoBannerSection() {
  const { promos } = useProducts();
  const [isPromoEnabled, setIsPromoEnabled] = useState(true);

  useEffect(() => {
    const checkPromoSettings = async () => {
      try {
        const data = await api.getSettings();
        if (data && data.isPromoBannerEnabled !== undefined) {
          setIsPromoEnabled(Boolean(data.isPromoBannerEnabled));
        }
      } catch (err) {
        console.warn('[PromoBannerSection] Failed to load promo banner setting:', err.message);
      }
    };

    checkPromoSettings();

    const handleSettingsUpdate = () => {
      checkPromoSettings();
    };

    window.addEventListener('shahlajuk_settings_updated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('shahlajuk_settings_updated', handleSettingsUpdate);
    };
  }, []);

  const handleBannerClick = (anchor) => {
    if (anchor) {
      const el = document.querySelector(anchor);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!isPromoEnabled) return null;

  return (
    <section className="promo-z-section">
      <div className="wrap">
        <div className="section-head-minimal" style={{ marginBottom: '28px' }}>
          <span className="section-kicker">CURATED PROMOTIONS & OFFERS</span>
          <h2 className="section-title">Exclusive Artisanal Deals</h2>
        </div>

        {/* Z-Pattern Alternating Banners Container */}
        <div className="promo-z-container">
          {promos.map((banner, index) => {
            const isReverse = banner.layoutDirection === 'reverse' || index % 2 === 1;

            return (
              <div
                className={`promo-z-card ${banner.theme} ${isReverse ? 'z-reverse' : 'z-normal'}`}
                key={banner.id}
              >
                {/* Text Content Column */}
                <div className="promo-z-text-side">
                  <div className="promo-z-top-bar">
                    <span className="promo-badge">{banner.badge}</span>
                    <span className="promo-discount-pill">{banner.discountPill}</span>
                  </div>

                  <h3 className="promo-z-title">{banner.title}</h3>
                  <p className="promo-z-sub">{banner.subtitle}</p>

                  <div className="promo-z-bottom-action">
                    <button
                      type="button"
                      className="promo-cta-btn"
                      onClick={() => handleBannerClick(banner.linkAnchor)}
                    >
                      {banner.buttonText}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Vector Artwork Column */}
                <div className="promo-z-art-side">
                  {banner.artType === 'living-set' ? <PromoTeakArt /> : <PromoJoineryArt />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
