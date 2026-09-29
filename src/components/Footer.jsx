import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export function Footer() {
  const [footerData, setFooterData] = useState({
    storeAddress: 'Porabari Road CNG Station, Trishal, Mymensingh',
    storePhone: '+880 1700-000000',
    storeEmail: 'info@shahlajuk.com',
    openingHours: 'Open daily, 10am–8pm',
    facebookUrl: 'https://facebook.com',
    instagramUrl: 'https://instagram.com',
    whatsappNumber: '8801700000000',
    youtubeUrl: ''
  });

  const fetchFooterSettings = async () => {
    try {
      const data = await api.getSettings();
      if (data) {
        setFooterData({
          storeAddress: data.storeAddress || 'Porabari Road CNG Station, Trishal, Mymensingh',
          storePhone: data.storePhone || '+880 1700-000000',
          storeEmail: data.storeEmail || 'info@shahlajuk.com',
          openingHours: data.openingHours || 'Open daily, 10am–8pm',
          facebookUrl: data.facebookUrl || 'https://facebook.com',
          instagramUrl: data.instagramUrl || 'https://instagram.com',
          whatsappNumber: data.whatsappNumber || '8801700000000',
          youtubeUrl: data.youtubeUrl || ''
        });
      }
    } catch (err) {
      console.warn('[Footer] Failed to fetch footer settings:', err.message);
    }
  };

  useEffect(() => {
    fetchFooterSettings();

    const handleSettingsUpdate = () => {
      fetchFooterSettings();
    };

    window.addEventListener('shahlajuk_settings_updated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('shahlajuk_settings_updated', handleSettingsUpdate);
    };
  }, []);

  const cleanWhatsapp = (footerData.whatsappNumber || '').replace(/[^0-9]/g, '');
  const cleanPhone = (footerData.storePhone || '').replace(/[^0-9+]/g, '');

  return (
    <footer id="visit">
      <div className="wrap">
        <div className="footer-top">
          <div className="footer-brand">
            <a href="#top" className="brand-logo-link" style={{ marginBottom: '14px', display: 'inline-block' }}>
              <img src="/logo.png" alt="ShahLajuk Furniture Mart - SLFM" className="footer-logo-img" />
            </a>
            <p>
              Furniture made from melamine-faced board, built room by room for everyday homes.
            </p>
          </div>

          <div className="footer-cols">
            <div className="footer-col">
              <h4>Shop</h4>
              <ul>
                <li><a href="#rooms">Reading Room</a></li>
                <li><a href="#rooms">Dining Room</a></li>
                <li><a href="#rooms">Bedroom</a></li>
                <li><a href="#rooms">Decoration</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Visit Us</h4>
              <ul>
                <li style={{ fontWeight: 600, color: 'var(--ink)' }}>Main Showroom Address:</li>
                <li style={{ color: 'var(--ink-soft)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                  {footerData.storeAddress}
                </li>
                {footerData.openingHours && (
                  <li style={{ marginTop: '6px', color: 'var(--ink-soft)', fontWeight: 500 }}>
                     {footerData.openingHours}
                  </li>
                )}
                {footerData.storePhone && (
                  <li style={{ marginTop: '4px' }}>
                    <a href={`tel:${cleanPhone}`} style={{ fontWeight: 500, color: 'var(--walnut)' }}>
                       {footerData.storePhone}
                    </a>
                  </li>
                )}
                {footerData.storeEmail && (
                  <li style={{ marginTop: '4px' }}>
                    <a href={`mailto:${footerData.storeEmail}`} style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
                      ️ {footerData.storeEmail}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} ShahLajuk Furniture Mart (SLFM). All rights reserved.</span>
          <div className="footer-social-links">
            {footerData.facebookUrl && (
              <>
                <a
                  href={footerData.facebookUrl.startsWith('http') ? footerData.facebookUrl : `https://${footerData.facebookUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                >
                  Facebook
                </a>
              </>
            )}

            {footerData.instagramUrl && (
              <>
                {footerData.facebookUrl && <span className="social-sep">·</span>}
                <a
                  href={footerData.instagramUrl.startsWith('http') ? footerData.instagramUrl : `https://${footerData.instagramUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                >
                  Instagram
                </a>
              </>
            )}

            {cleanWhatsapp && (
              <>
                {(footerData.facebookUrl || footerData.instagramUrl) && <span className="social-sep">·</span>}
                <a
                  href={`https://wa.me/${cleanWhatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link whatsapp-link"
                >
                  WhatsApp
                </a>
              </>
            )}

            {footerData.youtubeUrl && (
              <>
                {(footerData.facebookUrl || footerData.instagramUrl || cleanWhatsapp) && <span className="social-sep">·</span>}
                <a
                  href={footerData.youtubeUrl.startsWith('http') ? footerData.youtubeUrl : `https://${footerData.youtubeUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                >
                  YouTube
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
