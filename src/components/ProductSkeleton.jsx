import React from 'react';

export function ProductSkeletonCard() {
  return (
    <div className="minimal-product-card skeleton-card">
      <div className="card-media-wrapper skeleton-thumb shimmer"></div>
      <div className="card-details">
        <div className="skeleton-line skeleton-room shimmer" style={{ width: '40%', height: '11px' }}></div>
        <div className="skeleton-line skeleton-name shimmer" style={{ width: '85%', height: '18px', marginTop: '4px' }}></div>
        <div className="card-pricing" style={{ marginTop: '8px' }}>
          <div className="skeleton-line skeleton-price shimmer" style={{ width: '48%', height: '18px' }}></div>
        </div>
        <div className="card-actions-minimal" style={{ marginTop: 'auto', paddingTop: '14px' }}>
          <div className="skeleton-btn shimmer" style={{ height: '36px', flex: 1, borderRadius: '3px' }}></div>
          <div className="skeleton-btn shimmer" style={{ height: '36px', flex: 1, borderRadius: '3px' }}></div>
        </div>
      </div>
    </div>
  );
}

export function ProductSkeletonGrid({ count = 4, className = 'editorial-product-grid' }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeletonCard key={i} />
      ))}
    </div>
  );
}
