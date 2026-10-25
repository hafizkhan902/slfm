import React, { useState, lazy, Suspense } from 'react';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext';
import { useCart } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Home } from './components/Home';
import { Shop } from './components/Shop';
import { ProductDetailPage } from './components/ProductDetailPage';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';

// Lazy-loaded modal components for code splitting & faster initial page load
const CheckoutModal = lazy(() => import('./components/CheckoutModal').then(m => ({ default: m.CheckoutModal })));
const AuthModal = lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));
const OrderTrackerModal = lazy(() => import('./components/OrderTrackerModal').then(m => ({ default: m.OrderTrackerModal })));
const UserProfileModal = lazy(() => import('./components/UserProfileModal').then(m => ({ default: m.UserProfileModal })));
const AdminPanelModal = lazy(() => import('./components/AdminPanelModal'));
const CustomInquiryModal = lazy(() => import('./components/CustomInquiryModal').then(m => ({ default: m.CustomInquiryModal })));

import { api } from './services/api';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Captured Error in ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center', background: '#FAFAF9', color: '#1C1917' }}>
          <h2 style={{ fontFamily: 'serif', fontSize: '1.8rem', marginBottom: '12px' }}>Something went wrong loading this view.</h2>
          <p style={{ color: '#78716C', maxWidth: '480px', marginBottom: '24px' }}>
            We encountered a minor display issue. Click below to refresh the page.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ToastContainer() {
  const { toastMessage } = useCart();
  if (!toastMessage) return null;
  return <div className="toast">{toastMessage}</div>;
}

function MainContent() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRoom, setSelectedRoom] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'catalog'

  // Log visitor session to backend MongoDB database
  React.useEffect(() => {
    let sessionId = localStorage.getItem('shahlajuk_session_id');
    if (!sessionId) {
      sessionId = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      localStorage.setItem('shahlajuk_session_id', sessionId);
    }

    const device = window.innerWidth <= 768 ? 'Mobile (iOS/Android)' : 'Desktop Browser (macOS/Chrome)';
    const section = selectedProduct
      ? `Product Details: ${selectedProduct.name}`
      : currentPage === 'catalog'
      ? 'Catalog Listing Page'
      : 'Home Showcase';

    api.logVisitorSession({
      sessionId,
      city: 'Trishal, Mymensingh',
      country: 'Bangladesh',
      ip: '103.205.71.42',
      device,
      browsedSection: section
    }).catch(err => console.warn('[Visitor log warning]', err.message));
  }, [currentPage, selectedProduct]);

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
  };

  const handleHomeClick = () => {
    setSelectedProduct(null);
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCatalog = () => {
    setSelectedProduct(null);
    setCurrentPage('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Navbar onHomeClick={handleHomeClick} onCatalogClick={handleOpenCatalog} />

      <ErrorBoundary>
        {selectedProduct ? (
          <ProductDetailPage
            product={selectedProduct}
            onBack={() => setSelectedProduct(null)}
            onSelectProduct={handleSelectProduct}
          />
        ) : currentPage === 'catalog' ? (
          <Shop
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedRoom={selectedRoom}
            setSelectedRoom={setSelectedRoom}
            onSelectProduct={handleSelectProduct}
            onBackToHome={handleHomeClick}
          />
        ) : (
          <Home
            onCatalogClick={handleOpenCatalog}
            onSelectProduct={handleSelectProduct}
            onSelectRoom={(roomId) => {
              setSelectedRoom(roomId);
              handleOpenCatalog();
            }}
            onSelectCategory={(catId) => {
              setSelectedCategory(catId);
              handleOpenCatalog();
            }}
          />
        )}
      </ErrorBoundary>

      <Footer />
      <CartDrawer />
      <Suspense fallback={null}>
        <CheckoutModal />
        <AuthModal />
        <OrderTrackerModal />
        <UserProfileModal />
        <AdminPanelModal />
        <CustomInquiryModal />
      </Suspense>
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProductProvider>
        <CartProvider>
          <MainContent />
        </CartProvider>
      </ProductProvider>
    </AuthProvider>
  );
}
