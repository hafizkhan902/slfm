import React, { useState } from 'react';
import { useProducts } from '../context/ProductContext';
import { ProductCard } from './ProductCard';
import { useCart } from '../context/CartContext';
import { ProductSkeletonGrid } from './ProductSkeleton';

export function ShopByCategory({ onSelectProduct }) {
  const { products, categoriesList, isLoading } = useProducts();
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

        {isLoading ? (
          <ProductSkeletonGrid count={4} />
        ) : filteredItems.length > 0 ? (
          <div className="product-grid">
            {filteredItems.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isAdded={!!addedIds[product.id]}
                onSelectProduct={onSelectProduct}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                className="category-item"
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ink-soft)' }}>
            <p>No products available in this category.</p>
          </div>
        )}
      </div>
    </section>
  );
}
