import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { ProductIcon } from './ProductIcon';

export function ProductDetailPage({ product, onBack, onSelectProduct }) {
  const { addToCart, setIsCartOpen } = useCart();
  const { products } = useProducts();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState('');

  const allImages = useMemo(() => {
    if (!product) return [];
    const list = [];
    if (product.image) list.push(product.image);
    if (Array.isArray(product.images)) {
      product.images.forEach((img) => {
        if (img && typeof img === 'string' && !list.includes(img)) list.push(img);
      });
    }
    if (product.image2 && !list.includes(product.image2)) list.push(product.image2);
    if (product.image3 && !list.includes(product.image3)) list.push(product.image3);
    if (product.image4 && !list.includes(product.image4)) list.push(product.image4);
    return list;
  }, [product]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setQuantity(1);
    setAdded(false);
    setActiveImage(product?.image || (allImages.length > 0 ? allImages[0] : ''));
  }, [product?.id, product?.image, allImages]);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    setIsCartOpen(true);
  };

  // Find related products in the same room or category (excluding current product)
  const relatedProducts = products
    .filter((p) => p.id !== product.id && (p.category === product.category || p.room === product.room))
    .slice(0, 4);

  const displayImg = activeImage || product.image;

  return (
    <div className="product-detail-page">
      <div className="wrap" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
        
        {/* Breadcrumb & Back Action */}
        <div className="breadcrumb-bar">
          <button type="button" className="btn-back" onClick={onBack}>
            ← Back to Catalogue
          </button>
          <div className="breadcrumbs">
            <span onClick={onBack} className="crumb-link">Home</span>
            <span className="crumb-sep">/</span>
            <span onClick={onBack} className="crumb-link">{product.roomName}</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-current">{product.name}</span>
          </div>
        </div>

        {/* Main Product Layout */}
        <div className="product-detail-grid">
          {/* Gallery / Illustration Column */}
          <div className="product-detail-gallery-container">
            <div className={`product-detail-gallery ${displayImg ? 'has-image' : ''}`} style={{ background: displayImg ? '#ffffff' : product.bg }}>
              {product.badge && (
                <span className={`product-badge ${product.badge.includes('%') || product.badge === 'Sale' ? 'sale' : ''}`}>
                  {product.badge}
                </span>
              )}
              <div className="detail-svg-container">
                <ProductIcon type={product.iconType} image={displayImg} alt={product.name} />
              </div>
            </div>

            {/* Clickable Image Thumbnails Row */}
            {allImages.length > 1 && (
              <div className="detail-thumbnails-row">
                {allImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`detail-thumb-item ${displayImg === imgUrl ? 'active' : ''}`}
                    onClick={() => setActiveImage(imgUrl)}
                    title={`View photo ${idx + 1}`}
                  >
                    <img src={imgUrl} alt={`${product.name} photo ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Column */}
          <div className="product-detail-info">
            <div className="detail-tag-row">
              <span className="detail-tag">{product.categoryName}</span>
              <span className="detail-dot">•</span>
              <span className="detail-tag">{product.roomName}</span>
            </div>

            <h1 className="detail-title">{product.name}</h1>

            <div className="price-row" style={{ margin: '14px 0 20px' }}>
              <span className="price-current" style={{ fontSize: '2rem' }}>
                ৳{product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="price-original" style={{ fontSize: '1.1rem' }}>
                  ৳{product.originalPrice.toLocaleString()}
                </span>
              )}
              {product.badge && (
                <span className="price-discount">{product.badge}</span>
              )}
            </div>

            <p className="detail-description">{product.description}</p>

            {/* Specifications Card */}
            <div className="detail-specs-card">
              <h3>Melamine Board Specifications</h3>
              <div className="specs-grid">
                <div className="spec-item">
                  <span className="spec-label">Dimensions:</span>
                  <span className="spec-val">{product.specs?.dimensions || 'Standard size'}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Board Type:</span>
                  <span className="spec-val">{product.specs?.material || 'Melamine-faced engineered board'}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Finish:</span>
                  <span className="spec-val">{product.specs?.finish || 'Natural Woodgrain Laminate'}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Warranty:</span>
                  <span className="spec-val">{product.specs?.warranty || '2 Years Warranty'}</span>
                </div>
              </div>
            </div>

            {/* Quantity Counter & CTAs */}
            <div className="purchase-controls">
              <div className="qty-selector">
                <label className="qty-label">Quantity</label>
                <div className="qty-controls" style={{ marginTop: '4px' }}>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    -
                  </button>
                  <span style={{ fontWeight: 600, minWidth: '32px', textAlign: 'center', fontSize: '1.05rem' }}>
                    {quantity}
                  </span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setQuantity((q) => q + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="action-buttons-row">
                <button
                  type="button"
                  className={`btn-cart ${added ? 'added' : ''}`}
                  style={{ padding: '14px 24px', fontSize: '1rem' }}
                  onClick={handleAddToCart}
                >
                  {added ? 'Added to Cart ' : `Add ${quantity} to Cart`}
                </button>
                <button
                  type="button"
                  className="btn-buy"
                  style={{ padding: '14px 24px', fontSize: '1rem' }}
                  onClick={handleBuyNow}
                >
                  Buy Now
                </button>
              </div>
            </div>

            {/* Guarantee & Showroom notice */}
            <div className="detail-perks">
              <div className="perk-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>100% Water-Resistant Melamine Finish</span>
              </div>
              <div className="perk-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                <span>Safe Trishal, Mymensingh & District Home Delivery</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Furniture Section */}
        {relatedProducts.length > 0 && (
          <div className="related-section">
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.8rem', marginBottom: '24px' }}>
              You might also like
            </h2>
            <div className="product-grid">
              {relatedProducts.map((rel) => (
                <div
                  className="product-card"
                  key={rel.id}
                  onClick={() => onSelectProduct(rel)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={`product-thumb ${rel.image ? 'has-image' : ''}`} style={{ background: rel.image ? '#ffffff' : rel.bg }}>
                    {rel.badge && (
                      <span className={`product-badge ${rel.badge.includes('%') || rel.badge === 'Sale' ? 'sale' : ''}`}>
                        {rel.badge}
                      </span>
                    )}
                    <ProductIcon type={rel.iconType} image={rel.image} alt={rel.name} />
                  </div>
                  <div className="product-body">
                    <span className="product-room">{rel.roomName}</span>
                    <p className="product-name">{rel.name}</p>
                    <div className="price-row">
                      <span className="price-current">৳{rel.price.toLocaleString()}</span>
                      {rel.originalPrice && (
                        <span className="price-original">৳{rel.originalPrice.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
