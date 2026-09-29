import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ProductIcon } from './ProductIcon';
import { validatePhone } from '../utils/validation';
import { api } from '../services/api';

function OrderCard({ order, defaultExpanded = false }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const firstItemName = order.items[0]?.product?.name || 'Item';
  const summaryText = order.items.length > 1
    ? `${firstItemName} + ${order.items.length - 1} more`
    : firstItemName;

  const renderStatusTimeline = (rawStatus) => {
    const steps = ['Placed', 'Confirmed', 'Shipped', 'Delivered'];
    const normalized = String(rawStatus || '').trim().toLowerCase();
    const statusIndex = steps.findIndex(s => s.toLowerCase() === normalized);
    const validIndex = statusIndex !== -1 ? statusIndex : 0;

    return (
      <div className="status-timeline">
        <div
          className="timeline-progress-line"
          style={{ width: `${(validIndex / (steps.length - 1)) * 100}%` }}
        />
        {steps.map((step, idx) => {
          const isCompleted = idx <= validIndex;
          return (
            <div className={`timeline-step ${isCompleted ? 'completed' : ''}`} key={step}>
              <div className="step-dot">{isCompleted ? '' : idx + 1}</div>
              <span className="step-label">{step}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`order-card ${isExpanded ? 'is-expanded' : 'is-collapsed'}`}>
      <div className="order-card-compact" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="order-compact-left">
          <div className="order-compact-meta-row">
            <span className="order-id">{order.id}</span>
            <span className={`status-badge ${order.status.toLowerCase()}`}>
              <span className="status-dot"></span>
              {order.status}
            </span>
          </div>
          <div className="order-compact-sub-row">
            <span className="order-date">
              {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className="order-dot-separator">•</span>
            <span className="order-summary-title"> {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'} ({summaryText})</span>
          </div>
        </div>

        <div className="order-compact-right">
          <span className="order-total-compact">৳{order.totalAmount.toLocaleString()}</span>
          <button
            type="button"
            className="order-expand-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            aria-label="Toggle order details"
          >
            {isExpanded ? 'Hide Details ▴' : 'Details ▾'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="order-card-expanded-body">
          {/* Status Timeline */}
          {renderStatusTimeline(order.status)}

          {/* Items breakdown */}
          <div className="order-items-preview">
            {order.items.map((item, i) => (
              <div className="order-item-row" key={i}>
                <div className="order-item-thumb">
                  <ProductIcon type={item.product.iconType} image={item.product.image} alt={item.product.name} />
                </div>
                <div className="order-item-details">
                  <span className="order-item-name">{item.product.name}</span>
                  <span className="order-item-qty">Qty: {item.quantity} × ৳{item.product.price.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Delivery & Payment details */}
          <div className="order-card-foot" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="order-delivery-info">
              <span> <strong>Delivery Address:</strong> {order.address}</span>
              <span> <strong>Payment:</strong> {order.paymentMethod} {order.trxId ? `(TrxID: ${order.trxId})` : ''}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px dashed #E0D6C8' }}>
              <button
                type="button"
                className="btn-print-receipt"
                onClick={(e) => {
                  e.stopPropagation();
                  const targetId = order.orderNumber || order.id || order._id;
                  window.open(api.getOrderReceiptUrl(targetId), '_blank');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--walnut, #4A2C19)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                  transition: 'background 0.2s ease, transform 0.2s ease'
                }}
              >
                ️ Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function OrderTrackerModal() {
  const {
    isOrderTrackerOpen,
    setIsOrderTrackerOpen,
    currentUser,
    getUserOrders,
    trackOrderById,
    setIsAuthModalOpen,
    setAuthModalTab
  } = useAuth();

  const [activeTab, setActiveTab] = useState('my-orders'); // 'my-orders' | 'track-by-id'
  const [searchId, setSearchId] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [trackedOrderResult, setTrackedOrderResult] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  if (!isOrderTrackerOpen) return null;

  const handleClose = () => {
    setIsOrderTrackerOpen(false);
  };

  const userOrders = getUserOrders();

  const handleSearchOrder = async (e) => {
    e.preventDefault();
    setHasSearched(true);
    try {
      const result = await trackOrderById(searchId, searchPhone);
      setTrackedOrderResult(result || null);
    } catch {
      setTrackedOrderResult(null);
    }
  };

  return (
    <div className="modal-backdrop open" onClick={handleClose}>
      <div className="order-tracker-modal-wrapper" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          type="button"
          className="auth-modal-close"
          onClick={handleClose}
          aria-label="Close tracker modal"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="tracker-modal-head">
          <h2 className="tracker-modal-title">Order History</h2>
          <p className="tracker-modal-sub">
            View your order history & track delivery progress.
          </p>
        </div>

        {/* Minimal Pill Segmented Tab Bar */}
        <div className="auth-tab-pill-bar" style={{ marginTop: '16px', marginBottom: '20px' }}>
          <button
            type="button"
            className={`auth-tab-pill ${activeTab === 'my-orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-orders')}
          >
            My Orders ({userOrders.length})
          </button>
          <button
            type="button"
            className={`auth-tab-pill ${activeTab === 'track-by-id' ? 'active' : ''}`}
            onClick={() => setActiveTab('track-by-id')}
          >
            Track by Order ID
          </button>
        </div>

        {/* TAB 1: MY ORDERS (Logged In User) */}
        {activeTab === 'my-orders' && (
          <div className="tracker-body-content">
            {!currentUser ? (
              <div className="tracker-empty-card">
                <div className="empty-icon-circle"></div>
                <h3 className="empty-title">Sign in to view orders</h3>
                <p className="empty-sub">
                  Log in to see past purchases and live delivery tracking.
                </p>
                <button
                  type="button"
                  className="auth-submit-btn"
                  style={{ maxWidth: '180px', margin: '14px auto 0' }}
                  onClick={() => {
                    setIsOrderTrackerOpen(false);
                    setAuthModalTab('login');
                    setIsAuthModalOpen(true);
                  }}
                >
                  Sign In
                </button>
              </div>
            ) : userOrders.length === 0 ? (
              <div className="tracker-empty-card">
                <div className="empty-icon-circle"></div>
                <h3 className="empty-title">No orders placed yet</h3>
                <p className="empty-sub">
                  Your placed orders will show up here with live status updates.
                </p>
              </div>
            ) : (
              <div className="orders-list">
                {userOrders.map((order, index) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    defaultExpanded={index === 0}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TRACK BY ORDER ID */}
        {activeTab === 'track-by-id' && (
          <div className="tracker-body-content">
            <form className="auth-form" onSubmit={handleSearchOrder}>
              <div className="form-group">
                <label htmlFor="search-order-id">Order ID *</label>
                <div className="input-icon-wrapper">
                  <span className="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                  </span>
                  <input
                    id="search-order-id"
                    type="text"
                    required
                    placeholder="e.g. SLM-98421"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="search-order-phone">Phone Number *</label>
                <div className="input-icon-wrapper">
                  <span className="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </span>
                  <input
                    id="search-order-phone"
                    type="tel"
                    required
                    placeholder="e.g. 01700000000"
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                  />
                </div>
                <span style={{ fontSize: '0.75rem', color: '#777', marginTop: '4px', display: 'block' }}>
                   Must be 11 digits starting with 01
                </span>
              </div>

              <button type="submit" className="auth-submit-btn" style={{ marginTop: '4px' }}>
                Track Order
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </form>

            {hasSearched && (
              <div style={{ marginTop: '20px' }}>
                {trackedOrderResult ? (
                  <OrderCard order={trackedOrderResult} defaultExpanded={true} />
                ) : (
                  <div className="tracker-empty-card">
                    <div className="empty-icon-circle"></div>
                    <h3 className="empty-title">No order found</h3>
                    <p className="empty-sub">
                      No order matching ID "<strong>{searchId}</strong>" and Phone "<strong>{searchPhone}</strong>".
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
