import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { ProductIcon } from './ProductIcon';

export function ProductModal() {
  const { activeProductModal, setActiveProductModal, addToCart, setIsCartOpen } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState('');

  const product = activeProductModal;

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
    if (product) {
      setActiveImage(product.image || (allImages.length > 0 ? allImages[0] : ''));
      setQuantity(1);
    }
  }, [product, allImages]);

  if (!activeProductModal) return null;

  const handleAdd = () => {
    addToCart(product, quantity);
    setActiveProductModal(null);
  };

  const handleBuy = () => {
    addToCart(product, quantity);
    setActiveProductModal(null);
    setIsCartOpen(true);
  };

  const displayImg = activeImage || product.image;

  return (
    <div className="modal-backdrop open" onClick={() => setActiveProductModal(null)}>
      <div className="product-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close-icon"
          onClick={() => setActiveProductModal(null)}
          aria-label="Close modal"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="modal-content">
          <div className="modal-grid">
            <div className="modal-gallery-column">
              <div className={`modal-thumb-box ${displayImg ? 'has-image' : ''}`} style={{ background: displayImg ? '#ffffff' : product.bg }}>
                <ProductIcon type={product.iconType} image={displayImg} alt={product.name} />
              </div>

              {allImages.length > 1 && (
                <div className="modal-thumbnails-row">
                  {allImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`modal-thumb-item ${displayImg === imgUrl ? 'active' : ''}`}
                      onClick={() => setActiveImage(imgUrl)}
                      title={`View photo ${idx + 1}`}
                    >
                      <img src={imgUrl} alt={`${product.name} view ${idx + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-details">
              <span className="product-room">{product.categoryName} · {product.roomName}</span>
              <h2>{product.name}</h2>

              <div className="price-row" style={{ marginTop: '8px' }}>
                <span className="price-current" style={{ fontSize: '1.4rem' }}>
                  ৳{product.price.toLocaleString()}
                </span>
                {product.originalPrice && (
                  <span className="price-original">৳{product.originalPrice.toLocaleString()}</span>
                )}
                {product.badge && (
                  <span className="price-discount">{product.badge}</span>
                )}
              </div>

              <p style={{ marginTop: '14px', fontSize: '0.92rem', color: 'var(--ink-soft)' }}>
                {product.description}
              </p>

              {product.specs && (
                <div className="modal-specs">
                  <div><strong>Dimensions:</strong> {product.specs.dimensions}</div>
                  <div><strong>Material:</strong> {product.specs.material}</div>
                  <div><strong>Finish:</strong> {product.specs.finish}</div>
                  <div><strong>Warranty:</strong> {product.specs.warranty}</div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--ink-soft)' }}>
                  Quantity:
                </span>
                <div className="qty-controls">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    -
                  </button>
                  <span style={{ fontWeight: 600, minWidth: '24px', textAlign: 'center' }}>
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

              <div className="product-actions" style={{ marginTop: '24px' }}>
                <button type="button" className="btn-cart" onClick={handleAdd}>
                  Add {quantity} to cart
                </button>
                <button type="button" className="btn-buy" onClick={handleBuy}>
                  Buy now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
