import React, { useState } from 'react';
import { useProducts } from '../context/ProductContext';
import { ProductIcon } from './ProductIcon';
import { useCart } from '../context/CartContext';

export function FeaturedProducts({ onSelectProduct }) {
  const { products } = useProducts();
  const { addToCart, setIsCartOpen } = useCart();
  const [addedIds, setAddedIds] = useState({});

  const featuredList = products.slice(0, 4);

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

  return (
    <section className="featured">
      <div className="wrap">
        <div className="section-head">
          <div>
            <h2>A few pieces to start with</h2>
            <p>New arrivals from this month's catalogue.</p>
          </div>
        </div>

        <div className="product-grid">
          {featuredList.map((product) => {
            const isAdded = addedIds[product.id];
            return (
              <div
                className="product-card"
                key={product.id}
                onClick={() => onSelectProduct(product)}
              >
                <div className={`product-thumb ${product.image ? 'has-image' : ''}`} style={{ background: product.image ? '#ffffff' : product.bg }}>
                  {product.badge && (
                    <span className={`product-badge ${product.badge.includes('%') || product.badge === 'Sale' ? 'sale' : ''}`}>
                      {product.badge}
                    </span>
                  )}
                  <ProductIcon type={product.iconType} image={product.image} alt={product.name} />
                </div>
                <div className="product-body">
                  <span className="product-room">{product.roomName}</span>
                  <p className="product-name">{product.name}</p>
                  <div className="price-row">
                    <span className="price-current">৳{product.price.toLocaleString()}</span>
                    {product.originalPrice && (
                      <span className="price-original">৳{product.originalPrice.toLocaleString()}</span>
                    )}
                  </div>
                  <div className="product-actions">
                    <button
                      type="button"
                      className={`btn-cart ${isAdded ? 'added' : ''}`}
                      onClick={(e) => handleAddToCart(e, product)}
                    >
                      {isAdded ? 'Added ' : 'Add to cart'}
                    </button>
                    <button
                      type="button"
                      className="btn-buy"
                      onClick={(e) => handleBuyNow(e, product)}
                    >
                      Buy now
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
