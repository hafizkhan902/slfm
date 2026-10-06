import React from 'react';

export function ProductSkeletonCard() {
  return (
    <div className="product-card skeleton-card">
      <div className="product-thumb skeleton-thumb shimmer"></div>
      <div className="product-body">
        <div className="skeleton-line skeleton-room shimmer"></div>
        <div className="skeleton-line skeleton-name shimmer"></div>
        <div className="price-row" style={{ marginTop: '4px' }}>
          <div className="skeleton-line skeleton-price shimmer"></div>
        </div>
        <div className="product-actions" style={{ marginTop: '8px' }}>
          <div className="skeleton-btn shimmer"></div>
          <div className="skeleton-btn shimmer"></div>
        </div>
      </div>
    </div>
  );
}

export function ProductSkeletonGrid({ count = 4 }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeletonCard key={i} />
      ))}
    </div>
  );
}
