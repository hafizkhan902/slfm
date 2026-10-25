import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';

/**
 * Modern Minimalist Navbar (Japandi / Architectural Gallery Aesthetic)
 * Architecture:
 * - Left: Minimalist category links
 * - Center: Centered architectural brandmark
 * - Right: 1.5px stroke icons (Search, Tracking/Wishlist, Account, Cart) & Full-screen Drawer Toggle
 */
export function Navbar({ onHomeClick, onCatalogClick }) {
  const { totalItemsCount, isCartOpen, setIsCartOpen, showToast, setIsCustomInquiryOpen } = useCart();
  const {
    currentUser,
    logout,
    setIsAuthModalOpen,
    setAuthModalTab,
    setIsOrderTrackerOpen,
    setIsProfileModalOpen
  } = useAuth();

  const { setIsAdminPanelOpen } = useProducts();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [orderDropdownOpen, setOrderDropdownOpen] = useState(false);

  // Close menus on ESC key or clicking outside
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        setUserDropdownOpen(false);
        setOrderDropdownOpen(false);
      }
    };
    const handleClickOutside = (e) => {
      if (!e.target.closest('.user-account-container')) {
        setUserDropdownOpen(false);
      }
      if (!e.target.closest('.orders-menu-container')) {
        setOrderDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Prevent background scroll when full-screen drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  const handleNavClick = (anchor, isCatalog = false) => {
    setDrawerOpen(false);
    setUserDropdownOpen(false);
    setOrderDropdownOpen(false);
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
      }, 60);
    }
  };

  const openAdmin = () => {
    setDrawerOpen(false);
    setUserDropdownOpen(false);
    setOrderDropdownOpen(false);
    if (!currentUser) {
      if (showToast) showToast('Please sign in with Admin credentials to access the Admin Panel.');
      setAuthModalTab('login');
      setIsAuthModalOpen(true);
      return;
    }
    if (currentUser.role !== 'ADMIN') {
      if (showToast) showToast('Access Denied: Admin privileges required.');
      return;
    }
    setIsAdminPanelOpen(true);
  };

  const openTracker = () => {
    setDrawerOpen(false);
    setUserDropdownOpen(false);
    setOrderDropdownOpen(false);
    setIsOrderTrackerOpen(true);
  };

  const openCustomInquiry = () => {
    setDrawerOpen(false);
    setUserDropdownOpen(false);
    setOrderDropdownOpen(false);
    setIsCustomInquiryOpen(true);
  };

  const openProfile = () => {
    setDrawerOpen(false);
    setUserDropdownOpen(false);
    setOrderDropdownOpen(false);
    setIsProfileModalOpen(true);
  };

  const openAuth = (tab) => {
    setDrawerOpen(false);
    setUserDropdownOpen(false);
    setOrderDropdownOpen(false);
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  return (
    <>
      <header className="minimal-header">
        <div className="header-grid">
          {/* LEFT: Minimalist Nav Links (Desktop) & Drawer Opener (Mobile Only) */}
          <div className="header-left">
            <button
              type="button"
              className="drawer-toggle-btn mobile-only"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open Navigation Menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="7" x2="21" y2="7"></line>
                <line x1="3" y1="12" x2="16" y2="12"></line>
                <line x1="3" y1="17" x2="21" y2="17"></line>
              </svg>
            </button>

            <nav className="desktop-links desktop-only" aria-label="Primary Navigation">
              <a
                href="#shop"
                onClick={(e) => { e.preventDefault(); handleNavClick('#shop', true); }}
              >
                Collection
              </a>
              <a
                href="#rooms"
                onClick={(e) => { e.preventDefault(); handleNavClick('#rooms'); }}
              >
                Rooms
              </a>
              <a
                href="#material"
                onClick={(e) => { e.preventDefault(); handleNavClick('#material'); }}
              >
                Materials
              </a>
              <a
                href="#visit"
                onClick={(e) => { e.preventDefault(); handleNavClick('#visit'); }}
              >
                Workshop
              </a>
            </nav>

          </div>

          {/* CENTER: Architectural Brandmark */}
          <div className="header-center">
            <a
              href="#top"
              className="brand-mark-link"
              onClick={(e) => { e.preventDefault(); handleNavClick('#top'); }}
              aria-label="ShahLajuk Furniture Mart - Back to Top"
            >
              <span className="brand-mark-main">SHAH LAJUK</span>
              <span className="brand-mark-sub">FURNITURE MART</span>
            </a>
          </div>

          {/* RIGHT: 1.5px Stroke Minimal Action Icons */}
          <div className="header-right">
            {/* Search Icon (opens catalog / search) */}
            <button
              type="button"
              className="header-icon-btn"
              onClick={() => handleNavClick('#shop', true)}
              title="Search Collection"
              aria-label="Search Collection"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>

            {/* Orders & Custom Commission Menu Popdown */}
            <div className="orders-menu-container">
              <button
                type="button"
                className={`header-icon-btn ${orderDropdownOpen ? 'active' : ''}`}
                onClick={() => {
                  setOrderDropdownOpen(!orderDropdownOpen);
                  setUserDropdownOpen(false);
                }}
                title="Orders & Custom Furniture Requests"
                aria-expanded={orderDropdownOpen}
                aria-label="Orders & Custom Furniture Requests"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"></path>
                  <polyline points="3.29 7 12 12 20.71 7"></polyline>
                  <line x1="12" y1="12" x2="12" y2="22"></line>
                </svg>
              </button>

              {orderDropdownOpen && (
                <div className="orders-dropdown-panel" role="menu">
                  <div className="orders-dropdown-header">
                    <span className="orders-dropdown-eyebrow">ORDERS & COMMISSIONS</span>
                    <strong>Orders & Requests</strong>
                  </div>
                  <button
                    type="button"
                    className="dropdown-link"
                    onClick={() => {
                      setOrderDropdownOpen(false);
                      openTracker();
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"></path>
                      <polyline points="3.29 7 12 12 20.71 7"></polyline>
                      <line x1="12" y1="12" x2="12" y2="22"></line>
                    </svg>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, color: '#1C1917' }}>Track Orders & History</div>
                      <div style={{ fontSize: '0.72rem', color: '#78716C' }}>Live status, invoices & updates</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="dropdown-link highlight"
                    onClick={() => {
                      setOrderDropdownOpen(false);
                      openCustomInquiry();
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, color: 'var(--walnut)' }}>Custom Furniture Order</div>
                      <div style={{ fontSize: '0.72rem', color: '#78716C' }}>Upload reference photos & sizing</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Account / User Menu */}
            {currentUser ? (
              <div className="user-account-container">
                <button
                  type="button"
                  className={`user-account-btn ${userDropdownOpen ? 'active' : ''}`}
                  onClick={() => {
                    setUserDropdownOpen(!userDropdownOpen);
                    setOrderDropdownOpen(false);
                  }}
                  aria-expanded={userDropdownOpen}
                  aria-label="Account Menu"
                >
                  <span className="user-initial">{currentUser.name.charAt(0)}</span>
                  <span className="user-short-name desktop-only">{currentUser.name.split(' ')[0]}</span>
                </button>

                {userDropdownOpen && (
                  <div className="account-dropdown-panel">
                    <div className="account-dropdown-header">
                      <strong>{currentUser.name}</strong>
                      <span>{currentUser.email}</span>
                    </div>
                    {currentUser.role === 'ADMIN' && (
                      <button type="button" onClick={openAdmin} className="dropdown-link admin">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="7" height="7"></rect>
                          <rect x="14" y="3" width="7" height="7"></rect>
                          <rect x="14" y="14" width="7" height="7"></rect>
                          <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                        <span>Admin Dashboard</span>
                      </button>
                    )}
                    <button type="button" onClick={openProfile} className="dropdown-link">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      <span>My Profile & Address</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="dropdown-link logout"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="header-icon-btn"
                onClick={() => openAuth('login')}
                title="Sign In / Register"
                aria-label="Sign In"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </button>
            )}

            {/* Shopping Bag / Cart */}
            <button
              type="button"
              className="header-cart-btn"
              onClick={() => setIsCartOpen(true)}
              aria-label={`Open Shopping Cart (${totalItemsCount} items)`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {totalItemsCount > 0 ? (
                <span className="cart-badge-dot">{totalItemsCount}</span>
              ) : null}
            </button>
          </div>
        </div>
      </header>

      {/* FULL-SCREEN MINIMALIST MENU DRAWER */}
      {drawerOpen && (
        <div className="fullscreen-menu-drawer" role="dialog" aria-modal="true" aria-label="Site Navigation">
          <div className="drawer-inner-wrap">
            {/* Top Bar inside Drawer */}
            <div className="drawer-top-bar">
              <span className="drawer-brand-sub">SHAH LAJUK FURNITURE MART — ARCHITECTURAL ARCHIVE</span>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close Navigation"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Two-Column Editorial Layout */}
            <div className="drawer-content-grid">
              {/* Left Column: Numbered Architectural Navigation */}
              <div className="drawer-nav-col">
                <span className="drawer-col-label">NAVIGATION</span>
                <ul className="drawer-editorial-links">
                  <li>
                    <a
                      href="#shop"
                      onClick={(e) => { e.preventDefault(); handleNavClick('#shop', true); }}
                    >
                      <span className="link-num">01</span>
                      <span className="link-label">All Furniture Collection</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#rooms"
                      onClick={(e) => { e.preventDefault(); handleNavClick('#rooms'); }}
                    >
                      <span className="link-num">02</span>
                      <span className="link-label">Curated Rooms & Living</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#categories"
                      onClick={(e) => { e.preventDefault(); handleNavClick('#categories'); }}
                    >
                      <span className="link-num">03</span>
                      <span className="link-label">Categories & Units</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#material"
                      onClick={(e) => { e.preventDefault(); handleNavClick('#material'); }}
                    >
                      <span className="link-num">04</span>
                      <span className="link-label">Melamine Board & Teak</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#visit"
                      onClick={(e) => { e.preventDefault(); handleNavClick('#visit'); }}
                    >
                      <span className="link-num">05</span>
                      <span className="link-label">Visit Workshop Showroom</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#custom-build"
                      onClick={(e) => { e.preventDefault(); openCustomInquiry(); }}
                    >
                      <span className="link-num">06</span>
                      <span className="link-label">Custom Order & Bespoke Build</span>
                    </a>
                  </li>
                </ul>

              </div>

              {/* Right Column: Workshop Info & Account Details */}
              <div className="drawer-info-col">
                <div className="drawer-info-block">
                  <span className="drawer-col-label">WORKSHOP & SHOWROOM</span>
                  <p className="drawer-info-text">
                    Rampura Road, Trishal, Mymensingh, Bangladesh<br />
                    Open Saturday – Thursday: 9:00 AM – 8:00 PM
                  </p>
                  <p className="drawer-info-contact">
                    Inquiries & WhatsApp: <strong>+880 1711-000000</strong>
                  </p>
                </div>

                <div className="drawer-info-block">
                  <span className="drawer-col-label">CUSTOMER ACCESS</span>
                  {currentUser ? (
                    <div className="drawer-account-panel">
                      <div className="drawer-user-row">
                        <span className="user-initial">{currentUser.name.charAt(0)}</span>
                        <div>
                          <div className="drawer-user-name">{currentUser.name}</div>
                          <div className="drawer-user-email">{currentUser.email}</div>
                        </div>
                      </div>
                      <div className="drawer-actions-row">
                        {currentUser.role === 'ADMIN' && (
                          <button type="button" onClick={openAdmin} className="drawer-action-btn admin">
                            Admin Dashboard
                          </button>
                        )}
                        <button type="button" onClick={openProfile} className="drawer-action-btn">
                          My Profile
                        </button>
                        <button type="button" onClick={openTracker} className="drawer-action-btn">
                          Track Orders
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDrawerOpen(false);
                            logout();
                          }}
                          className="drawer-action-btn logout"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="drawer-auth-buttons">
                      <button
                        type="button"
                        className="drawer-auth-btn primary"
                        onClick={() => openAuth('login')}
                      >
                        Sign In / Create Account
                      </button>
                      <button
                        type="button"
                        className="drawer-auth-btn secondary"
                        onClick={openTracker}
                      >
                        Track Existing Order
                      </button>
                      <button
                        type="button"
                        className="drawer-auth-btn bespoke"
                        onClick={openCustomInquiry}
                      >
                        Custom Furniture Inquiry
                      </button>
                    </div>
                  )}

                </div>

                <div className="drawer-info-footer">
                  <span>Nationwide Bangladesh Delivery · Chittagong Teak & Melamine</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Independent Floating Cart Button (Right Bottom Corner) */}
      <button
        type="button"
        className={`mobile-floating-cart-btn ${isCartOpen || drawerOpen ? 'drawer-open' : ''}`}
        onClick={() => setIsCartOpen(true)}
        aria-label={`Open Shopping Cart (${totalItemsCount} items)`}
      >
        <span className="floating-cart-icon-inner">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          {totalItemsCount > 0 && (
            <span className="floating-cart-count-badge" key={totalItemsCount}>
              {totalItemsCount}
            </span>
          )}
        </span>
      </button>
    </>
  );
}
