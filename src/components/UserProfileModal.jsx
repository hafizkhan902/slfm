import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { validatePhone, validateEmail, validateName } from '../utils/validation';

export function UserProfileModal() {
  const { currentUser, isProfileModalOpen, setIsProfileModalOpen, updateUserProfile } = useAuth();
  const { showToast } = useCart();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        address: currentUser.address || ''
      });
    }
  }, [currentUser, isProfileModalOpen]);

  if (!isProfileModalOpen || !currentUser) return null;

  const handleClose = () => {
    setSuccessMsg('');
    setIsProfileModalOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccessMsg('');

    const nameVal = validateName(formData.name);
    if (!nameVal.isValid) {
      showToast(nameVal.error);
      return;
    }

    const emailVal = validateEmail(formData.email);
    if (!emailVal.isValid) {
      showToast(emailVal.error);
      return;
    }

    const phoneVal = validatePhone(formData.phone);
    if (!phoneVal.isValid) {
      showToast(phoneVal.error);
      return;
    }

    const res = updateUserProfile({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: phoneVal.cleanPhone,
      address: formData.address.trim()
    });

    if (res.success) {
      setSuccessMsg(res.message);
      showToast('Profile & shipping address updated!');
      setTimeout(() => {
        handleClose();
      }, 1200);
    }
  };

  return (
    <div className="modal-backdrop open" onClick={handleClose}>
      <div className="profile-modal-wrapper" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          type="button"
          className="auth-modal-close"
          onClick={handleClose}
          aria-label="Close profile modal"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="profile-header-banner">
          <div className="profile-avatar-circle">
            {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="profile-title">My Account & Shipping Address</h2>
            <p className="profile-sub">Manage your personal information and default furniture delivery location.</p>
          </div>
        </div>

        {successMsg && (
          <div className="profile-success-alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        <form className="profile-form" onSubmit={handleSubmit}>
          {/* Section 1: Personal Info */}
          <div className="profile-section">
            <h3 className="profile-section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Personal Details
            </h3>

            <div className="profile-grid">
              <div className="form-group">
                <label htmlFor="prof-name">Full Name *</label>
                <div className="input-icon-wrapper">
                  <span className="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    id="prof-name"
                    type="text"
                    required
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="prof-phone">Phone Number *</label>
                <div className="input-icon-wrapper">
                  <span className="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </span>
                  <input
                    id="prof-phone"
                    type="tel"
                    required
                    placeholder="e.g. 01700000000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <span style={{ fontSize: '0.75rem', color: '#777', marginTop: '4px', display: 'block' }}>
                   Must be 11 digits starting with 01
                </span>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '12px' }}>
              <label htmlFor="prof-email">Email Address *</label>
              <div className="input-icon-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input
                  id="prof-email"
                  type="email"
                  required
                  placeholder="tanvir@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Shipping Address */}
          <div className="profile-section">
            <h3 className="profile-section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              Furniture Shipping Address
            </h3>

            <div className="form-group">
              <label htmlFor="prof-address">Default Delivery Address</label>
              <div className="input-icon-wrapper address-wrapper">
                <span className="input-icon address-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </span>
                <textarea
                  id="prof-address"
                  rows="3"
                  placeholder="e.g. House 42, Road 11, Block D, Banani, Trishal, Mymensingh 1213"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="profile-textarea"
                />
              </div>
              <span className="address-hint">
                 This address will be automatically populated during checkout for easy 1-click ordering.
              </span>
            </div>
          </div>

          <div className="profile-actions">
            <button type="button" className="profile-cancel-btn" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="profile-save-btn">
              Save Profile & Address
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
