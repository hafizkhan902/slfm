import React, { useState, useEffect } from 'react';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { ProductCard } from './ProductCard';
import { ProductSkeletonGrid } from './ProductSkeleton';
import { NativeBanner } from './NativeBanner';
import { api } from '../services/api';

const DEFAULT_THEME_SECTION = {
  eyebrow: 'CURATED ARCHITECTURE & THEMES',
  heading: 'Spaces Sculpted for Serenity',
  subheading: 'We design with the belief that calm interiors create quiet minds. Explore our architectural collections curated for modern living.',
  cards: [
    {
      badgeText: 'THEME 01',
      imageUrl: '',
      category: 'LIVING & LOUNGE',
      title: 'The Minimalist Living Room',
      description: 'Solid Chittagong teak sofas and architectural low-tables. Proportion, tactile grain, and generous negative space that allows rooms to breathe.',
      buttonText: 'Explore Living Collection',
      buttonLink: 'room:living-room',
      order: 1
    },
    {
      badgeText: 'THEME 02',
      imageUrl: '',
      category: 'MATERIALITY',
      title: 'Warm Japandi Textures',
      description: "An organic dialogue between raw timber and moisture-sealed melamine board. Crafted for Bangladesh's humid seasons without warping.",
      buttonText: 'Learn About Board Durability',
      buttonLink: '#material',
      order: 2
    },
    {
      badgeText: 'THEME 03',
      imageUrl: '',
      category: 'STUDY & STORAGE',
      title: 'Modular Architectural Joinery',
      description: 'Clean-lined study desks, ergonomic bookshelves, and multi-door wardrobes engineered with smooth silent hardware for lifetime utility.',
      buttonText: 'Explore Study & Desks',
      buttonLink: 'room:reading-room',
      order: 3
    }
  ]
};

/**
 * Modern Minimalist Homepage Layout (Japandi / Architectural Gallery Aesthetic)
 * Architecture:
 * 1. Bold, Full-Bleed Editorial Hero
 * 2. Asymmetric Editorial Storytelling Blocks (Curated Themes)
 * 3. Spacious 3-Column Featured Works Grid
 * 4. Materiality & Craft Assurance Section
 */
export function Home({ onCatalogClick, onSelectProduct, onSelectRoom, onSelectCategory }) {
  const { products = [], isLoading } = useProducts();
  const { addToCart, setIsCartOpen, setIsCustomInquiryOpen } = useCart();
  const [addedIds, setAddedIds] = useState({});
  const [themeSection, setThemeSection] = useState(DEFAULT_THEME_SECTION);

  const featuredItems = (products || []).slice(0, 6);
  const themeCards = Array.isArray(themeSection?.cards) && themeSection.cards.length > 0
    ? themeSection.cards
    : DEFAULT_THEME_SECTION.cards;

  useEffect(() => {
    let isMounted = true;
    api.getThemeSection()
      .then((res) => {
        if (isMounted && res && res.data) {
          setThemeSection((prev) => ({
            ...prev,
            ...res.data,
            cards: Array.isArray(res.data.cards) && res.data.cards.length > 0 ? res.data.cards : prev.cards
          }));
        }
      })
      .catch((err) => {
        console.warn('Could not load dynamic theme section, using defaults:', err.message);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    addToCart(product, 1);
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1600);
  };

  const handleBuyNow = (e, product) => {
    e.stopPropagation();
    addToCart(product, 1);
    setIsCartOpen(true);
  };

  const handleThemeLink = (link) => {
    if (!link) return;
    const cleanLink = link.trim();
    if (cleanLink.startsWith('#')) {
      const el = document.querySelector(cleanLink);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.hash = cleanLink;
      }
      return;
    }
    if (cleanLink === '/catalog' || cleanLink === '/shop' || cleanLink === 'catalog' || cleanLink === '#shop') {
      onCatalogClick && onCatalogClick();
      return;
    }
    if (cleanLink.startsWith('room:')) {
      onSelectRoom && onSelectRoom(cleanLink.replace('room:', ''));
      return;
    }
    if (cleanLink.includes('/living') || cleanLink === 'living-room') {
      onSelectRoom && onSelectRoom('living-room');
      return;
    }
    if (cleanLink.includes('/reading') || cleanLink.includes('/study') || cleanLink === 'reading-room') {
      onSelectRoom && onSelectRoom('reading-room');
      return;
    }
    if (cleanLink.includes('/bed') || cleanLink === 'bed-room') {
      onSelectRoom && onSelectRoom('bed-room');
      return;
    }
    if (cleanLink.includes('/dining') || cleanLink === 'dining-room') {
      onSelectRoom && onSelectRoom('dining-room');
      return;
    }
    if (cleanLink.startsWith('category:') || cleanLink.startsWith('cat:')) {
      onSelectCategory && onSelectCategory(cleanLink.replace(/^(category:|cat:)/, ''));
      return;
    }
    if (cleanLink.startsWith('http://') || cleanLink.startsWith('https://')) {
      window.open(cleanLink, '_blank', 'noopener,noreferrer');
      return;
    }
    onCatalogClick && onCatalogClick();
  };

  const renderCardGraphic = (card, index) => {
    if (card.imageUrl && card.imageUrl.trim()) {
      return (
        <div className="story-visual-canvas custom-image-canvas">
          <img
            src={card.imageUrl}
            alt={card.title || 'Curated theme'}
            className="story-custom-card-img"
            loading="lazy"
          />
          <div className="canvas-grain-overlay"></div>
          <div className="story-art-badge">{card.badgeText || `THEME 0${index + 1}`}</div>
        </div>
      );
    }

    if (index === 0) {
      return (
        <div className="story-visual-canvas living-canvas">
          <div className="canvas-grain-overlay"></div>
          <div className="story-art-badge">{card.badgeText || 'THEME 01'}</div>
          <div className="story-ambient-art">
            <svg viewBox="0 0 360 240" fill="none" className="ambient-svg">
              <rect x="40" y="140" width="280" height="40" rx="4" fill="#5A3720" />
              <rect x="50" y="80" width="260" height="60" rx="4" fill="#EAE5DC" />
              <line x1="60" y1="180" x2="40" y2="220" stroke="#3A2214" strokeWidth="4" />
              <line x1="300" y1="180" x2="320" y2="220" stroke="#3A2214" strokeWidth="4" />
            </svg>
          </div>
        </div>
      );
    }

    if (index === 1) {
      return (
        <div className="story-visual-canvas material-canvas">
          <div className="canvas-grain-overlay"></div>
          <div className="story-art-badge">{card.badgeText || 'THEME 02'}</div>
          <div className="swatch-pair-showcase">
            <div className="swatch-pill teak-swatch">
              <span className="swatch-name">Solid Teak</span>
            </div>
            <div className="swatch-pill melamine-swatch">
              <span className="swatch-name">Matte Board</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="story-visual-canvas study-canvas">
        <div className="canvas-grain-overlay"></div>
        <div className="story-art-badge">{card.badgeText || 'THEME 03'}</div>
        <div className="study-geometry-art">
          <div className="desk-plane"></div>
          <div className="shelf-line"></div>
        </div>
      </div>
    );
  };

  return (
    <div className="home-layout-container">
      {/* 1. BOLD, FULL-BLEED EDITORIAL HERO */}
      <section className="editorial-hero" id="top">
        <div className="hero-atmosphere-backdrop" aria-hidden="true"></div>
        <div className="editorial-hero-wrap">
          <div className="hero-content-col">
            <div className="hero-brand-kicker">
              <span className="kicker-line"></span>
              <span className="kicker-text">ARCHITECTURAL TIMBER · TRISHAL</span>
            </div>

            <h1 className="hero-main-title">
              Crafted Engineered Wood.<br />
              <span className="hero-title-italic">Built to Endure.</span>
            </h1>

            <p className="hero-narrative-text">
              Solid Chittagong teak and precision board furniture. Built to measure in Trishal, delivered across Trishal, Mymensingh, and nearby areas.
            </p>

            <div className="hero-actions-row">
              <button
                type="button"
                className="btn-editorial-primary"
                onClick={onCatalogClick}
              >
                <span>Explore Collection</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>

              <button
                type="button"
                className="btn-editorial-ghost hero-bespoke-cta-btn"
                onClick={() => setIsCustomInquiryOpen(true)}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
                <span>Bespoke Commission</span>
              </button>
            </div>

            {/* Quiet Hairline Trust Notes */}
            <div className="hero-credo-bar">
              <div className="credo-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <span>Melamine Board</span>
              </div>
              <span className="credo-sep">·</span>
              <div className="credo-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="10" rx="1.5"></rect>
                  <line x1="6" y1="7" x2="6" y2="11"></line>
                  <line x1="10" y1="7" x2="10" y2="13"></line>
                  <line x1="14" y1="7" x2="14" y2="11"></line>
                  <line x1="18" y1="7" x2="18" y2="13"></line>
                </svg>
                <span>Made to Measure</span>
              </div>
              <span className="credo-sep">·</span>
              <div className="credo-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
                <span>South Mymensingh Delivery</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Architecture Canvas */}
          <div className="hero-art-showcase" aria-hidden="true">
            <div className="art-frame-card">
              <svg viewBox="0 0 440 440" fill="none" xmlns="http://www.w3.org/2000/svg" className="hero-sculpture-svg">
                <defs>
                  <linearGradient id="warmWallGrad" x1="220" y1="30" x2="220" y2="400" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F5F4F0" stopOpacity="0.95" />
                    <stop offset="1" stopColor="#EAE5DC" stopOpacity="0.4" />
                  </linearGradient>
                  <linearGradient id="teakGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop stopColor="#5A3720" />
                    <stop offset="1" stopColor="#3A2214" />
                  </linearGradient>
                  <linearGradient id="oakTone" x1="0" y1="0" x2="1" y2="1">
                    <stop stopColor="#D4BA90" />
                    <stop offset="1" stopColor="#BFA070" />
                  </linearGradient>
                  <filter id="galleryShadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#1C1917" floodOpacity="0.06" />
                  </filter>
                </defs>

                {/* Architectural Arch Form */}
                <path d="M70 380V180C70 97.1573 137.157 30 220 30C302.843 30 370 97.1573 370 180V380H70Z" fill="url(#warmWallGrad)" />

                {/* Quiet Floating Bookshelf */}
                <g filter="url(#galleryShadow)">
                  <rect x="85" y="115" width="125" height="9" rx="2" fill="url(#oakTone)" />
                  <rect x="98" y="82" width="13" height="33" rx="1" fill="#78716C" />
                  <rect x="114" y="86" width="11" height="29" rx="1" fill="#44513F" />
                  <rect x="128" y="78" width="15" height="37" rx="1" fill="#5A3720" />
                  <ellipse cx="180" cy="108" rx="8" ry="7" fill="#E7E5E4" />
                </g>

                {/* Floor Oval Plinth */}
                <ellipse cx="220" cy="385" rx="160" ry="26" fill="#F0ECE4" stroke="#E7E5E4" strokeWidth="1" strokeDasharray="3 3" />

                {/* Handcrafted Desk */}
                <g filter="url(#galleryShadow)">
                  <path d="M102 280L92 380H100L110 280Z" fill="#3A2214" />
                  <path d="M258 280L250 380H258L266 280Z" fill="#3A2214" />
                  <path d="M122 280L116 375H124L130 280Z" fill="#5A3720" opacity="0.6" />
                  <path d="M240 280L234 375H242L248 280Z" fill="#5A3720" opacity="0.6" />

                  <rect x="94" y="255" width="172" height="27" rx="2" fill="#EAE4D8" />
                  <line x1="180" y1="255" x2="180" y2="282" stroke="#DCD6C9" strokeWidth="1" />
                  <rect x="128" y="266" width="18" height="4" rx="1" fill="#5A3720" />
                  <rect x="206" y="266" width="18" height="4" rx="1" fill="#5A3720" />

                  <rect x="86" y="244" width="188" height="14" rx="2" fill="url(#teakGrad)" />
                </g>

                {/* Ceramic Accents */}
                <rect x="118" y="240" width="36" height="3" rx="1" fill="#1C1917" />
                <rect x="232" y="230" width="10" height="14" rx="2" fill="#78716C" />

                {/* Sculptural Chair */}
                <g filter="url(#galleryShadow)">
                  <path d="M282 232C282 214 296 200 315 200C334 200 348 214 348 232V288H282V232Z" fill="url(#teakGrad)" />
                  <path d="M292 236C292 222 301 212 315 212C329 212 338 222 338 236V280H292V236Z" fill="#44513F" />
                  <rect x="272" y="280" width="82" height="16" rx="4" fill="#44513F" />
                  <path d="M280 296L272 380H282L288 296Z" fill="#3A2214" />
                  <path d="M344 296L352 380H342L336 296Z" fill="#3A2214" />
                </g>

                {/* Floor Lamp Accent */}
                <line x1="330" y1="130" x2="330" y2="375" stroke="#1C1917" strokeWidth="2" strokeLinecap="round" />
                <path d="M316 130L330 94L344 130Z" fill="#BFA070" />
                <ellipse cx="330" cy="375" rx="15" ry="4" fill="#1C1917" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ASYMMETRIC EDITORIAL STORYTELLING BLOCKS (DYNAMIC) */}
      <section className="editorial-story-section" id="rooms">
        <div className="wrap">
          <div className="story-section-header">
            <span className="story-kicker">{themeSection.eyebrow || 'CURATED ARCHITECTURE & THEMES'}</span>
            <h2 className="story-main-heading">{themeSection.heading || 'Spaces Sculpted for Serenity'}</h2>
            <p className="story-sub-text">
              {themeSection.subheading || 'We design with the belief that calm interiors create quiet minds. Explore our architectural collections curated for modern living.'}
            </p>
          </div>

          <div className="asymmetric-story-grid">
            {themeCards.map((card, idx) => {
              const isLargeFeature = idx === 0;
              return (
                <article
                  key={card._id || `theme-${idx}`}
                  className={`story-block ${isLargeFeature ? 'story-feature-large' : 'story-split-item'}`}
                  id={idx === 1 ? 'materials-story' : undefined}
                >
                  <div className="story-media-box">
                    {renderCardGraphic(card, idx)}
                  </div>
                  <div className="story-text-content">
                    {card.category && <span className="story-tag">{card.category}</span>}
                    <h3 className="story-title">{card.title}</h3>
                    <p className="story-description">{card.description}</p>
                    <button
                      type="button"
                      className="story-action-link"
                      onClick={() => handleThemeLink(card.buttonLink)}
                    >
                      <span>{card.buttonText || 'Explore Collection'}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mid-Feed In-Stream Native Banner (320x50) */}
      <NativeBanner placement="home_mid" className="in-feed" />

      {/* 3. SPACIOUS 3-COLUMN FEATURED WORKS GRID */}
      <section className="featured-works-section" id="shop">
        <div className="wrap">
          <div className="featured-section-head">
            <div>
              <span className="story-kicker">SELECTED PIECES</span>
              <h2 className="story-main-heading">Featured from the Workshop</h2>
            </div>
            <button
              type="button"
              className="view-all-text-link desktop-only"
              onClick={onCatalogClick}
            >
              <span>View All Collection ({(products || []).length} pieces)</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>

          {isLoading ? (
            <ProductSkeletonGrid count={6} />
          ) : featuredItems.length > 0 ? (
            <div className="editorial-product-grid">
              {featuredItems.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isAdded={!!addedIds[product.id]}
                  onSelectProduct={onSelectProduct}
                  onAddToCart={handleAddToCart}
                  onBuyNow={handleBuyNow}
                />
              ))}
            </div>
          ) : null}

          {/* Mobile Center CTA */}
          <div className="featured-bottom-cta">
            <button
              type="button"
              className="btn-editorial-outline"
              onClick={onCatalogClick}
            >
              <span>Explore Entire Catalog ({(products || []).length} Items)</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* 4. MATERIALITY & CRAFT ASSURANCE */}
      <section className="materiality-ethos-section" id="material">
        <div className="wrap">
          <div className="ethos-card-box">
            <div className="ethos-intro">
              <span className="story-kicker">HONEST MATERIALITY</span>
              <h2 className="ethos-heading">Why We Build with Melamine Board & Solid Teak</h2>
              <p className="ethos-sub">
                Designed to withstand everyday tropical wear while keeping bespoke furniture accessible.
              </p>
            </div>

            <div className="ethos-pillars-grid">
              <div className="ethos-pillar">
                <div className="pillar-num">01</div>
                <h3 className="pillar-title">Moisture & Humidity Sealed</h3>
                <p className="pillar-desc">
                  Thermally fused laminate prevents swelling or bowing through Bangladesh's monsoons and humid coastal seasons.
                </p>
              </div>

              <div className="ethos-pillar">
                <div className="pillar-num">02</div>
                <h3 className="pillar-title">Scratch & Wear Resistant</h3>
                <p className="pillar-desc">
                  High-density composite core resists heat rings, pen marks, and daily household wear without degrading.
                </p>
              </div>

              <div className="ethos-pillar">
                <div className="pillar-num">03</div>
                <h3 className="pillar-title">Direct Workshop Pricing</h3>
                <p className="pillar-desc">
                  Crafted locally in Trishal, Mymensingh. Furnish entire rooms with premium architectural style at factory-direct cost.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
 
       {/* 5. BESPOKE COMMISSION SECTION */}
       <section className="bespoke-commission-section" id="bespoke">
         <div className="wrap">
           <div className="bespoke-card-inner">
             <div className="bespoke-meta">
               <span className="story-kicker">CUSTOM COMMISSIONS · TRISHAL WORKSHOP</span>
               <h2 className="bespoke-heading">Need Bespoke Sizing or Have an Inspiration Photo?</h2>
               <p className="bespoke-narrative">
                 Whether you need a dining table built to exact room dimensions, a fitted wardrobe for awkward alcoves, or have a Pinterest design you'd love crafted — our master carpenters will bring it to life.
               </p>
               <div className="bespoke-features-row">
                 <span className="bespoke-feat-tag">
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '5px' }}>
                     <polyline points="20 6 9 17 4 12"></polyline>
                   </svg>
                   Custom Dimensions
                 </span>
                 <span className="bespoke-feat-tag">
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '5px' }}>
                     <polyline points="20 6 9 17 4 12"></polyline>
                   </svg>
                   Workshop Direct Crafting
                 </span>
                 <span className="bespoke-feat-tag">
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '5px' }}>
                     <polyline points="20 6 9 17 4 12"></polyline>
                   </svg>
                   Photo & Sketch Upload
                 </span>
                 <span className="bespoke-feat-tag">
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '5px' }}>
                     <polyline points="20 6 9 17 4 12"></polyline>
                   </svg>
                   Direct Consultation
                 </span>
               </div>

             </div>
             <div className="bespoke-cta-col">
               <button
                 type="button"
                 className="btn-editorial-primary bespoke-launch-btn"
                 onClick={() => setIsCustomInquiryOpen(true)}
               >
                 <span>Start Custom Inquiry</span>
                 <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                   <line x1="5" y1="12" x2="19" y2="12"></line>
                   <polyline points="12 5 19 12 12 19"></polyline>
                 </svg>
               </button>
               <span className="bespoke-subnote">No payment required until specs & quote are confirmed</span>
             </div>
           </div>
         </div>
       </section>
     </div>

  );
}
