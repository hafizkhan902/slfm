import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { validatePhone, validateName } from '../utils/validation';
import { api } from '../services/api';

export function CheckoutModal() {
  const { isCheckoutOpen, setIsCheckoutOpen, cartItems, subtotal, clearCart, showToast } = useCart();
  const { currentUser, createOrder, setIsOrderTrackerOpen, setAuthModalTab, setIsAuthModalOpen } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    paymentMethod: 'Cash on Delivery (COD)',
    trxId: ''
  });

  const [mfsSettings, setMfsSettings] = useState({
    bkashNumber: '01712-345678',
    nagadNumber: '01812-345678'
  });

  // Delivery Area Cascading State
  const [deliveryDivisions, setDeliveryDivisions] = useState([]);
  const [isLoadingGeo, setIsLoadingGeo] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [selectedDivisionId, setSelectedDivisionId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedUpazilaId, setSelectedUpazilaId] = useState('');
  const [selectedAreaDetails, setSelectedAreaDetails] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);

  const [placedOrderId, setPlacedOrderId] = useState('');
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  // Redirect guest/unauthenticated users to Auth Login Modal when opening Checkout
  useEffect(() => {
    if (isCheckoutOpen && !currentUser) {
      setIsCheckoutOpen(false);
      if (showToast) showToast('Please sign in to your account to proceed with checkout.');
      setAuthModalTab('login');
      setIsAuthModalOpen(true);
    }
  }, [isCheckoutOpen, currentUser]);

  // Fetch MFS settings & active delivery areas hierarchy
  useEffect(() => {
    if (!isCheckoutOpen) return;

    const fetchMfsSettings = async () => {
      try {
        const settings = await api.getSettings();
        if (settings) {
          setMfsSettings({
            bkashNumber: settings.bkashNumber || '01712-345678',
            nagadNumber: settings.nagadNumber || '01812-345678'
          });
        }
      } catch (err) {
        console.warn('[CheckoutModal] Failed to load store MFS settings:', err.message);
      }
    };

    const fetchDeliveryHierarchy = async () => {
      setIsLoadingGeo(true);
      setGeoError('');
      try {
        const res = await api.getActiveDeliveryHierarchy();
        if (res && Array.isArray(res.divisions)) {
          setDeliveryDivisions(res.divisions);
        } else {
          setDeliveryDivisions([]);
        }
      } catch (err) {
        console.warn('[CheckoutModal] Failed to fetch active delivery areas:', err.message);
        setGeoError('Could not load delivery locations. Please verify connection.');
      } finally {
        setIsLoadingGeo(false);
      }
    };

    fetchMfsSettings();
    fetchDeliveryHierarchy();
  }, [isCheckoutOpen]);

  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        name: currentUser.name || prev.name,
        phone: currentUser.phone || prev.phone,
        address: currentUser.address || prev.address
      }));
    }
  }, [currentUser, isCheckoutOpen]);

  if (!isCheckoutOpen || !currentUser) return null;

  // Active cascading options
  const currentDivision = deliveryDivisions.find(
    (d) => String(d.id) === String(selectedDivisionId)
  );
  const availableDistricts = currentDivision ? currentDivision.districts || [] : [];

  const currentDistrict = availableDistricts.find(
    (d) => String(d.id) === String(selectedDistrictId)
  );
  const availableUpazilas = currentDistrict ? currentDistrict.upazilas || [] : [];

  const handleDivisionChange = (e) => {
    const val = e.target.value;
    setSelectedDivisionId(val);
    setSelectedDistrictId('');
    setSelectedUpazilaId('');
    setSelectedAreaDetails(null);
    setDeliveryFee(0);
  };

  const handleDistrictChange = (e) => {
    const val = e.target.value;
    setSelectedDistrictId(val);
    setSelectedUpazilaId('');
    setSelectedAreaDetails(null);
    setDeliveryFee(0);
  };

  const handleUpazilaChange = (e) => {
    const val = e.target.value;
    setSelectedUpazilaId(val);
    if (!val) {
      setSelectedAreaDetails(null);
      setDeliveryFee(0);
      return;
    }
    const upz = availableUpazilas.find((u) => String(u.id) === String(val));
    if (upz) {
      setSelectedAreaDetails(upz);
      setDeliveryFee(Number(upz.deliveryFee || 0));
    } else {
      setSelectedAreaDetails(null);
      setDeliveryFee(0);
    }
  };

  const grandTotal = subtotal + (selectedAreaDetails ? Number(deliveryFee) : 0);

  const isbKash = formData.paymentMethod.toLowerCase().includes('bkash');
  const isNagad = formData.paymentMethod.toLowerCase().includes('nagad');
  const isMobileBanking = isbKash || isNagad;
  const isCOD = formData.paymentMethod.toLowerCase().includes('cash on delivery');

  const handleCopyNumber = (number, provider) => {
    try {
      navigator.clipboard.writeText(number);
      showToast(`Copied ${provider} number (${number}) to clipboard!`);
    } catch {
      showToast(`${provider} number: ${number}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nameVal = validateName(formData.name);
    if (!nameVal.isValid) {
      showToast(nameVal.error);
      return;
    }

    const phoneVal = validatePhone(formData.phone);
    if (!phoneVal.isValid) {
      showToast(phoneVal.error);
      return;
    }

    // Geographic area requirement if delivery areas are configured
    if (deliveryDivisions.length > 0) {
      if (!selectedDivisionId || !selectedDistrictId || !selectedUpazilaId || !selectedAreaDetails) {
        showToast('Please select your Division, District, and Upazila for delivery.');
        return;
      }
    }

    if (!formData.address.trim()) {
      showToast('Please enter your detailed street address.');
      return;
    }

    if (isMobileBanking && !formData.trxId.trim()) {
      showToast(`Please enter your ${isbKash ? 'bKash' : 'Nagad'} Transaction ID (TrxID) to verify payment.`);
      return;
    }

    try {
      const fullAddressString = selectedAreaDetails
        ? `${formData.address.trim()}, ${selectedAreaDetails.name}, ${currentDistrict?.name}, ${currentDivision?.name}`
        : formData.address.trim();

      const orderId = await createOrder({
        name: formData.name.trim(),
        phone: phoneVal.cleanPhone,
        address: fullAddressString,
        deliveryLocation: selectedAreaDetails
          ? {
              divisionId: Number(currentDivision?.id),
              divisionName: currentDivision?.name,
              districtId: Number(currentDistrict?.id),
              districtName: currentDistrict?.name,
              upazilaId: Number(selectedAreaDetails.id),
              upazilaName: selectedAreaDetails.name,
              deliveryFee: Number(selectedAreaDetails.deliveryFee)
            }
          : null,
        shippingFee: selectedAreaDetails ? Number(selectedAreaDetails.deliveryFee) : 0,
        paymentMethod: formData.paymentMethod,
        trxId: isMobileBanking ? formData.trxId.trim().toUpperCase() : '',
        items: cartItems,
        totalAmount: grandTotal
      });

      setPlacedOrderId(orderId);
      setOrderConfirmed(true);
      clearCart();
    } catch (err) {
      showToast(`Order failed: ${err.message || 'Server error'}`);
    }
  };

  const handleClose = () => {
    setOrderConfirmed(false);
    setPlacedOrderId('');
    setIsCheckoutOpen(false);
  };

  const handleTrackDirectly = () => {
    handleClose();
    setIsOrderTrackerOpen(true);
  };

  return (
    <div className="modal-backdrop open" onClick={handleClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close-icon"
          onClick={handleClose}
          aria-label="Close modal"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="modal-content">
          {orderConfirmed ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  background: 'var(--sage-light)',
                  color: 'var(--sage)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                  margin: '0 auto 16px'
                }}
              >
                
              </div>
              <h2 style={{ fontSize: '1.8rem' }}>Order Placed Successfully!</h2>

              <div
                style={{
                  margin: '16px auto',
                  padding: '12px 20px',
                  background: 'var(--bg)',
                  border: '1px solid var(--line)',
                  borderRadius: '6px',
                  maxWidth: '340px'
                }}
              >
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
                  Your Order Tracking ID:
                </span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--walnut)', fontFamily: 'Fraunces, serif' }}>
                  {placedOrderId}
                </div>
                {formData.trxId && (
                  <div style={{ fontSize: '0.84rem', marginTop: '4px', color: 'var(--ink-soft)' }}>
                    TrxID: <strong style={{ color: 'var(--ink)' }}>{formData.trxId}</strong>
                  </div>
                )}
              </div>

              <p style={{ marginTop: '12px', color: 'var(--ink-soft)', fontSize: '0.92rem' }}>
                Thank you for shopping with <strong>ShahLajuk Furniture Mart</strong>. Our representative will contact you at <strong>{formData.phone}</strong> to confirm your delivery.
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
                <button type="button" className="btn" onClick={handleTrackDirectly}>
                  Track Order Now 
                </button>
                <button type="button" className="btn-cart" onClick={handleClose} style={{ minHeight: '46px' }}>
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h2>Checkout & Delivery</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', marginTop: '4px' }}>
                Complete your order details below for ShahLajuk Furniture Mart.
              </p>

              {/* Order Summary & Pricing Calculation */}
              <div
                style={{
                  margin: '16px 0',
                  padding: '14px 16px',
                  background: 'var(--bg)',
                  border: '1px solid var(--line)',
                  borderRadius: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--ink-soft)' }}>Order Items ({cartItems.reduce((sum, item) => sum + item.quantity, 0)}):</span>
                  <span style={{ fontWeight: 600 }}>৳{subtotal.toLocaleString()}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--ink-soft)' }}>
                    Delivery Fee {selectedAreaDetails ? `(${selectedAreaDetails.name})` : ''}:
                  </span>
                  <span style={{ fontWeight: 600, color: selectedAreaDetails ? 'var(--walnut)' : 'var(--ink-soft)' }}>
                    {selectedAreaDetails ? `৳${deliveryFee.toLocaleString()}` : 'Select area below'}
                  </span>
                </div>

                <div style={{ height: '1px', background: 'var(--line)', margin: '10px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ink)' }}>Total Amount:</span>
                  <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--walnut)' }}>
                    ৳{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <form className="checkout-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <div className="input-icon-wrapper">
                    <span className="input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      id="name"
                      type="text"
                      required
                      placeholder="e.g. Tanvir Hasan"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <div className="input-icon-wrapper">
                    <span className="input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </span>
                    <input
                      id="phone"
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

                {/* Cascading Location Hierarchy (BD-GeoAPI + Admin Configured Areas) */}
                <div style={{ marginTop: '10px', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                    Delivery Area (Bangladesh) *
                  </label>

                  {isLoadingGeo ? (
                    <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '6px', fontSize: '0.88rem', color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="spinner" style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid var(--walnut)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></span>
                      Loading available delivery areas...
                    </div>
                  ) : geoError ? (
                    <div style={{ padding: '10px 12px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px', color: '#991B1B', fontSize: '0.85rem' }}>
                      ⚠️ {geoError}
                    </div>
                  ) : deliveryDivisions.length === 0 ? (
                    <div style={{ padding: '12px', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
                      ℹ️ Delivery areas are being configured by store management. Please enter your full delivery address below.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                      {/* 1. Division Dropdown */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <label htmlFor="geo-division" style={{ fontSize: '0.74rem' }}>Division *</label>
                        <select
                          id="geo-division"
                          value={selectedDivisionId}
                          onChange={handleDivisionChange}
                          required
                          style={{
                            width: '100%',
                            padding: '9px 10px',
                            background: 'var(--paper)',
                            border: '1px solid var(--line)',
                            borderRadius: '5px',
                            fontSize: '0.88rem',
                            color: 'var(--ink)'
                          }}
                        >
                          <option value="">Select Division</option>
                          {deliveryDivisions.map((div) => (
                            <option key={div.id} value={div.id}>
                              {div.name} {div.nameBn ? `(${div.nameBn})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 2. District Dropdown */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <label htmlFor="geo-district" style={{ fontSize: '0.74rem' }}>District *</label>
                        <select
                          id="geo-district"
                          value={selectedDistrictId}
                          onChange={handleDistrictChange}
                          disabled={!selectedDivisionId}
                          required
                          style={{
                            width: '100%',
                            padding: '9px 10px',
                            background: selectedDivisionId ? 'var(--paper)' : 'rgba(0,0,0,0.03)',
                            border: '1px solid var(--line)',
                            borderRadius: '5px',
                            fontSize: '0.88rem',
                            color: selectedDivisionId ? 'var(--ink)' : 'var(--ink-soft)',
                            cursor: selectedDivisionId ? 'pointer' : 'not-allowed'
                          }}
                        >
                          <option value="">
                            {selectedDivisionId ? 'Select District' : 'Choose Division first'}
                          </option>
                          {availableDistricts.map((dist) => (
                            <option key={dist.id} value={dist.id}>
                              {dist.name} {dist.nameBn ? `(${dist.nameBn})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 3. Upazila Dropdown */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <label htmlFor="geo-upazila" style={{ fontSize: '0.74rem' }}>Upazila / Area *</label>
                        <select
                          id="geo-upazila"
                          value={selectedUpazilaId}
                          onChange={handleUpazilaChange}
                          disabled={!selectedDistrictId}
                          required
                          style={{
                            width: '100%',
                            padding: '9px 10px',
                            background: selectedDistrictId ? 'var(--paper)' : 'rgba(0,0,0,0.03)',
                            border: '1px solid var(--line)',
                            borderRadius: '5px',
                            fontSize: '0.88rem',
                            color: selectedDistrictId ? 'var(--ink)' : 'var(--ink-soft)',
                            cursor: selectedDistrictId ? 'pointer' : 'not-allowed'
                          }}
                        >
                          <option value="">
                            {selectedDistrictId ? 'Select Upazila' : 'Choose District first'}
                          </option>
                          {availableUpazilas.map((upz) => (
                            <option key={upz.id} value={upz.id}>
                              {upz.name} {upz.nameBn ? `(${upz.nameBn})` : ''} — ৳{upz.deliveryFee}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Active Area Confirmation Pill */}
                  {selectedAreaDetails && (
                    <div
                      style={{
                        marginTop: '8px',
                        padding: '8px 12px',
                        background: 'rgba(201, 168, 118, 0.15)',
                        border: '1px solid rgba(201, 168, 118, 0.4)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.84rem'
                      }}
                    >
                      <span style={{ color: 'var(--walnut)', fontWeight: 600 }}>
                        🚚 Delivery to {selectedAreaDetails.name}: <strong>৳{deliveryFee}</strong>
                      </span>
                      <span style={{ color: 'var(--ink-soft)', fontSize: '0.78rem' }}>
                        Est. {selectedAreaDetails.estimatedDays || '2-4 business days'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Detailed Street Address */}
                <div className="form-group">
                  <label htmlFor="address">Detailed Street Address (Holding, Road, Village, Landmark) *</label>
                  <div className="input-icon-wrapper address-wrapper">
                    <span className="input-icon address-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                    </span>
                    <textarea
                      id="address"
                      rows="2"
                      required
                      placeholder="e.g. House #12, Road #4, Porabari Road, near CNG Station..."
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="profile-textarea"
                    ></textarea>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="payment">Payment Options</label>
                  <select
                    id="payment"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: 'rgba(239, 234, 225, 0.55)',
                      border: 'none',
                      borderBottom: '2px solid var(--line)',
                      borderRadius: '6px 6px 2px 2px',
                      fontSize: '0.92rem',
                      color: 'var(--ink)',
                      fontWeight: 500
                    }}
                  >
                    <option value="Cash on Delivery (COD)">Cash on Delivery (COD)</option>
                    <option value="bKash Mobile Banking">bKash Mobile Banking</option>
                    <option value="Nagad Mobile Banking">Nagad Mobile Banking</option>
                    <option value="Credit / Debit Card">Credit / Debit Card</option>
                  </select>
                </div>

                {/* COD Advance Shipping Charge Notice */}
                {isCOD && (
                  <div className="cod-warning-card">
                    <div className="cod-warning-head">
                      <span className="cod-warning-icon">⚠️</span>
                      <strong>Advance Delivery Charge Notice</strong>
                    </div>
                    <p className="cod-warning-text">
                      For <strong>Cash on Delivery (COD)</strong> orders, paying the shipping/delivery charge (<strong>৳{selectedAreaDetails ? deliveryFee : 120}</strong>) in advance is required to confirm order dispatch. Our representative will contact you at <strong>{formData.phone || 'your phone number'}</strong> to assist with the advance delivery fee.
                    </p>
                  </div>
                )}

                {/* Mobile Banking Payment Instructions & TrxID Input */}
                {isMobileBanking && (() => {
                  const activeMfsNumber = isbKash ? mfsSettings.bkashNumber : mfsSettings.nagadNumber;
                  const providerName = isbKash ? 'bKash' : 'Nagad';

                  return (
                    <div className={`mbk-card ${isbKash ? 'bkash-card' : 'nagad-card'}`}>
                      <div className="mbk-head">
                        <span className="mbk-provider-title">
                          {isbKash ? '⚡ bKash Personal / Merchant' : '⚡ Nagad Personal / Merchant'}
                        </span>
                        <button
                          type="button"
                          className="mbk-copy-btn"
                          onClick={() => handleCopyNumber(activeMfsNumber, providerName)}
                        >
                          📋 {activeMfsNumber} (Tap to Copy)
                        </button>
                      </div>

                      <ol className="mbk-steps-list">
                        <li>Go to your {isbKash ? 'bKash App (*247#)' : 'Nagad App (*167#)'}.</li>
                        <li>Send money/payment total <strong>৳{grandTotal.toLocaleString()}</strong> (including ৳{deliveryFee} delivery charge) to <strong>{activeMfsNumber}</strong>.</li>
                        <li>Copy the Transaction ID (TrxID) from your SMS receipt and enter it below.</li>
                      </ol>

                      <div className="form-group" style={{ marginTop: '12px' }}>
                        <label htmlFor="trxId" style={{ fontWeight: 600, color: 'var(--ink)' }}>
                          Transaction ID (TrxID) *
                        </label>
                        <div className="input-icon-wrapper" style={{ background: '#FFFFFF' }}>
                          <span className="input-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                              <rect x="2" y="5" width="20" height="14" rx="2" />
                              <line x1="2" y1="10" x2="22" y2="10" />
                            </svg>
                          </span>
                          <input
                            id="trxId"
                            type="text"
                            required
                            placeholder={isbKash ? 'e.g. 9B7X2K4L1M' : 'e.g. 7A8B9C10D1'}
                            value={formData.trxId}
                            onChange={(e) => setFormData({ ...formData, trxId: e.target.value.toUpperCase() })}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <button type="submit" className="auth-submit-btn" style={{ marginTop: '16px' }}>
                  Confirm Order — ৳{grandTotal.toLocaleString()}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
