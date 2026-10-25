import React from 'react';
import { ProductIcon } from './ProductIcon';

/**
 * Modern Minimalist Product Card (Japandi / Architectural Gallery Aesthetic)
 * Preserves all original props, event handlers, and data bindings.
 */
export function ProductCard({
  product,
  onSelectProduct,
  onAddToCart,
  onBuyNow,
  isAdded = false,
  className = '',
}) {
  if (!product) return null;

  const handleCardClick = () => {
    if (onSelectProduct) {
      onSelectProduct(product);
    }
  };

  const handleCartClick = (e) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(e, product);
    }
  };

  const handleBuyClick = (e) => {
    e.stopPropagation();
    if (onBuyNow) {
      onBuyNow(e, product);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    <article
      className={`minimal-product-card ${className}`}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${product.name}`}
    >
      {/* 4:5 Aspect Ratio Image Canvas with Calm Neutral Wash */}
      <div
        className="card-media-wrapper"
        style={{
          background: product.image ? '#F7F6F2' : (product.bg || '#F5F4F0')
        }}
      >
        {product.badge && (
          <span className="minimal-card-tag">
            {product.badge}
          </span>
        )}

        <div className="card-media-inner">
          <ProductIcon
            type={product.iconType}
            image={product.image}
            alt={product.name}
          />
        </div>
      </div>

      {/* Editorial Content Block */}
      <div className="card-details">
        <div className="card-meta">
          <span className="card-category">
            {product.categoryName || product.roomName || 'Solid Wood'}
          </span>
        </div>

        <h3 className="card-title">{product.name}</h3>

        <div className="card-pricing">
          <span className="price-main">৳{product.price?.toLocaleString()}</span>
          {product.originalPrice && (
            <span className="price-compare">৳{product.originalPrice.toLocaleString()}</span>
          )}
        </div>

        {/* Refined Minimalist Action Row */}
        <div className="card-actions-minimal">
          <button
            type="button"
            className={`btn-minimal-cart ${isAdded ? 'is-added' : ''}`}
            onClick={handleCartClick}
            aria-label={`Add ${product.name} to cart`}
          >
            {isAdded ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Added</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <span>Add to Cart</span>
              </>
            )}
          </button>

          {onBuyNow && (
            <button
              type="button"
              className="btn-minimal-buy"
              onClick={handleBuyClick}
              aria-label={`Instant buy ${product.name}`}
            >
              Buy Now
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
