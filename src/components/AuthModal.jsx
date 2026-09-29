import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { validatePhone, validatePassword, validateEmail, validateName } from '../utils/validation';

// Custom SVG Artwork for Login (Mid-century Lounge Chair & Arch Lamp)
function LoginArtSVG() {
  return (
    <svg viewBox="0 0 320 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="auth-svg-art">
      <defs>
        <radialGradient id="lampGlow" cx="65%" cy="30%" r="55%" fx="65%" fy="30%">
          <stop offset="0%" stopColor="#F8F3E6" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#E7D8B8" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#6B4226" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="woodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8A5633" />
          <stop offset="100%" stopColor="#4A2C19" />
        </linearGradient>
        <linearGradient id="cushionGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#D5C5A8" />
          <stop offset="100%" stopColor="#B39F7F" />
        </linearGradient>
      </defs>

      {/* Background Soft Glow & Arch */}
      <circle cx="210" cy="110" r="110" fill="url(#lampGlow)" />
      <path d="M 40 260 A 130 130 0 0 1 280 260" stroke="#C9A876" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4" fill="none" />

      {/* Minimalist Arch Floor Lamp */}
      <path d="M 250 260 C 250 120 180 60 140 60" stroke="#D7D0C0" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M 125 60 L 155 60 L 165 78 L 115 78 Z" fill="#C9A876" opacity="0.9" />
      <ellipse cx="140" cy="78" rx="25" ry="6" fill="#F8F5EF" opacity="0.6" />

      {/* Wall Art Frame / Minimal Graphic in Background */}
      <rect x="50" y="45" width="45" height="60" rx="3" fill="none" stroke="#A6947B" strokeWidth="1.5" opacity="0.35" />
      <circle cx="72.5" cy="70" r="14" fill="#C9A876" opacity="0.25" />
      <line x1="50" y1="90" x2="95" y2="90" stroke="#A6947B" strokeWidth="1" opacity="0.3" />

      {/* Modernist Wooden Lounge Chair */}
      {/* Wooden Legs */}
      <line x1="95" y1="210" x2="75" y2="260" stroke="url(#woodGrad)" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="185" y1="210" x2="205" y2="260" stroke="url(#woodGrad)" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="120" y1="215" x2="105" y2="258" stroke="#4A2C19" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="165" y1="215" x2="180" y2="258" stroke="#4A2C19" strokeWidth="3.5" strokeLinecap="round" />

      {/* Main Seat Shell */}
      <path d="M 80 180 Q 90 220 135 220 L 175 220 Q 200 215 210 185 Q 215 170 195 165 C 160 160 130 170 85 168 Z" fill="url(#cushionGrad)" stroke="#8A5633" strokeWidth="1.5" />

      {/* Ergonomic Curved Backrest */}
      <path d="M 75 175 C 65 140 70 105 90 95 C 110 85 130 100 135 125 C 140 150 115 170 75 175 Z" fill="url(#cushionGrad)" stroke="#8A5633" strokeWidth="1.5" />

      {/* Wooden Back Frame Accent */}
      <path d="M 70 178 C 60 138 66 100 88 90" stroke="url(#woodGrad)" strokeWidth="4" strokeLinecap="round" fill="none" />

      {/* Side Table with Hot Beverage */}
      <rect x="220" y="215" width="45" height="5" rx="2.5" fill="#C9A876" />
      <line x1="228" y1="220" x2="225" y2="260" stroke="url(#woodGrad)" strokeWidth="3" strokeLinecap="round" />
      <line x1="257" y1="220" x2="260" y2="260" stroke="url(#woodGrad)" strokeWidth="3" strokeLinecap="round" />

      {/* Coffee Cup */}
      <rect x="236" y="200" width="12" height="15" rx="2" fill="#F8F5EF" stroke="#8A5633" strokeWidth="1" />
      <path d="M 248 204 C 252 204 252 211 248 211" stroke="#8A5633" strokeWidth="1" fill="none" />
      <path d="M 240 196 Q 242 191 240 187" stroke="#D7D0C0" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M 244 196 Q 246 192 244 188" stroke="#D7D0C0" strokeWidth="1.2" strokeLinecap="round" fill="none" />

      {/* Floor Shadow Line */}
      <ellipse cx="145" cy="261" rx="85" ry="6" fill="#1F1712" opacity="0.3" />
    </svg>
  );
}

// Custom SVG Artwork for Register (Artisanal Woodwork & Stool/Plant)
function RegisterArtSVG() {
  return (
    <svg viewBox="0 0 320 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="auth-svg-art">
      <defs>
        <radialGradient id="sunGlow" cx="50%" cy="35%" r="50%">
          <stop offset="0%" stopColor="#E7D8B8" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#4A2C19" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="oakGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C9A876" />
          <stop offset="100%" stopColor="#8A5633" />
        </linearGradient>
      </defs>

      {/* Sun / Arch Background motif */}
      <circle cx="160" cy="130" r="95" fill="url(#sunGlow)" />
      <path d="M 60 250 A 100 100 0 0 1 260 250" stroke="#C9A876" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" fill="none" />

      {/* Craft Blueprint Circles */}
      <circle cx="160" cy="130" r="70" stroke="#E7D8B8" strokeWidth="1" strokeDasharray="2 4" fill="none" opacity="0.6" />

      {/* Sculptural Wooden Armchair with Finger Joinery */}
      {/* Legs */}
      <line x1="100" y1="200" x2="85" y2="260" stroke="#4A2C19" strokeWidth="4" strokeLinecap="round" />
      <line x1="220" y1="200" x2="235" y2="260" stroke="#4A2C19" strokeWidth="4" strokeLinecap="round" />
      <line x1="135" y1="205" x2="125" y2="258" stroke="url(#oakGrad)" strokeWidth="3" strokeLinecap="round" />
      <line x1="185" y1="205" x2="195" y2="258" stroke="url(#oakGrad)" strokeWidth="3" strokeLinecap="round" />

      {/* Woven / Solid Wood Seat */}
      <rect x="90" y="185" width="140" height="20" rx="4" fill="url(#oakGrad)" stroke="#4A2C19" strokeWidth="1.5" />

      {/* Curved Wooden Backrest Rail */}
      <path d="M 85 125 C 85 100 115 90 160 90 C 205 90 235 100 235 125 L 230 185 L 90 185 Z" fill="#F8F5EF" stroke="#4A2C19" strokeWidth="2" opacity="0.95" />

      {/* Vertical Spindles */}
      <line x1="115" y1="102" x2="115" y2="185" stroke="#8A5633" strokeWidth="2" />
      <line x1="137" y1="94" x2="137" y2="185" stroke="#8A5633" strokeWidth="2" />
      <line x1="160" y1="92" x2="160" y2="185" stroke="#8A5633" strokeWidth="2.5" />
      <line x1="183" y1="94" x2="183" y2="185" stroke="#8A5633" strokeWidth="2" />
      <line x1="205" y1="102" x2="205" y2="185" stroke="#8A5633" strokeWidth="2" />

      {/* Wooden Top Crown Frame */}
      <path d="M 80 125 C 80 95 115 85 160 85 C 205 85 240 95 240 125" stroke="#4A2C19" strokeWidth="4.5" strokeLinecap="round" fill="none" />

      {/* Potted Indoor Monstera Leaf Accent */}
      <path d="M 50 260 L 55 225 L 75 225 L 80 260 Z" fill="#8A5633" />
      <path d="M 65 225 C 50 190 35 180 25 185 C 20 195 40 210 65 220" fill="#5C6B54" opacity="0.9" />
      <path d="M 65 225 C 60 175 60 155 45 150 C 40 165 50 195 65 222" fill="#5C6B54" />
      <path d="M 65 225 C 75 185 85 170 95 175 C 95 190 80 210 65 225" fill="#5C6B54" opacity="0.8" />

      {/* Floor Shadow */}
      <ellipse cx="160" cy="261" rx="90" ry="6" fill="#1F1712" opacity="0.3" />
    </svg>
  );
}

export function AuthModal() {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalTab,
    setAuthModalTab,
    login,
    register
  } = useAuth();
  const { showToast, cartItems, setIsCheckoutOpen } = useCart();

  const [formData, setFormData] = useState({
    name: '',
    emailOrPhone: '',
    email: '',
    phone: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setErrorMsg('');
    setIsAuthModalOpen(false);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const res = await login(formData.emailOrPhone, formData.password);
    if (res && res.success) {
      showToast(res.message);
      if (cartItems && cartItems.length > 0) {
        setIsCheckoutOpen(true);
      }
    } else {
      setErrorMsg(res?.message || 'Invalid email/phone or password');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const nameVal = validateName(formData.name);
    if (!nameVal.isValid) {
      setErrorMsg(nameVal.error);
      return;
    }

    const emailVal = validateEmail(formData.email);
    if (!emailVal.isValid) {
      setErrorMsg(emailVal.error);
      return;
    }

    const phoneVal = validatePhone(formData.phone);
    if (!phoneVal.isValid) {
      setErrorMsg(phoneVal.error);
      return;
    }

    const passVal = validatePassword(formData.password);
    if (!passVal.isValid) {
      setErrorMsg(passVal.error);
      return;
    }

    const res = await register(formData.name, formData.email, phoneVal.cleanPhone, formData.password);
    if (res && res.success) {
      showToast(res.message);
      if (cartItems && cartItems.length > 0) {
        setIsCheckoutOpen(true);
      }
    } else {
      setErrorMsg(res?.message || 'Registration failed');
    }
  };

  const fillDemoUser = () => {
    setAuthModalTab('login');
    setFormData((prev) => ({
      ...prev,
      emailOrPhone: 'tanvir@gmail.com',
      password: 'password123'
    }));
  };

  const fillDemoAdmin = () => {
    setAuthModalTab('login');
    setFormData((prev) => ({
      ...prev,
      emailOrPhone: 'admin@shahlajuk.com',
      password: 'adminpassword'
    }));
  };

  return (
    <div className="modal-backdrop open" onClick={handleClose}>
      <div className="auth-modal-wrapper" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          type="button"
          className="auth-modal-close"
          onClick={handleClose}
          aria-label="Close modal"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="auth-split-container">
          {/* Left Sideground: Minimal SVG Art Panel */}
          <div className="auth-art-sideground">
            <div className="auth-art-header">
              <span className="auth-brand-badge">SHAHLAJUK MART</span>
              <h3 className="auth-art-tagline">
                {authModalTab === 'login' ? 'Timeless Craftsmanship' : 'Artisanal Furniture'}
              </h3>
            </div>

            <div className="auth-art-illustration">
              {authModalTab === 'login' ? <LoginArtSVG /> : <RegisterArtSVG />}
            </div>

            <div className="auth-art-footer">
              <p className="auth-quote">
                {authModalTab === 'login'
                  ? '"Furniture designed for life, crafted with organic passion."'
                  : '"Join our community of artisanal living & custom timber designs."'
                }
              </p>
              <div className="auth-art-dots">
                <span className={`art-dot ${authModalTab === 'login' ? 'active' : ''}`} onClick={() => setAuthModalTab('login')} />
                <span className={`art-dot ${authModalTab === 'register' ? 'active' : ''}`} onClick={() => setAuthModalTab('register')} />
              </div>
            </div>
          </div>

          {/* Right Panel: Form Content */}
          <div className="auth-form-side">
            <div className="auth-form-header">
              <h2 className="auth-form-title">
                {authModalTab === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="auth-form-sub">
                {authModalTab === 'login'
                  ? 'Sign in to access your furniture orders & saved addresses.'
                  : 'Register today for real-time order tracking and member perks.'
                }
              </p>
            </div>

            {/* Pill Tab Switcher */}
            <div className="auth-tab-pill-bar">
              <button
                type="button"
                className={`auth-tab-pill ${authModalTab === 'login' ? 'active' : ''}`}
                onClick={() => {
                  setErrorMsg('');
                  setAuthModalTab('login');
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-tab-pill ${authModalTab === 'register' ? 'active' : ''}`}
                onClick={() => {
                  setErrorMsg('');
                  setAuthModalTab('register');
                }}
              >
                Register
              </button>
            </div>

            {errorMsg && (
              <div className="auth-error-alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            {authModalTab === 'login' ? (
              <form className="auth-form" onSubmit={handleLoginSubmit}>
                <div className="form-group">
                  <label htmlFor="login-id">Email Address or Phone</label>
                  <div className="input-icon-wrapper">
                    <span className="input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                    <input
                      id="login-id"
                      type="text"
                      required
                      placeholder="tanvir@gmail.com or +88017..."
                      value={formData.emailOrPhone}
                      onChange={(e) => setFormData({ ...formData, emailOrPhone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="login-password">Password</label>
                  <div className="input-icon-wrapper">
                    <span className="input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button type="submit" className="auth-submit-btn">
                  Sign In
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>

                <div className="auth-demo-divider">
                  <span>Fast Demo Access</span>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn-demo-pill"
                    onClick={fillDemoUser}
                    style={{ flex: '1 1 calc(50% - 4px)', padding: '8px 10px', fontSize: '0.8rem' }}
                  >
                    <span className="demo-spark"></span> User Demo
                  </button>
                  <button
                    type="button"
                    className="btn-demo-pill"
                    onClick={fillDemoAdmin}
                    style={{ flex: '1 1 calc(50% - 4px)', padding: '8px 10px', fontSize: '0.8rem', borderColor: 'var(--walnut)', color: 'var(--walnut)', fontWeight: 600 }}
                  >
                    <span className="demo-spark"></span> Admin Demo
                  </button>
                </div>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleRegisterSubmit}>
                <div className="form-group">
                  <label htmlFor="reg-name">Full Name *</label>
                  <div className="input-icon-wrapper">
                    <span className="input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      id="reg-name"
                      type="text"
                      required
                      placeholder="e.g. Tanvir Hasan"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="reg-email">Email Address *</label>
                  <div className="input-icon-wrapper">
                    <span className="input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                    <input
                      id="reg-email"
                      type="email"
                      required
                      placeholder="e.g. tanvir@gmail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="reg-phone">Phone Number *</label>
                  <div className="input-icon-wrapper">
                    <span className="input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </span>
                    <input
                      id="reg-phone"
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

                <div className="form-group">
                  <label htmlFor="reg-password">Create Password *</label>
                  <div className="input-icon-wrapper">
                    <span className="input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Minimum 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#777', marginTop: '4px', display: 'block' }}>
                     Min 6 chars (must contain letters & numbers)
                  </span>
                </div>

                <button type="submit" className="auth-submit-btn">
                  Create Account
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
