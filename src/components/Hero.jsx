import React from 'react';

export function Hero() {
  return (
    <header className="hero" id="top">
      <div className="wrap">
        <div className="hero-text-block">
          <div className="hero-location-badge">
            <span className="dot-active"></span> TRISHAL, MYMENSINGH SHOWROOM
          </div>

          <h1 className="hero-headline">
            Crafted Timber. <br />
            <span className="hero-highlight">Built for Living.</span>
          </h1>

          <p className="hero-tagline">
            Handcrafted solid Chittagong teak & melamine furniture for everyday home living.
          </p>

          <div className="hero-cta-group">
            <a href="#shop" className="btn btn-hero-primary">
              Shop Collection
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ marginLeft: '8px' }}>
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
            <a href="#material" className="hero-link-secondary">
              Why Melamine Board →
            </a>
          </div>

          {/* High UX Feature Trust Badges */}
          <div className="hero-ux-badges">
            <div className="ux-badge-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <span>Solid Teak & Board</span>
            </div>
            <div className="ux-badge-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
              <span>Local Delivery</span>
            </div>
            <div className="ux-badge-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Factory Direct</span>
            </div>
          </div>
        </div>

        {/* Detailed Furniture Illustration Artwork */}
        <div className="hero-art" aria-hidden="true">
          <svg viewBox="0 0 440 440" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="wallGlow" x1="220" y1="40" x2="220" y2="400" gradientUnits="userSpaceOnUse">
                <stop stopColor="#E7D8B8" stopOpacity="0.45" />
                <stop offset="1" stopColor="#EFEAE1" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="lampGlow" x1="330" y1="140" x2="330" y2="340" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F8F5EF" stopOpacity="0.8" />
                <stop offset="1" stopColor="#F8F5EF" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="walnutGrad" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#6B4226" />
                <stop offset="1" stopColor="#4A2C19" />
              </linearGradient>
              <linearGradient id="oakGrad" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#C9A876" />
                <stop offset="1" stopColor="#B8935C" />
              </linearGradient>
              <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#231D18" floodOpacity="0.08" />
              </filter>
            </defs>

            {/* Background Decorative Arch */}
            <path d="M70 380V180C70 97.1573 137.157 30 220 30C302.843 30 370 97.1573 370 180V380H70Z" fill="url(#wallGlow)" />

            {/* Ambient Lamp Cone Glow */}
            <polygon points="330,130 250,370 410,370" fill="url(#lampGlow)" />

            {/* Floating Melamine Bookshelf on Wall */}
            <g filter="url(#softShadow)">
              <rect x="80" y="120" width="130" height="12" rx="3" fill="url(#oakGrad)" />
              {/* Books on Shelf */}
              <rect x="94" y="82" width="16" height="38" rx="2" fill="#5C6B54" />
              <rect x="113" y="88" width="14" height="32" rx="2" fill="#6B4226" />
              <rect x="130" y="78" width="18" height="42" rx="2" fill="#C9A876" />
              <path d="M152 120 L175 95 L182 99 L162 120 Z" fill="#231D18" opacity="0.6" />
              {/* Small Potted Plant on Shelf */}
              <path d="M190 106h14l-2 14h-10z" fill="#D7DECE" />
              <circle cx="193" cy="98" r="7" fill="#5C6B54" />
              <circle cx="201" cy="95" r="8" fill="#5C6B54" />
            </g>

            {/* Floor Rug Base */}
            <ellipse cx="220" cy="385" rx="170" ry="32" fill="#E4DDD0" stroke="#D3C9B8" strokeWidth="1.5" strokeDasharray="6 4" />

            {/* Main Melamine Study Table / Desk Desk */}
            <g filter="url(#softShadow)">
              {/* Table Legs */}
              <path d="M100 280L88 380H98L108 280Z" fill="#4A2C19" />
              <path d="M260 280L250 380H260L268 280Z" fill="#4A2C19" />
              <path d="M120 280L112 375H122L128 280Z" fill="#6B4226" opacity="0.7" />
              <path d="M242 280L234 375H244L250 280Z" fill="#6B4226" opacity="0.7" />

              {/* Table Drawer Box */}
              <rect x="92" y="255" width="176" height="30" rx="3" fill="#E7D8B8" />
              <line x1="180" y1="255" x2="180" y2="285" stroke="#D3C9B8" strokeWidth="1.5" />
              {/* Handles */}
              <rect x="126" y="267" width="20" height="5" rx="2" fill="#6B4226" />
              <rect x="204" y="267" width="20" height="5" rx="2" fill="#6B4226" />

              {/* Table Surface Top (Walnut Finish) */}
              <rect x="84" y="242" width="192" height="16" rx="3" fill="url(#walnutGrad)" />
              <rect x="86" y="244" width="188" height="4" rx="1" fill="#C9A876" opacity="0.4" />
            </g>

            {/* Items on Table: Modern Laptop + Warm Coffee Mug */}
            <rect x="110" y="238" width="46" height="4" rx="1" fill="#231D18" />
            <path d="M120 212h26l4 26h-34z" fill="#E4DDD0" stroke="#5B5347" strokeWidth="1.5" />
            {/* Mug */}
            <rect x="230" y="226" width="12" height="16" rx="2" fill="#5C6B54" />
            <path d="M242 230c3 0 5 2 5 5s-2 5-5 5" stroke="#5C6B54" strokeWidth="1.5" fill="none" />

            {/* Ergonomic Wooden Chair with Sage Cushion */}
            <g filter="url(#softShadow)">
              {/* Chair Backrest */}
              <path d="M280 230C280 210 295 195 315 195C335 195 350 210 350 230V290H280V230Z" fill="url(#walnutGrad)" />
              <path d="M290 235C290 220 300 208 315 208C330 208 340 220 340 235V280H290V235Z" fill="#5C6B54" />
              
              {/* Chair Cushion Seat */}
              <rect x="270" y="280" width="85" height="18" rx="5" fill="#5C6B54" />
              <rect x="272" y="282" width="81" height="6" rx="2" fill="#D7DECE" opacity="0.5" />

              {/* Chair Wooden Legs */}
              <path d="M280 298L270 380H282L290 298Z" fill="#4A2C19" />
              <path d="M345 298L355 380H343L335 298Z" fill="#4A2C19" />
              <path d="M298 298L294 370H304L306 298Z" fill="#6B4226" />
            </g>

            {/* Floor Lamp Accent */}
            <g filter="url(#softShadow)">
              <line x1="330" y1="130" x2="330" y2="375" stroke="#231D18" strokeWidth="3" strokeLinecap="round" />
              <path d="M312 130L330 90L348 130Z" fill="#C9A876" />
              <ellipse cx="330" cy="375" rx="18" ry="5" fill="#231D18" />
            </g>

            {/* Floating Signature Wooden Planks for Art Movement */}
            <g className="plank" style={{ '--r': '-8deg' }} transform="translate(300,50) rotate(-8)">
              <rect x="0" y="0" width="70" height="14" rx="2" fill="#C9A876" opacity="0.8" />
            </g>
            <g className="plank" style={{ '--r': '6deg' }} transform="translate(30,170) rotate(6)">
              <rect x="0" y="0" width="50" height="10" rx="2" fill="#6B4226" opacity="0.7" />
            </g>
          </svg>
        </div>
      </div>
    </header>
  );
}
