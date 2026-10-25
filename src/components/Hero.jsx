import React from 'react';

/**
 * Modern Minimalist Hero Section (Japandi / Architectural Gallery Aesthetic)
 * High-impact typography, generous negative space, and refined trust notes.
 */
export function Hero() {
  return (
    <header className="hero" id="top">
      <div className="wrap">
        <div className="hero-text-block">
          {/* Minimalist Brand Overline */}
          <div className="hero-brand-header">
            <span className="brand-accent-bar" aria-hidden="true"></span>
            <span className="brand-name-text">
              ARCHITECTURAL TIMBER · TRISHAL
            </span>
          </div>

          <h1 className="hero-headline">
            Crafted Timber. <br />
            <span className="hero-highlight">Built to Endure.</span>
          </h1>

          <p className="hero-tagline">
            Solid Chittagong teak and precision board furniture. Built to measure in Trishal, delivered across Trishal, Mymensingh, and nearby areas.
          </p>

          <div className="hero-cta-group">
            <a href="#shop" className="btn btn-hero-primary">
              <span>Explore Collection</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px' }}>
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
            <a href="#bespoke" className="hero-link-secondary">
              Bespoke Commission →
            </a>
          </div>

          {/* Minimalist Architectural Trust Notes */}
          <div className="hero-ux-badges">
            <div className="ux-badge-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <span>Melamine Board</span>
            </div>
            <div className="ux-badge-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="10" rx="1.5"></rect>
                <line x1="6" y1="7" x2="6" y2="11"></line>
                <line x1="10" y1="7" x2="10" y2="13"></line>
                <line x1="14" y1="7" x2="14" y2="11"></line>
                <line x1="18" y1="7" x2="18" y2="13"></line>
              </svg>
              <span>Made to Measure</span>
            </div>
            <div className="ux-badge-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
              <span>South Mymensingh Delivery</span>
            </div>
          </div>
        </div>

        {/* Architectural Showcase Composition */}
        <div className="hero-art" aria-hidden="true">
          <svg viewBox="0 0 440 440" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="wallGlow" x1="220" y1="40" x2="220" y2="400" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F5F4F0" stopOpacity="0.9" />
                <stop offset="1" stopColor="#EFEAE1" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="lampGlow" x1="330" y1="140" x2="330" y2="340" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FAF8F5" stopOpacity="0.6" />
                <stop offset="1" stopColor="#FAF8F5" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="walnutGrad" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#5A3720" />
                <stop offset="1" stopColor="#3A2214" />
              </linearGradient>
              <linearGradient id="oakGrad" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#D4BA90" />
                <stop offset="1" stopColor="#BFA070" />
              </linearGradient>
              <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#1C1917" floodOpacity="0.05" />
              </filter>
            </defs>

            {/* Background Architectural Arch */}
            <path d="M70 380V180C70 97.1573 137.157 30 220 30C302.843 30 370 97.1573 370 180V380H70Z" fill="url(#wallGlow)" />

            {/* Ambient Lighting Cone */}
            <polygon points="330,130 250,370 410,370" fill="url(#lampGlow)" />

            {/* Floating Minimal Shelf */}
            <g filter="url(#softShadow)">
              <rect x="80" y="120" width="130" height="10" rx="2" fill="url(#oakGrad)" />
              {/* Ceramic & Book Accents */}
              <rect x="94" y="86" width="14" height="34" rx="1" fill="#78716C" />
              <rect x="111" y="90" width="12" height="30" rx="1" fill="#44513F" />
              <rect x="126" y="82" width="16" height="38" rx="1" fill="#5A3720" />
              {/* Minimal Ceramic Vase */}
              <ellipse cx="185" cy="112" rx="9" ry="8" fill="#E7E5E4" />
              <line x1="185" y1="104" x2="185" y2="88" stroke="#78716C" strokeWidth="1.2" strokeLinecap="round" />
            </g>

            {/* Floor Oval Foundation */}
            <ellipse cx="220" cy="385" rx="170" ry="28" fill="#F0ECE4" stroke="#E7E5E4" strokeWidth="1" strokeDasharray="4 4" />

            {/* Crafted Melamine Study Table */}
            <g filter="url(#softShadow)">
              {/* Table Legs with Refined Japandi Angles */}
              <path d="M100 280L90 380H98L108 280Z" fill="#3A2214" />
              <path d="M260 280L252 380H260L268 280Z" fill="#3A2214" />
              <path d="M120 280L114 375H122L128 280Z" fill="#5A3720" opacity="0.6" />
              <path d="M242 280L236 375H244L250 280Z" fill="#5A3720" opacity="0.6" />

              {/* Table Body & Drawers */}
              <rect x="92" y="255" width="176" height="28" rx="2" fill="#EAE4D8" />
              <line x1="180" y1="255" x2="180" y2="283" stroke="#DCD6C9" strokeWidth="1.2" />
              {/* Recessed Timber Handles */}
              <rect x="128" y="267" width="18" height="4" rx="1" fill="#5A3720" />
              <rect x="206" y="267" width="18" height="4" rx="1" fill="#5A3720" />

              {/* Solid Walnut Top Surface */}
              <rect x="84" y="244" width="192" height="14" rx="2" fill="url(#walnutGrad)" />
              <rect x="86" y="246" width="188" height="3" rx="1" fill="#D4BA90" opacity="0.3" />
            </g>

            {/* Minimal Notebook & Ceramic Cup */}
            <rect x="115" y="240" width="38" height="3" rx="1" fill="#1C1917" />
            <rect x="232" y="230" width="10" height="14" rx="2" fill="#78716C" />

            {/* Sculptural Timber Chair */}
            <g filter="url(#softShadow)">
              {/* Backrest Curve */}
              <path d="M282 232C282 214 296 200 315 200C334 200 348 214 348 232V288H282V232Z" fill="url(#walnutGrad)" />
              <path d="M292 236C292 222 301 212 315 212C329 212 338 222 338 236V280H292V236Z" fill="#44513F" />
              
              {/* Seat Cushion */}
              <rect x="272" y="280" width="82" height="16" rx="4" fill="#44513F" />
              <rect x="274" y="282" width="78" height="4" rx="1" fill="#D7DECE" opacity="0.35" />

              {/* Chair Legs */}
              <path d="M280 296L272 380H282L288 296Z" fill="#3A2214" />
              <path d="M344 296L352 380H342L336 296Z" fill="#3A2214" />
              <path d="M298 296L295 370H303L305 296Z" fill="#5A3720" />
            </g>

            {/* Floor Lamp Accent */}
            <g filter="url(#softShadow)">
              <line x1="330" y1="130" x2="330" y2="375" stroke="#1C1917" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M314 130L330 94L346 130Z" fill="#BFA070" />
              <ellipse cx="330" cy="375" rx="16" ry="4" fill="#1C1917" />
            </g>
          </svg>
        </div>
      </div>
    </header>
  );
}
