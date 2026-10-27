import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { ProductIcon } from './ProductIcon';
import { ProductCard } from './ProductCard';
import { api } from '../services/api';
import { SEO } from './SEO';

export function ProductDetailPage({ product, onBack, onSelectProduct }) {
  const { addToCart, setIsCartOpen, showToast } = useCart();
  const { products } = useProducts();
  const { currentUser } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}${window.location.pathname}?product=${encodeURIComponent(product?.id || product?.mongoId || '')}`;
  };

  const logShareToDb = async (shareType = 'copy_link') => {
    try {
      const shareUrl = getShareUrl();
      await api.recordProductShare({
        productId: product?.id || product?.mongoId,
        productName: product?.name || 'Furniture Product',
        productPrice: product?.price || 0,
        productImage: activeImage || product?.image || '',
        category: product?.categoryName || product?.category || '',
        room: product?.roomName || product?.room || '',
        sharedUrl: shareUrl,
        shareType,
        userId: currentUser?.id || currentUser?._id || null,
        userName: currentUser?.name || 'Guest Customer',
        userEmail: currentUser?.email || '',
        userPhone: currentUser?.phone || ''
      });
    } catch (err) {
      console.warn('[Share] Failed to log link copy to database:', err.message);
    }
  };

  const copyToClipboard = async (shareType = 'copy_link') => {
    const url = getShareUrl();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setIsCopied(true);
      if (showToast) showToast('Product link copied to clipboard!');
      logShareToDb(shareType);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      if (showToast) showToast('Failed to copy link.');
    }
  };

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
      <SEO
        title={`${product.name} — ৳${product.price ? product.price.toLocaleString() : ''}`}
        description={product.description || `Buy ${product.name} at ShahLajuk Furniture Mart. Premium handcrafted timber furniture.`}
        image={displayImg}
        url={getShareUrl()}
        type="product"
        price={product.price}
        category={product.categoryName || product.roomName || product.category}
      />
      <div className="wrap" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
        
        {/* Breadcrumb & Back Action */}
        <div className="breadcrumb-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div className="breadcrumb-nav-group" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button type="button" className="btn-back" onClick={onBack}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>Return to Catalogue</span>
            </button>
            <div className="breadcrumbs desktop-only">
              <span onClick={onBack} className="crumb-link">Home</span>
              <span className="crumb-sep">/</span>
              <span onClick={onBack} className="crumb-link">{product.roomName}</span>
              <span className="crumb-sep">/</span>
              <span className="crumb-current">{product.name}</span>
            </div>
          </div>

          <button
            type="button"
            className="btn-share-pill desktop-only"
            onClick={() => copyToClipboard('copy_link')}
            title="Copy shareable link for this product"
          >
            {isCopied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>Copy Link</span>
              </>
            )}
          </button>
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
                  onClick={handleAddToCart}
                  aria-label={`Add ${quantity} to cart`}
                >
                  {added ? (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Added to Cart</span>
                    </>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                      </svg>
                      <span>Add {quantity > 1 ? `${quantity} ` : ''}to Cart</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn-buy"
                  onClick={handleBuyNow}
                  aria-label={`Buy ${product.name} now`}
                >
                  Buy Now
                </button>
                <button
                  type="button"
                  className="btn-share-action"
                  onClick={() => setIsShareModalOpen(true)}
                  aria-label={`Share ${product.name}`}
                  title="Share this product details link"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  <span>Share</span>
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
          <div className="related-section" style={{ marginTop: '72px', borderTop: '1px solid var(--border-subtle, #E7E5E4)', paddingTop: '48px' }}>
            <div style={{ marginBottom: '28px' }}>
              <span style={{ fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted, #78716C)', fontWeight: 600 }}>
                CURATED COMPANIONS
              </span>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.6rem', color: 'var(--text-primary, #1C1917)', marginTop: '4px', margin: '4px 0 0 0' }}>
                Harmonious Pieces
              </h2>
            </div>
            <div className="editorial-product-grid">
              {relatedProducts.map((rel) => (
                <ProductCard
                  key={rel.id}
                  product={rel}
                  onSelectProduct={onSelectProduct}
                  onAddToCart={(e, item) => {
                    e.stopPropagation();
                    addToCart(item, 1);
                  }}
                  onBuyNow={(e, item) => {
                    e.stopPropagation();
                    addToCart(item, 1);
                    setIsCartOpen(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Share Modal Dialog */}
      {isShareModalOpen && (
        <div className="modal-backdrop open" onClick={() => setIsShareModalOpen(false)}>
          <div className="share-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="share-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="share-icon-circle">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontFamily: 'Fraunces, serif', color: 'var(--walnut)' }}>
                    Share Product Details
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--stone)' }}>
                    Copy link to share this piece with friends or family
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="share-modal-close"
                onClick={() => setIsShareModalOpen(false)}
                aria-label="Close share dialog"
              >
                &times;
              </button>
            </div>

            <div className="share-modal-body">
              {/* Product Preview Card */}
              <div className="share-product-preview">
                {displayImg ? (
                  <img src={displayImg} alt={product.name} className="share-preview-thumb" />
                ) : (
                  <div className="share-preview-thumb-placeholder">
                    <ProductIcon type={product.iconType} />
                  </div>
                )}
                <div className="share-preview-info">
                  <div className="share-preview-category">{product.roomName} • {product.categoryName}</div>
                  <h4 className="share-preview-title">{product.name}</h4>
                  <div className="share-preview-price">৳{product.price.toLocaleString()}</div>
                </div>
              </div>

              {/* Copy Link Bar */}
              <label className="share-input-label">Shareable Page Link</label>
              <div className="share-copy-bar">
                <input
                  type="text"
                  readOnly
                  value={getShareUrl()}
                  className="share-url-input"
                  onClick={(e) => e.target.select()}
                />
                <button
                  type="button"
                  className={`btn-copy-link ${isCopied ? 'copied' : ''}`}
                  onClick={() => copyToClipboard('copy_link')}
                >
                  {isCopied ? (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Social Share Buttons */}
              <div className="share-social-grid">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Check out ${product.name} (৳${product.price.toLocaleString()}) at ShahLajuk Furniture Mart: ` + getShareUrl())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-share-btn whatsapp"
                  onClick={() => logShareToDb('whatsapp')}
                >
                  <span className="social-icon">💬</span>
                  <span>WhatsApp</span>
                </a>

                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-share-btn facebook"
                  onClick={() => logShareToDb('facebook')}
                >
                  <span className="social-icon">📘</span>
                  <span>Facebook</span>
                </a>

                {typeof navigator !== 'undefined' && navigator.share && (
                  <button
                    type="button"
                    className="social-share-btn native"
                    onClick={async () => {
                      try {
                        await navigator.share({
                          title: `${product.name} — ShahLajuk Furniture Mart`,
                          text: `Check out ${product.name} at ShahLajuk Furniture Mart`,
                          url: getShareUrl()
                        });
                        logShareToDb('native_share');
                      } catch {}
                    }}
                  >
                    <span className="social-icon">📲</span>
                    <span>More</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
