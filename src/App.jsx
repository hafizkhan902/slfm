import React, { useState, lazy, Suspense } from 'react';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext';
import { useCart } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Ticker } from './components/Ticker';
import { PromoBannerSection } from './components/PromoBannerSection';
import { ShopAll } from './components/ShopAll';
import { ShopByRoom } from './components/ShopByRoom';
import { MaterialSection } from './components/MaterialSection';
import { FeaturedProducts } from './components/FeaturedProducts';
import { ProductDetailPage } from './components/ProductDetailPage';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';

// Lazy-loaded modal components for code splitting & faster initial page load
const CheckoutModal = lazy(() => import('./components/CheckoutModal').then(m => ({ default: m.CheckoutModal })));
const AuthModal = lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));
const OrderTrackerModal = lazy(() => import('./components/OrderTrackerModal').then(m => ({ default: m.OrderTrackerModal })));
const UserProfileModal = lazy(() => import('./components/UserProfileModal').then(m => ({ default: m.UserProfileModal })));
const AdminPanelModal = lazy(() => import('./components/AdminPanelModal'));

import { api } from './services/api';

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

      {selectedProduct ? (
        <ProductDetailPage
          product={selectedProduct}
          onBack={() => setSelectedProduct(null)}
          onSelectProduct={handleSelectProduct}
        />
      ) : currentPage === 'catalog' ? (
        <ShopAll
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedRoom={selectedRoom}
          setSelectedRoom={setSelectedRoom}
          onSelectProduct={handleSelectProduct}
          isFullPage={true}
          onBackToHome={handleHomeClick}
        />
      ) : (
        <>
          <Hero />
          <Ticker />
          <ShopAll
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedRoom={selectedRoom}
            setSelectedRoom={setSelectedRoom}
            onSelectProduct={handleSelectProduct}
            isFullPage={false}
            onOpenFullCatalog={handleOpenCatalog}
          />
          <PromoBannerSection />
          <ShopByRoom
            selectedRoom={selectedRoom}
            setSelectedRoom={setSelectedRoom}
          />
          <MaterialSection />
          <FeaturedProducts onSelectProduct={handleSelectProduct} />
        </>
      )}

      <Footer />
      <CartDrawer />
      <Suspense fallback={null}>
        <CheckoutModal />
        <AuthModal />
        <OrderTrackerModal />
        <UserProfileModal />
        <AdminPanelModal />
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
