import React, { useState, useMemo } from 'react';
import { useProducts } from '../context/ProductContext';
import { ProductIcon } from './ProductIcon';
import { useCart } from '../context/CartContext';

export function ShopAll({
  selectedCategory,
  setSelectedCategory,
  selectedRoom,
  setSelectedRoom,
  onSelectProduct,
  isFullPage = false,
  onOpenFullCatalog,
  onBackToHome
}) {
  const { products, categoriesList, roomsList } = useProducts();
  const { addToCart, setIsCartOpen } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [addedIds, setAddedIds] = useState({});
  const [filterMode, setFilterMode] = useState('category'); // 'category' | 'room'
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

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

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchRoom = selectedRoom === 'all' || item.room === selectedRoom;
      const matchSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.roomName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchRoom && matchSearch;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      return 0;
    });
  }, [selectedCategory, selectedRoom, searchTerm, sortBy]);

  // Limit preview view on home page to 2 rows (8 items on 4-column grid)
  const PREVIEW_LIMIT = 8;
  const displayedProducts = isFullPage
    ? filteredProducts
    : filteredProducts.slice(0, PREVIEW_LIMIT);

  const activeFilterCount = (selectedCategory !== 'all' ? 1 : 0) + (selectedRoom !== 'all' ? 1 : 0) + (searchTerm ? 1 : 0);

  const activeCategoryObj = categoriesList.find((c) => c.id === selectedCategory);
  const activeRoomObj = roomsList.find((r) => r.id === selectedRoom);

  const resetAllFilters = () => {
    setSelectedCategory('all');
    setSelectedRoom('all');
    setSearchTerm('');
    setSortBy('default');
  };

  return (
    <section className={`shop-all ${isFullPage ? 'full-page-mode' : 'home-preview-mode'}`} id="shop">
      <div className="wrap">
        {isFullPage ? (
          <div className="full-catalog-header">
            <button type="button" className="btn-back-home" onClick={onBackToHome}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back to Home</span>
            </button>
            <div className="catalog-header-text">
              <span className="section-kicker">DEDICATED PRODUCTS CATALOG</span>
              <h2>All Furniture Collection</h2>
              <p>Explore our complete catalog of handcrafted melamine board and Chittagong teak pieces.</p>
            </div>
          </div>
        ) : (
          <div className="section-head">
            <div>
              <h2>All products</h2>
              <p>Explore our melamine-faced board collection for every space.</p>
            </div>
          </div>
        )}

        {/* Ergonomic Filter & Search Card Box */}
        <div className="ergonomic-filter-box">
          {/* Top Bar: Search Input + Sort Select + Mobile Filter Trigger */}
          <div className="filter-top-bar">
            <div className="search-box">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search furniture..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear search"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>

            <div className="sort-box">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="default">Sort: Default</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            {/* Mobile Expandable Filter Button */}
            <button
              type="button"
              className={`mobile-filter-toggle ${activeFilterCount > 0 ? 'has-active' : ''}`}
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <span>Filters</span>
              {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
            </button>
          </div>

          {/* Segmented Filter Mode Switcher (Categories vs Rooms) */}
          <div className={`filter-controls-body ${mobileFilterOpen ? 'mobile-open' : ''}`}>
            <div className="segmented-tab-row">
              <span className="segmented-label">Filter by:</span>
              <div className="segmented-tabs">
                <button
                  type="button"
                  className={`segmented-btn ${filterMode === 'category' ? 'active' : ''}`}
                  onClick={() => setFilterMode('category')}
                >
                  Category
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${filterMode === 'room' ? 'active' : ''}`}
                  onClick={() => setFilterMode('room')}
                >
                  Room
                </button>
              </div>

              {activeFilterCount > 0 && (
                <button type="button" className="btn-reset-chip" onClick={resetAllFilters}>
                  Clear filters
                </button>
              )}
            </div>

            {/* Horizontal Filter Pills for active mode */}
            {filterMode === 'category' && (
              <div className="cat-pills animated-pills">
                {categoriesList.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`cat-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {filterMode === 'room' && (
              <div className="cat-pills animated-pills">
                <button
                  type="button"
                  className={`cat-pill ${selectedRoom === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedRoom('all')}
                >
                  All rooms
                </button>
                {roomsList.map((rm) => (
                  <button
                    key={rm.id}
                    type="button"
                    className={`cat-pill ${selectedRoom === rm.id ? 'active' : ''}`}
                    onClick={() => setSelectedRoom(rm.id)}
                  >
                    {rm.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active Filter Context Indicator Bar */}
          <div className="active-filter-summary">
            <span>
              Showing <strong>{displayedProducts.length}</strong> of <strong>{filteredProducts.length}</strong> items
              {selectedCategory !== 'all' && <> in <em>{activeCategoryObj?.name}</em></>}
              {selectedRoom !== 'all' && <> for <em>{activeRoomObj?.name}</em></>}
              {!isFullPage && filteredProducts.length > PREVIEW_LIMIT && <> (2-row preview)</>}
            </span>
          </div>
        </div>

        {/* Product Grid */}
        <div className="product-grid" id="shop-grid">
          {displayedProducts.map((product) => {
            const isAdded = addedIds[product.id];
            return (
              <div
                className="product-card shop-item"
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
                  <span className="product-room">{product.categoryName} · {product.roomName}</span>
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

        {/* Home Page 2-Row Preview Gradient Fade Overlay & Circular Down Arrow Expand Button */}
        {!isFullPage && onOpenFullCatalog && (
          <div className="preview-fade-overlay">
            <button
              type="button"
              className="btn-circular-expand"
              onClick={onOpenFullCatalog}
              title={`View All ${filteredProducts.length} Products on Dedicated Page`}
              aria-label="View All Products on Dedicated Page"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
              </svg>
            </button>
            <span className="fade-overlay-hint">Explore All {filteredProducts.length} Products</span>
          </div>
        )}

        {filteredProducts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink-soft)' }}>
            <p style={{ fontSize: '1.2rem', fontFamily: 'Fraunces, serif' }}>No furniture pieces match your selected filter.</p>
            <button
              type="button"
              className="btn"
              style={{ marginTop: '16px' }}
              onClick={resetAllFilters}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
