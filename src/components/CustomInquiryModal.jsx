import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const PRODUCT_TYPES = [
  'Dining Table',
  'Dining Chairs (Set)',
  'Bed Frame / Palong',
  'Wardrobe / Almirah',
  'Living Sofa / Seating',
  'Coffee Table / Center Table',
  'Executive Office Desk',
  'Bookshelf / Display Rack',
  'TV Console / Credenza',
  'Dressing Table',
  'Custom Architectural Unit'
];

export function CustomInquiryModal() {
  const { isCustomInquiryOpen, setIsCustomInquiryOpen, showToast } = useCart();
  const { currentUser } = useAuth();
  const fileInputRef = useRef(null);

  // Form State
  const [productType, setProductType] = useState('Dining Table');
  const [customProductTypeName, setCustomProductTypeName] = useState('');
  const [dimensions, setDimensions] = useState({
    height: '30',
    width: '72',
    depth: '36',
    unit: 'inch' // 'inch' | 'cm'
  });
  const [description, setDescription] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Files State
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);

  // Submission & UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedData, setSubmittedData] = useState(null);

  // Auto-populate user contact info if available
  useEffect(() => {
    if (currentUser) {
      if (currentUser.name && !customerName) setCustomerName(currentUser.name);
      if (currentUser.phone && !phone) setPhone(currentUser.phone);
      if (currentUser.email && !email) setEmail(currentUser.email);
    }
  }, [currentUser, isCustomInquiryOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCustomInquiryOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCustomInquiryOpen]);

  // Lock background scroll when open
  useEffect(() => {
    if (isCustomInquiryOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCustomInquiryOpen]);

  // Cleanup object URLs when component unmounts or previews change
  useEffect(() => {
    return () => {
      filePreviews.forEach(p => URL.revokeObjectURL(p.url));
    };
  }, [filePreviews]);

  const handleClose = () => {
    setIsCustomInquiryOpen(false);
    setErrorMessage('');
  };

  const handleResetForm = () => {
    setSubmittedData(null);
    setProductType('Dining Table');
    setCustomProductTypeName('');
    setDimensions({ height: '30', width: '72', depth: '36', unit: 'inch' });
    setDescription('');
    setSelectedFiles([]);
    setFilePreviews([]);
    setErrorMessage('');
  };


  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setErrorMessage('');
    const availableSlots = 5 - selectedFiles.length;
    if (availableSlots <= 0) {
      setErrorMessage('Maximum 5 reference photos allowed.');
      return;
    }

    const validNewFiles = [];
    const newPreviews = [];

    for (const file of files.slice(0, availableSlots)) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage(`"${file.name}" is not an image. Only JPG, PNG, and WebP are supported.`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage(`"${file.name}" exceeds the 10MB limit.`);
        continue;
      }
      validNewFiles.push(file);
      newPreviews.push({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        url: URL.createObjectURL(file)
      });
    }

    setSelectedFiles((prev) => [...prev, ...validNewFiles]);
    setFilePreviews((prev) => [...prev, ...newPreviews]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    // Revoke URL to prevent memory leak
    if (filePreviews[indexToRemove]?.url) {
      URL.revokeObjectURL(filePreviews[indexToRemove].url);
    }
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setFilePreviews((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const finalProductType = productType === 'Custom Architectural Unit'
      ? (customProductTypeName.trim() || 'Custom Architectural Furniture')
      : productType;

    const h = parseFloat(dimensions.height);
    const w = parseFloat(dimensions.width);
    const d = parseFloat(dimensions.depth);

    if (!finalProductType) {
      setErrorMessage('Please specify the furniture product type.');
      return;
    }

    if (isNaN(h) || h <= 0 || isNaN(w) || w <= 0 || isNaN(d) || d <= 0) {
      setErrorMessage('Please provide valid positive numbers for Height, Width, and Depth.');
      return;
    }

    if (!phone.trim()) {
      setErrorMessage('Please enter your phone number so our craftsman team can contact you.');
      return;
    }

    if (description.length > 1000) {
      setErrorMessage('Description exceeds 1000 characters limit.');
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append('productType', finalProductType);
      formData.append('customerName', customerName.trim());
      formData.append('phone', phone.trim());
      formData.append('email', email.trim());

      // Send structured JSON strings alongside multipart data
      formData.append(
        'dimensions',
        JSON.stringify({
          height: h,
          width: w,
          depth: d,
          unit: dimensions.unit
        })
      );

      formData.append(
        'customDetails',
        JSON.stringify({
          description: description.trim()
        })
      );


      // Append up to 5 reference image files
      selectedFiles.forEach((file) => {
        formData.append('referenceImages', file);
      });

      const res = await api.createCustomInquiry(formData);

      if (res && res.success) {
        setSubmittedData({
          inquiry: res.inquiry,
          message: res.message
        });
        if (showToast) {
          showToast('Custom inquiry submitted successfully!');
        }
      } else {
        throw new Error(res?.error || 'Failed to submit inquiry');
      }
    } catch (err) {
      console.error('Inquiry submission error:', err);
      setErrorMessage(err.message || 'Submission failed. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isCustomInquiryOpen) return null;

  return (
    <div className="custom-inquiry-modal-overlay" onClick={handleClose}>
      <div
        className="custom-inquiry-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="custom-inquiry-title"
      >
        {/* Header Bar */}
        <div className="custom-inquiry-header">
          <div className="header-meta">
            <span className="inquiry-kicker">BESPOKE WORKSHOP · TRISHAL</span>
            <h2 id="custom-inquiry-title" className="inquiry-title">
              Custom Furniture Commission
            </h2>
          </div>
          <button
            type="button"
            className="inquiry-close-btn"
            onClick={handleClose}
            aria-label="Close dialog"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Confirmation State */}
        {submittedData ? (
          <div className="inquiry-success-view">
            <div className="success-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>

            <h3 className="success-heading">Request Received</h3>

            {/* Exact Required Confirmation String */}
            <p className="success-notice-text">
              Inquiry submitted successfully! Our team will review your specifications and contact you shortly with a quote and confirmation.
            </p>

            <div className="success-summary-card">
              <div className="summary-row">
                <span className="summary-label">Product Type:</span>
                <span className="summary-val">{submittedData.inquiry?.productType}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Dimensions:</span>
                <span className="summary-val">
                  {submittedData.inquiry?.dimensions?.height} (H) × {submittedData.inquiry?.dimensions?.width} (W) × {submittedData.inquiry?.dimensions?.depth} (D) {submittedData.inquiry?.dimensions?.unit}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Reference Photos:</span>
                <span className="summary-val">
                  {submittedData.inquiry?.customDetails?.referenceImages?.length || 0} photo(s) attached
                </span>
              </div>

              <div className="summary-row">
                <span className="summary-label">Contact Phone:</span>
                <span className="summary-val">{submittedData.inquiry?.phone || phone}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Inquiry Status:</span>
                <span className="summary-badge pending">
                  {submittedData.inquiry?.status || 'Pending Review'}
                </span>
              </div>
            </div>

            <div className="success-actions">
              <button
                type="button"
                className="btn-editorial-primary"
                onClick={handleClose}
              >
                Back to Collection
              </button>
              <button
                type="button"
                className="btn-editorial-ghost"
                onClick={handleResetForm}
              >
                Submit Another Custom Build
              </button>
            </div>
          </div>
        ) : (
          /* Form Content */
          <form className="inquiry-form-body" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="inquiry-error-banner" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* BLOCK 1: PIECE & DIMENSIONS */}
            <div className="inquiry-card-block">
              <div className="inquiry-card-header">
                <span className="inquiry-card-title">Piece & Dimensions</span>
              </div>

              {/* Product Type Selector */}
              <div className="product-type-selector-wrap">
                <div className="select-row-wrap">
                  <label htmlFor="product-type-select" className="input-sublabel">
                    Piece Type
                  </label>
                  <select
                    id="product-type-select"
                    className="editorial-select"
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                  >
                    {PRODUCT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Popular Quick Chips */}
                <div className="product-type-quick-chips">
                  {['Dining Table', 'Bed Frame / Palong', 'Living Sofa / Seating', 'Wardrobe / Almirah', 'Executive Office Desk', 'Custom Architectural Unit'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`quick-chip-btn ${productType === type ? 'active' : ''}`}
                      onClick={() => setProductType(type)}
                    >
                      {type === 'Custom Architectural Unit' ? '+ Custom Unit' : type.split('/')[0].trim()}
                    </button>
                  ))}
                </div>

                {productType === 'Custom Architectural Unit' && (
                  <div className="custom-type-input-wrap">
                    <input
                      type="text"
                      className="editorial-input"
                      placeholder="Specify piece name (e.g. Fluted Kitchen Island, Modular Divider)"
                      value={customProductTypeName}
                      onChange={(e) => setCustomProductTypeName(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>

              {/* Inline Dimensions Bar */}
              <div className="dimensions-grid-inline">
                <div className="input-group">
                  <label htmlFor="dim-height" className="input-sublabel">Height</label>
                  <div className="input-with-suffix">
                    <input
                      id="dim-height"
                      type="number"
                      step="0.1"
                      min="0.1"
                      className="editorial-input"
                      placeholder="30"
                      value={dimensions.height}
                      onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                      required
                    />
                    <span className="input-suffix">{dimensions.unit}</span>
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="dim-width" className="input-sublabel">Width</label>
                  <div className="input-with-suffix">
                    <input
                      id="dim-width"
                      type="number"
                      step="0.1"
                      min="0.1"
                      className="editorial-input"
                      placeholder="72"
                      value={dimensions.width}
                      onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                      required
                    />
                    <span className="input-suffix">{dimensions.unit}</span>
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="dim-depth" className="input-sublabel">Depth</label>
                  <div className="input-with-suffix">
                    <input
                      id="dim-depth"
                      type="number"
                      step="0.1"
                      min="0.1"
                      className="editorial-input"
                      placeholder="36"
                      value={dimensions.depth}
                      onChange={(e) => setDimensions({ ...dimensions, depth: e.target.value })}
                      required
                    />
                    <span className="input-suffix">{dimensions.unit}</span>
                  </div>
                </div>

                <div className="input-group unit-group-col">
                  <label className="input-sublabel">Unit</label>
                  <div className="unit-toggle-pill" role="radiogroup" aria-label="Dimension Unit">
                    <button
                      type="button"
                      className={`unit-toggle-btn ${dimensions.unit === 'inch' ? 'active' : ''}`}
                      onClick={() => setDimensions({ ...dimensions, unit: 'inch' })}
                    >
                      Inches (")
                    </button>
                    <button
                      type="button"
                      className={`unit-toggle-btn ${dimensions.unit === 'cm' ? 'active' : ''}`}
                      onClick={() => setDimensions({ ...dimensions, unit: 'cm' })}
                    >
                      cm
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* BLOCK 2: REFERENCE PHOTOS & INSTRUCTIONS */}
            <div className="inquiry-card-block">
              <div className="inquiry-card-header">
                <span className="inquiry-card-title">Inspiration Photos & Details</span>
                <span className={`file-count-badge ${selectedFiles.length === 5 ? 'max' : ''}`}>
                  {selectedFiles.length} / 5 photos attached
                </span>
              </div>

              {/* Compact Dropzone */}
              <div
                className={`compact-dropzone ${selectedFiles.length >= 5 ? 'disabled' : ''}`}
                onClick={() => {
                  if (selectedFiles.length < 5 && fileInputRef.current) {
                    fileInputRef.current.click();
                  }
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  disabled={selectedFiles.length >= 5}
                />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <div className="compact-dropzone-text">
                  <strong>Click to upload reference photos</strong> or sketches (JPG, PNG, WebP · max 5)
                </div>
              </div>

              {/* Thumbnail Gallery Strip */}
              {filePreviews.length > 0 && (
                <div className="thumbnail-gallery-strip">
                  {filePreviews.map((preview, idx) => (
                    <div key={idx} className="preview-thumb-card">
                      <img src={preview.url} alt={`Upload preview ${idx + 1}`} className="preview-thumb-img" />
                      <div className="preview-thumb-meta">
                        <span className="thumb-size">{preview.size}</span>
                      </div>
                      <button
                        type="button"
                        className="thumb-remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(idx);
                        }}
                        title="Remove photo"
                        aria-label={`Remove photo ${idx + 1}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Compact Notes Textarea */}
              <div className="notes-field-wrap">
                <div className="notes-sublabel-row">
                  <label htmlFor="inquiry-notes" className="input-sublabel">
                    Special Instructions & Specifications
                  </label>
                  <span className={`char-counter-badge ${description.length >= 950 ? 'near-limit' : ''}`}>
                    {description.length} / 1000
                  </span>
                </div>
                <textarea
                  id="inquiry-notes"
                  className="editorial-textarea compact"
                  rows="3"
                  maxLength="1000"
                  placeholder="Wood preference, joinery details, room doorway constraints, or delivery timeline..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* BLOCK 3: CONTACT FOR CONSULTATION */}
            <div className="inquiry-card-block">
              <div className="inquiry-card-header">
                <span className="inquiry-card-title">Consultation Contact</span>
                <span className="card-badge-muted">No commitment required</span>
              </div>

              <div className="contact-grid-inline">
                <div className="input-group">
                  <label htmlFor="inquiry-name" className="input-sublabel">Full Name</label>
                  <input
                    id="inquiry-name"
                    type="text"
                    className="editorial-input"
                    placeholder="Your name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="inquiry-phone" className="input-sublabel">Phone Number *</label>
                  <input
                    id="inquiry-phone"
                    type="tel"
                    className="editorial-input"
                    placeholder="017XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="inquiry-email" className="input-sublabel">Email (Optional)</label>
                  <input
                    id="inquiry-email"
                    type="email"
                    className="editorial-input"
                    placeholder="name@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="inquiry-modal-footer">
              <div className="footer-reassurance">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <span>Workshop direct · No payment required today</span>
              </div>

              <div className="footer-buttons">
                <button
                  type="button"
                  className="btn-editorial-ghost"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-editorial-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-dot"></span>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Commission Request</span>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default CustomInquiryModal;
