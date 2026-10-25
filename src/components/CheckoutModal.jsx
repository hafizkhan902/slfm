import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { validatePhone, validateName } from '../utils/validation';
import { api } from '../services/api';
import { ProductIcon } from './ProductIcon';

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
      <div className="checkout-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="checkout-header-area">
          <div className="checkout-title-row">
            <div>
              <h2 className="checkout-heading">
                Checkout <span className="checkout-heading-amp">&amp;</span> delivery
              </h2>
              <p className="checkout-subheading">
                Complete your order details for ShahLajuk Furniture Mart.
              </p>
            </div>
            <button
              type="button"
              className="checkout-close-btn"
              onClick={handleClose}
              aria-label="Close checkout"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <div className="checkout-scroll-body">
          {orderConfirmed ? (
            <div style={{ textAlign: 'center', padding: '24px 0 12px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  background: 'rgba(74, 93, 79, 0.12)',
                  color: '#4A5D4F',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.6rem',
                  margin: '0 auto 16px'
                }}
              >
                ✓
              </div>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.6rem', color: '#1C1917', margin: 0 }}>
                Order Placed Successfully!
              </h2>

              <div
                style={{
                  margin: '16px auto',
                  padding: '14px 20px',
                  background: '#FAF8F5',
                  border: '1px solid #E5E0D8',
                  borderRadius: '10px',
                  maxWidth: '340px'
                }}
              >
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#78716C', fontWeight: 600 }}>
                  Order Tracking ID
                </span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3A2415', fontFamily: 'Fraunces, serif', marginTop: '2px' }}>
                  {placedOrderId}
                </div>
                {formData.trxId && (
                  <div style={{ fontSize: '0.82rem', marginTop: '6px', color: '#78716C' }}>
                    TrxID: <strong style={{ color: '#1C1917' }}>{formData.trxId}</strong>
                  </div>
                )}
              </div>

              <p style={{ marginTop: '12px', color: '#78716C', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Thank you for choosing <strong>ShahLajuk Furniture Mart</strong>. Our representative will contact you at <strong>{formData.phone}</strong> to confirm dispatch.
              </p>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="checkout-place-btn"
                  onClick={handleTrackDirectly}
                  style={{ width: 'auto', padding: '12px 24px', fontSize: '0.92rem' }}
                >
                  Track Order Now
                </button>
                <button
                  type="button"
                  className="checkout-secondary-btn"
                  onClick={handleClose}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* TOP SECTION: PRODUCT LIST & TOTAL PRICING */}
              <div className="checkout-top-summary">
                {/* Product List */}
                <div className="checkout-products-list">
                  {cartItems.map(({ product, quantity }) => {
                    const lineTotal = product.price * quantity;
                    return (
                      <div key={product.id} className="checkout-product-row">
                        <div className="checkout-product-thumb">
                          <ProductIcon type={product.iconType} image={product.image} alt={product.name} />
                        </div>
                        <div className="checkout-product-details">
                          <div className="checkout-product-name">{product.name}</div>
                          <div className="checkout-product-sub">
                            <span>{quantity}x</span>
                            <span> · </span>
                            <span>৳{product.price.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="checkout-product-price">
                          ৳{lineTotal.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Delivery Fee & Grand Total Rows */}
                <div className="checkout-fee-total-block">
                  <div className="checkout-line-row checkout-delivery-row">
                    <span>Delivery fee</span>
                    <span className={selectedAreaDetails ? 'checkout-delivery-val selected' : 'checkout-delivery-val unselected'}>
                      {selectedAreaDetails ? (
                        <>৳{deliveryFee.toLocaleString()} ({selectedAreaDetails.name})</>
                      ) : (
                        'Choose your area'
                      )}
                    </span>
                  </div>

                  <div className="checkout-line-row checkout-total-row">
                    <span className="checkout-total-label">Total</span>
                    <span className="checkout-total-amount">
                      ৳{grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* CHECKOUT FORM */}
              <form onSubmit={handleSubmit}>
                {/* Full Name */}
                <div className="checkout-form-field">
                  <label htmlFor="checkout-name" className="checkout-label">Full name</label>
                  <input
                    id="checkout-name"
                    type="text"
                    required
                    placeholder="e.g. Admin Lajuk"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="checkout-input-styled"
                  />
                </div>

                {/* Phone Number */}
                <div className="checkout-form-field">
                  <label htmlFor="checkout-phone" className="checkout-label">Phone number</label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    required
                    placeholder="+8801700000000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="checkout-input-styled"
                  />
                </div>

                {/* Cascading Location Hierarchy (Division | District | Area) */}
                <div className="checkout-form-field">
                  {isLoadingGeo ? (
                    <div style={{ padding: '10px', background: '#FAF8F5', borderRadius: '8px', fontSize: '0.85rem', color: '#78716C' }}>
                      Loading delivery locations...
                    </div>
                  ) : geoError ? (
                    <div style={{ padding: '10px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#991B1B', fontSize: '0.84rem' }}>
                      {geoError}
                    </div>
                  ) : (
                    <div className="checkout-geo-3col">
                      {/* Division */}
                      <div>
                        <label htmlFor="geo-division" className="checkout-label">Division</label>
                        <div className="checkout-select-box">
                          <select
                            id="geo-division"
                            value={selectedDivisionId}
                            onChange={handleDivisionChange}
                            required
                            className="checkout-select-styled"
                          >
                            <option value="">Select</option>
                            {deliveryDivisions.map((div) => (
                              <option key={div.id} value={div.id}>
                                {div.name}
                              </option>
                            ))}
                          </select>
                          <span className="checkout-select-arrow" aria-hidden="true">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                          </span>
                        </div>
                      </div>

                      {/* District */}
                      <div>
                        <label htmlFor="geo-district" className="checkout-label">District</label>
                        <div className="checkout-select-box">
                          <select
                            id="geo-district"
                            value={selectedDistrictId}
                            onChange={handleDistrictChange}
                            disabled={!selectedDivisionId}
                            required
                            className="checkout-select-styled"
                          >
                            <option value="">Select</option>
                            {availableDistricts.map((dist) => (
                              <option key={dist.id} value={dist.id}>
                                {dist.name}
                              </option>
                            ))}
                          </select>
                          <span className="checkout-select-arrow" aria-hidden="true">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                          </span>
                        </div>
                      </div>

                      {/* Area (Upazila) */}
                      <div>
                        <label htmlFor="geo-upazila" className="checkout-label">Area</label>
                        <div className="checkout-select-box">
                          <select
                            id="geo-upazila"
                            value={selectedUpazilaId}
                            onChange={handleUpazilaChange}
                            disabled={!selectedDistrictId}
                            required
                            className="checkout-select-styled"
                          >
                            <option value="">Select</option>
                            {availableUpazilas.map((upz) => (
                              <option key={upz.id} value={upz.id}>
                                {upz.name} (৳{upz.deliveryFee})
                              </option>
                            ))}
                          </select>
                          <span className="checkout-select-arrow" aria-hidden="true">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Street Address */}
                <div className="checkout-form-field">
                  <label htmlFor="checkout-address" className="checkout-label">Street address</label>
                  <textarea
                    id="checkout-address"
                    rows="2"
                    required
                    placeholder="SLFM"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="checkout-textarea-styled"
                  ></textarea>
                </div>

                {/* Payment Methods (3 tabs) */}
                <div className="checkout-payment-row">
                  <button
                    type="button"
                    className={`checkout-pay-tab ${formData.paymentMethod === 'Cash on Delivery (COD)' ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, paymentMethod: 'Cash on Delivery (COD)' })}
                  >
                    Cash on delivery
                  </button>
                  <button
                    type="button"
                    className={`checkout-pay-tab ${formData.paymentMethod === 'bKash Mobile Banking' ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, paymentMethod: 'bKash Mobile Banking' })}
                  >
                    bKash
                  </button>
                  <button
                    type="button"
                    className={`checkout-pay-tab ${formData.paymentMethod === 'Nagad Mobile Banking' ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, paymentMethod: 'Nagad Mobile Banking' })}
                  >
                    Nagad
                  </button>
                </div>

                {/* COD Advance Notice Box */}
                {isCOD && (
                  <div className="checkout-cod-banner">
                    Pay the ৳{selectedAreaDetails ? deliveryFee : 120} delivery charge in advance to confirm dispatch. We'll call{' '}
                    <strong>{formData.phone || '+8801700000000'}</strong> to help.
                  </div>
                )}

                {/* MFS Payment Instructions & TrxID Input */}
                {isMobileBanking && (() => {
                  const activeMfsNumber = isbKash ? mfsSettings.bkashNumber : mfsSettings.nagadNumber;
                  const providerName = isbKash ? 'bKash' : 'Nagad';

                  return (
                    <div className="checkout-mfs-details-card">
                      <div className="checkout-mfs-top-row">
                        <span style={{ fontWeight: 600, color: '#1C1917', fontSize: '0.88rem' }}>
                          ⚡ {providerName} Send Money
                        </span>
                        <button
                          type="button"
                          className="checkout-mfs-number-btn"
                          onClick={() => handleCopyNumber(activeMfsNumber, providerName)}
                        >
                          📋 {activeMfsNumber} (Tap to Copy)
                        </button>
                      </div>

                      <p style={{ fontSize: '0.82rem', color: '#78716C', margin: '4px 0 10px', lineHeight: 1.45 }}>
                        Send <strong>৳{grandTotal.toLocaleString()}</strong> to <strong>{activeMfsNumber}</strong>, then enter the SMS Transaction ID below:
                      </p>

                      <div className="checkout-form-field" style={{ marginBottom: 0 }}>
                        <input
                          id="trxId"
                          type="text"
                          required
                          placeholder={isbKash ? 'e.g. 9B7X2K4L1M' : 'e.g. 7A8B9C10D1'}
                          value={formData.trxId}
                          onChange={(e) => setFormData({ ...formData, trxId: e.target.value.toUpperCase() })}
                          className="checkout-input-styled"
                          style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Full-width Action Button */}
                <button type="submit" className="checkout-place-btn">
                  Place order · ৳{grandTotal.toLocaleString()}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
