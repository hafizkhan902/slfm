import React from 'react';

export function ProductIcon({ type, image, alt }) {
  if (image) {
    return (
      <img
        src={image}
        alt={alt || 'Furniture product'}
        className="product-cloudinary-img"
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
      />
    );
  }

  switch (type) {
    case 'table':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="10" y="38" width="80" height="8" rx="2" />
          <line x1="20" y1="46" x2="20" y2="82" />
          <line x1="80" y1="46" x2="80" y2="82" />
        </svg>
      );
    case 'study-table':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="14" y="42" width="72" height="7" rx="2" />
          <line x1="22" y1="49" x2="22" y2="80" />
          <line x1="78" y1="49" x2="78" y2="80" />
          <rect x="30" y="20" width="40" height="18" rx="2" />
        </svg>
      );
    case 'dining-chair':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="28" y="42" width="44" height="8" rx="2" />
          <path d="M32 50v28M68 50v28" />
          <path d="M30 42V16a4 4 0 0 1 4-4h4" />
        </svg>
      );
    case 'accent-chair':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M26 46c0-14 8-24 24-24s24 10 24 24" />
          <rect x="26" y="46" width="48" height="10" rx="2" />
          <path d="M30 56v22M70 56v22" />
        </svg>
      );
    case 'wardrobe-2door':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="15" y="12" width="70" height="76" rx="2" />
          <line x1="50" y1="12" x2="50" y2="88" />
          <circle cx="44" cy="50" r="2.2" fill="currentColor" stroke="none" />
          <circle cx="56" cy="50" r="2.2" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'wardrobe-3door':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="10" y="10" width="80" height="78" rx="2" />
          <line x1="36" y1="10" x2="36" y2="88" />
          <line x1="64" y1="10" x2="64" y2="88" />
        </svg>
      );
    case 'dressing-table':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="32" y="10" width="36" height="30" rx="2" />
          <rect x="14" y="46" width="72" height="8" rx="2" />
          <line x1="22" y1="54" x2="22" y2="86" />
          <line x1="78" y1="54" x2="78" y2="86" />
        </svg>
      );
    case 'bookshelf':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="18" y="10" width="64" height="80" rx="2" />
          <line x1="18" y1="35" x2="82" y2="35" />
          <line x1="18" y1="60" x2="82" y2="60" />
        </svg>
      );
    case 'bed-queen':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="10" y="50" width="80" height="30" rx="2" />
          <path d="M10 50v-8a6 6 0 0 1 6-6h8a6 6 0 0 1 6 6v8" />
          <line x1="14" y1="80" x2="14" y2="90" />
          <line x1="86" y1="80" x2="86" y2="90" />
        </svg>
      );
    case 'bed-bunk':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="10" y="20" width="80" height="22" rx="2" />
          <rect x="10" y="58" width="80" height="22" rx="2" />
          <line x1="16" y1="42" x2="16" y2="58" />
          <line x1="84" y1="42" x2="84" y2="58" />
        </svg>
      );
    case 'sofa':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M14 52v20a1 1 0 0 0 1 1h70a1 1 0 0 0 1-1V52" />
          <path d="M14 52a4 4 0 0 1 4-4h64a4 4 0 0 1 4 4" />
          <line x1="18" y1="73" x2="18" y2="82" />
          <line x1="82" y1="73" x2="82" y2="82" />
          <line x1="34" y1="48" x2="34" y2="62" />
          <line x1="66" y1="48" x2="66" y2="62" />
        </svg>
      );
    case 'wall-shelf':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="14" y="30" width="72" height="12" rx="2" />
          <rect x="14" y="58" width="72" height="12" rx="2" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="20" y="20" width="60" height="60" rx="4" />
        </svg>
      );
  }
}
