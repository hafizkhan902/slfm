import React, { useState, useMemo, useEffect } from 'react';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { ProductCard } from './ProductCard';
import { ProductSkeletonGrid } from './ProductSkeleton';

/**
 * Modern Minimalist Catalog & Shop Layout (Japandi / Architectural Gallery Aesthetic)
 * Architecture:
 * - Sleek minimal top-bar (Search + Sort + Slide-out Filter Drawer Trigger)
 * - Smooth slide-out filter drawer (Categories & Rooms)
 * - Spacious editorial 3-column product grid with 4:5 aspect ratio cards
 */
export function Shop({
  selectedCategory,
  setSelectedCategory,
  selectedRoom,
  setSelectedRoom,
  onSelectProduct,
  onBackToHome
}) {
  const { products, categoriesList, roomsList, isLoading, loadError, refetchCatalog } = useProducts();
  const { addToCart, setIsCartOpen } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [addedIds, setAddedIds] = useState({});
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Close filter drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsFilterDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background scroll when filter drawer is open
  useEffect(() => {
    if (isFilterDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFilterDrawerOpen]);

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

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchRoom = selectedRoom === 'all' || item.room === selectedRoom;
      const matchSearch = searchTerm.trim() === '' ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.categoryName && item.categoryName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.roomName && item.roomName.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchCategory && matchRoom && matchSearch;
    });
  }, [products, selectedCategory, selectedRoom, searchTerm]);

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortBy === 'price-low') {
      return list.sort((a, b) => (a.price || 0) - (b.price || 0));
    }
    if (sortBy === 'price-high') {
      return list.sort((a, b) => (b.price || 0) - (a.price || 0));
    }
    return list;
  }, [filteredProducts, sortBy]);

  const resetAllFilters = () => {
    setSelectedCategory('all');
    setSelectedRoom('all');
    setSearchTerm('');
    setSortBy('default');
  };

  const activeFilterCount = (selectedCategory !== 'all' ? 1 : 0) + (selectedRoom !== 'all' ? 1 : 0);

  const activeCategoryObj = categoriesList.find((c) => c.id === selectedCategory);
  const activeRoomObj = roomsList.find((r) => r.id === selectedRoom);

  return (
    <main className="shop-catalog-view" id="shop-top">
      <div className="wrap">
        {/* Editorial Catalog Header */}
        <div className="catalog-header-bar">
          <button
            type="button"
            className="back-overview-btn"
            onClick={onBackToHome}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Return to Overview</span>
          </button>

          <div className="catalog-title-group">
            <span className="story-kicker">THE COMPLETE CATALOGUE</span>
            <h1 className="catalog-main-title">Crafted Furniture Archive</h1>
            <p className="catalog-intro-sub">
              Explore our complete collection of solid Chittagong teak & premium melamine board pieces.
            </p>
          </div>
        </div>

        {/* Minimalist Top Bar Controls */}
        <div className="catalog-top-controls">
          {/* Left: Filter Drawer Trigger Button */}
          <div className="controls-left">
            <button
              type="button"
              className={`filter-drawer-trigger-btn ${activeFilterCount > 0 ? 'has-active' : ''}`}
              onClick={() => setIsFilterDrawerOpen(true)}
              aria-label="Open Filter Drawer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="21" x2="4" y2="14"></line>
                <line x1="4" y1="10" x2="4" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12" y2="3"></line>
                <line x1="20" y1="21" x2="20" y2="16"></line>
                <line x1="20" y1="12" x2="20" y2="3"></line>
                <line x1="1" y1="14" x2="7" y2="14"></line>
                <line x1="9" y1="8" x2="15" y2="8"></line>
                <line x1="17" y1="16" x2="23" y2="16"></line>
              </svg>
              <span>Filter & Refine</span>
              {activeFilterCount > 0 && (
                <span className="filter-count-badge">{activeFilterCount}</span>
              )}
            </button>

            {/* Active Filter Quick Badges */}
            {activeFilterCount > 0 && (
              <div className="active-chips-strip">
                {selectedCategory !== 'all' && (
                  <span className="filter-active-chip">
                    {activeCategoryObj?.name}
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('all')}
                      aria-label={`Remove ${activeCategoryObj?.name} filter`}
                    >
                      ✕
                    </button>
                  </span>
                )}
                {selectedRoom !== 'all' && (
                  <span className="filter-active-chip">
                    {activeRoomObj?.name}
                    <button
                      type="button"
                      onClick={() => setSelectedRoom('all')}
                      aria-label={`Remove ${activeRoomObj?.name} filter`}
                    >
                      ✕
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  className="reset-all-link"
                  onClick={resetAllFilters}
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Right: Search Box + Sort Selector + Item Count */}
          <div className="controls-right">
            <div className="minimal-search-input-box">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="search-stroke-icon">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Search collection..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search furniture pieces"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="clear-search-x"
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear search input"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="minimal-sort-dropdown">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort products"
              >
                <option value="default">Sort: Curated</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            <span className="catalog-count-pill desktop-only">
              {sortedProducts.length} pieces
            </span>
          </div>
        </div>

        {/* Product Grid / Skeleton State / Empty State */}
        {isLoading ? (
          <ProductSkeletonGrid count={8} className="editorial-catalog-grid" />
        ) : sortedProducts.length === 0 ? (
          <div className="catalog-editorial-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth="1.4" style={{ margin: '0 auto 16px', opacity: 0.7 }}>
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10M6 10h10" />
            </svg>
            <h3 className="empty-title">
              {loadError ? 'Catalogue Server Connecting...' : 'No Pieces Match Your Selection'}
            </h3>
            <p className="empty-desc">
              {loadError
                ? 'Our showroom catalog server is reconnecting. Click below to retry.'
                : 'Try adjusting your room or category filters, or search for another piece.'}
            </p>
            {loadError && refetchCatalog ? (
              <button
                type="button"
                className="btn-editorial-primary"
                onClick={refetchCatalog}
                style={{ marginTop: '16px' }}
              >
                Retry Connection
              </button>
            ) : (
              <button
                type="button"
                className="btn-editorial-outline"
                onClick={resetAllFilters}
                style={{ marginTop: '16px' }}
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="editorial-catalog-grid">
            {sortedProducts.map((product) => (
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
        )}
      </div>

      {/* SLIDE-OUT FILTER DRAWER */}
      {isFilterDrawerOpen && (
        <div className="filter-drawer-backdrop" onClick={() => setIsFilterDrawerOpen(false)}>
          <aside
            className="filter-slideout-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Filter Options"
          >
            <div className="filter-panel-header">
              <div>
                <span className="story-kicker">CURATE ARCHIVE</span>
                <h3 className="filter-panel-title">Filter & Refine</h3>
              </div>
              <button
                type="button"
                className="filter-close-btn"
                onClick={() => setIsFilterDrawerOpen(false)}
                aria-label="Close Filter Drawer"
              >
                ✕
              </button>
            </div>

            <div className="filter-panel-body">
              {/* Category Filter Section */}
              <div className="filter-group">
                <span className="filter-group-title">Category</span>
                <div className="filter-options-list">
                  {categoriesList.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`filter-option-row ${selectedCategory === cat.id ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      <span>{cat.name}</span>
                      {selectedCategory === cat.id && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Room Filter Section */}
              <div className="filter-group">
                <span className="filter-group-title">Room & Living Space</span>
                <div className="filter-options-list">
                  <button
                    type="button"
                    className={`filter-option-row ${selectedRoom === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedRoom('all')}
                  >
                    <span>All Rooms</span>
                    {selectedRoom === 'all' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </button>
                  {roomsList.map((rm) => (
                    <button
                      key={rm.id}
                      type="button"
                      className={`filter-option-row ${selectedRoom === rm.id ? 'active' : ''}`}
                      onClick={() => setSelectedRoom(rm.id)}
                    >
                      <span>{rm.name}</span>
                      {selectedRoom === rm.id && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Filter Drawer Footer */}
            <div className="filter-panel-footer">
              <button
                type="button"
                className="filter-reset-btn"
                onClick={resetAllFilters}
              >
                Reset Filters
              </button>
              <button
                type="button"
                className="filter-apply-btn"
                onClick={() => setIsFilterDrawerOpen(false)}
              >
                Show Results ({sortedProducts.length})
              </button>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
