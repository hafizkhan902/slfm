import React, { useState } from 'react';
import { useProducts } from '../context/ProductContext';
import { ProductCard } from './ProductCard';
import { useCart } from '../context/CartContext';
import { ProductSkeletonGrid } from './ProductSkeleton';

export function FeaturedProducts({ onSelectProduct }) {
  const { products, isLoading } = useProducts();
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

        {isLoading ? (
          <ProductSkeletonGrid count={4} />
        ) : featuredList.length > 0 ? (
          <div className="product-grid">
            {featuredList.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isAdded={!!addedIds[product.id]}
                onSelectProduct={onSelectProduct}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
