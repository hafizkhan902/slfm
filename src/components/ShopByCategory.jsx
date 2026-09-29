import React, { useState } from 'react';
import { useProducts } from '../context/ProductContext';
import { ProductIcon } from './ProductIcon';
import { useCart } from '../context/CartContext';

export function ShopByCategory({ onSelectProduct }) {
  const { products, categoriesList } = useProducts();
  const [activeCat, setActiveCat] = useState('all');
  const { addToCart, setIsCartOpen } = useCart();
  const [addedIds, setAddedIds] = useState({});

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

  const filteredItems = products.filter(
    (item) => activeCat === 'all' || item.category === activeCat
  );

  return (
    <section className="categories" id="categories">
      <div className="wrap">
        <div className="section-head">
          <div>
            <h2>Shop by category</h2>
            <p>Or skip the room and go straight to the piece you're after.</p>
          </div>
        </div>

        <div className="cat-pills" role="tablist" aria-label="Filter furniture by category">
          {categoriesList.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`cat-pill ${activeCat === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCat(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="product-grid">
          {filteredItems.map((product) => {
            const isAdded = addedIds[product.id];
            return (
              <div
                className="product-card category-item"
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
                  <span className="product-room">{product.categoryName}</span>
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
