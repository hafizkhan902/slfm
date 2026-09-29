import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';

export function Navbar({ onHomeClick, onCatalogClick }) {
  const { totalItemsCount, setIsCartOpen, showToast } = useCart();
  const {
    currentUser,
    logout,
    setIsAuthModalOpen,
    setAuthModalTab,
    setIsOrderTrackerOpen,
    setIsProfileModalOpen
  } = useAuth();

  const { setIsAdminPanelOpen } = useProducts();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleNavClick = (anchor, isCatalog = false) => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    if (isCatalog && onCatalogClick) {
      onCatalogClick();
      return;
    }
    if (onHomeClick) {
      onHomeClick();
    }
    if (anchor) {
      setTimeout(() => {
        const el = document.querySelector(anchor);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  const openAdmin = () => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    if (!currentUser) {
      if (showToast) showToast(' Please sign in with Admin credentials to access the Admin Panel.');
      setAuthModalTab('login');
      setIsAuthModalOpen(true);
      return;
    }
    if (currentUser.role !== 'ADMIN') {
      if (showToast) showToast(' Access Denied: Admin privileges required.');
      return;
    }
    setIsAdminPanelOpen(true);
  };

  const openTracker = () => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setIsOrderTrackerOpen(true);
  };

  const openProfile = () => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setIsProfileModalOpen(true);
  };

  const openAuth = (tab) => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  return (
    <nav className="site-nav">
      <div className="wrap">
        <a href="#top" className="brand-logo-link" onClick={(e) => { e.preventDefault(); handleNavClick('#top'); }}>
          <img src="/logo.png" alt="ShahLajuk Furniture Mart - SLFM" className="site-logo-img" />
        </a>

        {/* Desktop Navigation Links */}
        <ul className="nav-links desktop-only">
          <li><a href="#shop" onClick={(e) => { e.preventDefault(); handleNavClick('#shop', true); }}>All Products</a></li>
          <li><a href="#rooms" onClick={(e) => { e.preventDefault(); handleNavClick('#rooms'); }}>Rooms</a></li>
          <li><a href="#categories" onClick={(e) => { e.preventDefault(); handleNavClick('#categories'); }}>Categories</a></li>
          <li><a href="#material" onClick={(e) => { e.preventDefault(); handleNavClick('#material'); }}>Material</a></li>
          <li><a href="#visit" onClick={(e) => { e.preventDefault(); handleNavClick('#visit'); }}>Visit us</a></li>
        </ul>

        <div className="nav-right">
          {/* Track Order Icon Button (Desktop - Only Visible When Logged In) */}
          {currentUser && (
            <button
              type="button"
              className="nav-action-btn desktop-only"
              onClick={openTracker}
              title="Track Your Order"
            >
               Track Order
            </button>
          )}

          {/* User Account / Auth Button (Desktop Only) */}
          {currentUser ? (
            <div className="user-menu-container desktop-only">
              <button
                type="button"
                className="user-pill-btn"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              >
                <span className="user-avatar">{currentUser.name.charAt(0)}</span>
                <span className="user-name">{currentUser.name.split(' ')[0]}</span>
                <span className="user-arrow">▾</span>
              </button>

              {userDropdownOpen && (
                <div className="user-dropdown-menu">
                  <div className="user-dropdown-header">
                    <strong>{currentUser.name}</strong>
                    <span>{currentUser.email}</span>
                  </div>
                  {currentUser.role === 'ADMIN' && (
                    <button type="button" onClick={openAdmin} style={{ color: 'var(--walnut)', fontWeight: 600 }}>
                       Admin Dashboard
                    </button>
                  )}
                  <button type="button" onClick={openProfile}>
                     My Profile & Address
                  </button>
                  <button type="button" onClick={openTracker}>
                     My Orders & Tracking
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="dropdown-logout"
                  >
                     Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="nav-auth-btn desktop-only"
              onClick={() => openAuth('login')}
            >
              Sign In
            </button>
          )}

          {/* Cart Pill (Desktop Only) */}
          <button
            type="button"
            className="cart-pill desktop-only"
            onClick={() => setIsCartOpen(true)}
            aria-label="Open Shopping Cart"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="9" cy="20" r="1.4" />
              <circle cx="18" cy="20" r="1.4" />
              <path d="M2 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 7H5.2" />
            </svg>
            <span className="cart-text">Cart</span>
            {totalItemsCount > 0 ? (
              <span className="cart-count-badge">{totalItemsCount}</span>
            ) : (
              <span className="cart-zero">· 0</span>
            )}
          </button>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu-drawer">
          <ul className="mobile-nav-links">
            {/* Mobile View Shopping Cart Option */}
            <li>
              <button
                type="button"
                className="mobile-drawer-btn cart-mobile-drawer-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsCartOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '12px 14px',
                  background: 'var(--bg)',
                  border: '1px solid var(--line)',
                  borderRadius: '6px',
                  fontWeight: '600',
                  color: 'var(--ink)',
                  marginBottom: '12px',
                  cursor: 'pointer'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="9" cy="20" r="1.4" />
                    <circle cx="18" cy="20" r="1.4" />
                    <path d="M2 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 7H5.2" />
                  </svg>
                  Shopping Cart
                </span>
                <span className="cart-count-badge" style={{ position: 'static', transform: 'none' }}>
                  {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
                </span>
              </button>
            </li>
            <li>
              <a href="#shop" onClick={(e) => { e.preventDefault(); handleNavClick('#shop'); }}>
                All Products
              </a>
            </li>
            <li>
              <a href="#rooms" onClick={(e) => { e.preventDefault(); handleNavClick('#rooms'); }}>
                Rooms
              </a>
            </li>
            <li>
              <a href="#categories" onClick={(e) => { e.preventDefault(); handleNavClick('#categories'); }}>
                Categories
              </a>
            </li>
            <li>
              <a href="#material" onClick={(e) => { e.preventDefault(); handleNavClick('#material'); }}>
                Material
              </a>
            </li>
            <li>
              <a href="#visit" onClick={(e) => { e.preventDefault(); handleNavClick('#visit'); }}>
                Visit us
              </a>
            </li>

            {/* Mobile Auth & Order Tracking Options inside Hamburger Menu */}
            <li className="mobile-drawer-auth-section">
              {currentUser ? (
                <div className="mobile-user-profile">
                  <div className="mobile-user-info">
                    <span className="user-avatar">{currentUser.name.charAt(0)}</span>
                    <div>
                      <div className="mobile-user-name">{currentUser.name}</div>
                      <div className="mobile-user-email">{currentUser.email}</div>
                    </div>
                  </div>
                  {currentUser.role === 'ADMIN' && (
                    <button
                      type="button"
                      className="mobile-drawer-btn"
                      onClick={openAdmin}
                      style={{ marginTop: '8px', color: 'var(--walnut)', fontWeight: 600 }}
                    >
                       Admin Dashboard
                    </button>
                  )}
                  <button
                    type="button"
                    className="mobile-drawer-btn primary"
                    onClick={openProfile}
                    style={{ marginTop: '8px' }}
                  >
                     My Profile & Address
                  </button>
                  <button
                    type="button"
                    className="mobile-drawer-btn"
                    onClick={openTracker}
                    style={{ marginTop: '8px' }}
                  >
                     My Orders & Tracking
                  </button>
                  <button
                    type="button"
                    className="mobile-drawer-logout-btn"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                  >
                     Sign Out
                  </button>
                </div>
              ) : (
                <div className="mobile-auth-actions">
                  <button
                    type="button"
                    className="mobile-drawer-btn primary"
                    onClick={() => openAuth('login')}
                  >
                     Sign In / Register
                  </button>
                </div>
              )}
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
