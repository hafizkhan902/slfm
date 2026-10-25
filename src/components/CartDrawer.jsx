import React from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ProductIcon } from './ProductIcon';

export function CartDrawer() {
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    subtotal,
    setIsCheckoutOpen,
    showToast
  } = useCart();

  const { currentUser, setAuthModalTab, setIsAuthModalOpen } = useAuth();

  const handleCheckoutClick = () => {
    setIsCartOpen(false);
    if (!currentUser) {
      if (showToast) showToast('Please sign in to your account to proceed with checkout.');
      setAuthModalTab('login');
      setIsAuthModalOpen(true);
      return;
    }
    setIsCheckoutOpen(true);
  };

  return (
    <div
      className={`drawer-backdrop ${isCartOpen ? 'open' : ''}`}
      onClick={() => setIsCartOpen(false)}
    >
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <h3>Your Cart ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})</h3>
          <button
            type="button"
            className="close-btn"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close cart drawer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="cart-body">
          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                style={{ margin: '0 auto 12px', color: 'var(--oak)' }}
              >
                <circle cx="9" cy="20" r="1.4" />
                <circle cx="18" cy="20" r="1.4" />
                <path d="M2 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 7H5.2" />
              </svg>
              <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem' }}>
                Your cart is currently empty.
              </p>
              <p style={{ fontSize: '0.88rem', marginTop: '6px' }}>
                Explore our melamine furniture collection and add items to your cart.
              </p>
            </div>
          ) : (
            cartItems.map(({ product, quantity }) => (
              <div className="cart-item" key={product.id}>
                <div className="cart-item-thumb">
                  <ProductIcon type={product.iconType} image={product.image} alt={product.name} />
                </div>
                <div className="cart-item-info">
                  <div className="cart-item-title">{product.name}</div>
                  <div className="cart-item-price">৳{product.price.toLocaleString()}</div>
                  <div className="qty-controls">
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => updateQuantity(product.id, -1)}
                    >
                      -
                    </button>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{quantity}</span>
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => updateQuantity(product.id, 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  className="cart-remove-item-btn"
                  onClick={() => removeFromCart(product.id)}
                  title="Remove item"
                  aria-label={`Remove ${product.name} from cart`}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="drawer-foot">
            <div className="cart-total-row">
              <span>Subtotal:</span>
              <span>৳{subtotal.toLocaleString()}</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
              Taxes and delivery shipping calculated at final checkout.
            </p>
            <button
              type="button"
              className="cart-checkout-btn"
              onClick={handleCheckoutClick}
            >
              <span>Proceed to Checkout</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
