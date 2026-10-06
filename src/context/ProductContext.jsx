import React, { createContext, useContext, useState, useEffect } from 'react';
import { products as initialProducts, categoriesList, roomsList } from '../data/products';
import { api } from '../services/api';

const DEFAULT_PROMO_BANNERS = [
  {
    id: 'promo-festive-sale',
    badge: ' FESTIVE SALE — LIMITED TIME',
    title: 'Artisanal Chittagong Teak & Living Room Sets',
    subtitle: 'Up to 25% Off on handcrafted solid teak sofa sets, coffee tables & dining. Free white-glove delivery across Trishal, Mymensingh.',
    discountPill: '25% OFF',
    buttonText: 'Explore Festival Deals',
    linkAnchor: '#shop',
    theme: 'walnut-gold',
    artType: 'living-set',
    layoutDirection: 'normal'
  },
  {
    id: 'promo-custom-interior',
    badge: ' BESPOKE INTERIOR SERVICE',
    title: 'Custom Modular Wardrobes & Architectural Joinery',
    subtitle: 'Designed to fit your exact home dimensions by master artisans at ShahLajuk Furniture Mart.',
    discountPill: 'FREE CONSULTATION',
    buttonText: 'Book Free Interior Visit',
    linkAnchor: '#visit',
    theme: 'sage-timber',
    artType: 'interior-joinery',
    layoutDirection: 'reverse'
  }
];

const ProductContext = createContext();

export function ProductProvider({ children }) {
  // 1. Dynamic Products State & Loading Status
  const [productsList, setProductsList] = useState(() => {
    try {
      const stored = localStorage.getItem('shahlajuk_products');
      return stored ? JSON.parse(stored) : initialProducts;
    } catch {
      return initialProducts;
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  // 2. Dynamic Promotional Banners State
  const [promosList, setPromosList] = useState(() => {
    try {
      const stored = localStorage.getItem('shahlajuk_promos');
      return stored ? JSON.parse(stored) : DEFAULT_PROMO_BANNERS;
    } catch {
      return DEFAULT_PROMO_BANNERS;
    }
  });

  // Admin Panel Modal Control State
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  // Sync products and promos with MongoDB Database on mount
  useEffect(() => {
    let isMounted = true;

    const fetchCatalogFromDB = async () => {
      try {
        const prodRes = await api.getProducts();
        if (isMounted && prodRes && Array.isArray(prodRes.products)) {
          if (prodRes.products.length > 0) {
            const formattedProds = prodRes.products.map(p => ({
              id: p.productId || p._id || p.id,
              mongoId: p._id,
              name: p.name,
              category: p.category,
              categoryName: categoriesList.find(c => c.id === p.category)?.name || p.category,
              room: p.room,
              roomName: roomsList.find(r => r.id === p.room)?.name || p.room,
              price: p.price,
              originalPrice: p.originalPrice || null,
              badge: p.badge || null,
              bg: p.bg || 'var(--surface)',
              iconType: p.iconType || 'table',
              image: p.image || '',
              image2: p.image2 || '',
              image3: p.image3 || '',
              image4: p.image4 || '',
              images: Array.isArray(p.images) && p.images.length > 0
                ? p.images
                : [p.image, p.image2, p.image3, p.image4].filter(Boolean),
              description: p.description,
              specs: p.specs || {
                dimensions: '3ft x 2ft x 2.5ft',
                material: 'Melamine-faced board',
                warranty: '2 Years Warranty',
                finish: 'Natural Woodgrain Finish'
              }
            }));
            setProductsList(formattedProds);
          }
        }
      } catch (err) {
        console.warn('[ProductContext] Backend products fetch fallback:', err.message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }

      try {
        const promoRes = await api.getPromos();
        if (isMounted && promoRes && Array.isArray(promoRes.promos) && promoRes.promos.length > 0) {
          const formattedPromos = promoRes.promos.map(p => ({
            id: p.promoId || p._id || p.id,
            mongoId: p._id,
            badge: p.badge,
            title: p.title,
            subtitle: p.subtitle,
            discountPill: p.discountPill,
            buttonText: p.buttonText,
            linkAnchor: p.linkAnchor || '#shop',
            theme: p.theme || 'walnut-gold',
            artType: p.artType || 'living-set',
            layoutDirection: p.layoutDirection || 'normal'
          }));
          setPromosList(formattedPromos);
        }
      } catch (err) {
        console.warn('[ProductContext] Backend promos fetch fallback:', err.message);
      }
    };

    fetchCatalogFromDB();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('shahlajuk_products', JSON.stringify(productsList));
    } catch (err) {
      console.error('Failed to save products to localStorage', err);
    }
  }, [productsList]);

  useEffect(() => {
    try {
      localStorage.setItem('shahlajuk_promos', JSON.stringify(promosList));
    } catch (err) {
      console.error('Failed to save promos to localStorage', err);
    }
  }, [promosList]);

  // Product CRUD Methods
  const addProduct = async (newProduct) => {
    const slug = newProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const productObj = {
      id: newProduct.id || `${slug}-${Date.now().toString().slice(-4)}`,
      productId: newProduct.id || `${slug}-${Date.now().toString().slice(-4)}`,
      name: newProduct.name,
      category: newProduct.category,
      categoryName: categoriesList.find(c => c.id === newProduct.category)?.name || newProduct.category,
      room: newProduct.room,
      roomName: roomsList.find(r => r.id === newProduct.room)?.name || newProduct.room,
      price: Number(newProduct.price),
      originalPrice: newProduct.originalPrice ? Number(newProduct.originalPrice) : null,
      badge: newProduct.badge || null,
      bg: newProduct.bg || 'var(--surface)',
      iconType: newProduct.iconType || 'table',
      image: newProduct.image || '',
      image2: newProduct.image2 || '',
      image3: newProduct.image3 || '',
      image4: newProduct.image4 || '',
      images: Array.isArray(newProduct.images) && newProduct.images.length > 0
        ? newProduct.images
        : [newProduct.image, newProduct.image2, newProduct.image3, newProduct.image4].filter(Boolean),
      description: newProduct.description,
      specs: {
        dimensions: newProduct.specs?.dimensions || '3ft x 2ft x 2.5ft',
        material: newProduct.specs?.material || 'Melamine-faced board',
        warranty: newProduct.specs?.warranty || '2 Years Warranty',
        finish: newProduct.specs?.finish || 'Natural Woodgrain Finish'
      }
    };

    const created = await api.createProduct(productObj);
    if (created && (created._id || created.id)) {
      productObj.mongoId = created._id;
      productObj.id = created.productId || created._id || productObj.id;
    }

    setProductsList(prev => [productObj, ...prev]);
    return productObj;
  };

  const updateProduct = async (productId, updatedFields) => {
    const target = productsList.find(p => p.id === productId || p.mongoId === productId);
    const targetId = target?.mongoId || productId;
    await api.updateProduct(targetId, updatedFields);

    setProductsList(prev =>
      prev.map(item => {
        if (item.id === productId || item.mongoId === productId) {
          const catName = updatedFields.category
            ? categoriesList.find(c => c.id === updatedFields.category)?.name || item.categoryName
            : item.categoryName;
          const rmName = updatedFields.room
            ? roomsList.find(r => r.id === updatedFields.room)?.name || item.roomName
            : item.roomName;

          return {
            ...item,
            ...updatedFields,
            categoryName: catName,
            roomName: rmName,
            price: updatedFields.price !== undefined ? Number(updatedFields.price) : item.price,
            originalPrice: updatedFields.originalPrice ? Number(updatedFields.originalPrice) : null,
            specs: {
              ...item.specs,
              ...(updatedFields.specs || {})
            }
          };
        }
        return item;
      })
    );
  };

  const deleteProduct = async (productId) => {
    const target = productsList.find(p => p.id === productId || p.mongoId === productId);
    const targetId = target?.mongoId || productId;

    await api.deleteProduct(targetId);

    setProductsList(prev => prev.filter(item => item.id !== productId && item.mongoId !== productId));
  };

  const resetProductsToDefault = () => {
    setProductsList(initialProducts);
    setPromosList(DEFAULT_PROMO_BANNERS);
    localStorage.removeItem('shahlajuk_products');
    localStorage.removeItem('shahlajuk_promos');
  };

  // Promo Banner CRUD Methods
  const addPromo = async (newPromo) => {
    const promoObj = {
      id: newPromo.id || `promo-${Date.now().toString().slice(-4)}`,
      promoId: newPromo.id || `promo-${Date.now().toString().slice(-4)}`,
      badge: newPromo.badge,
      title: newPromo.title,
      subtitle: newPromo.subtitle,
      discountPill: newPromo.discountPill,
      buttonText: newPromo.buttonText,
      linkAnchor: newPromo.linkAnchor || '#shop',
      theme: newPromo.theme || 'walnut-gold',
      artType: newPromo.artType || 'living-set',
      layoutDirection: newPromo.layoutDirection || 'normal'
    };

    const created = await api.createPromo(promoObj);
    if (created && (created._id || created.id)) {
      promoObj.mongoId = created._id;
    }

    setPromosList(prev => [...prev, promoObj]);
  };

  const deletePromo = async (promoId) => {
    const target = promosList.find(p => p.id === promoId || p.mongoId === promoId);
    const targetId = target?.mongoId || promoId;

    await api.deletePromo(targetId);

    setPromosList(prev => prev.filter(p => p.id !== promoId && p.mongoId !== promoId));
  };

  return (
    <ProductContext.Provider
      value={{
        products: productsList,
        promos: promosList,
        isLoading,
        categoriesList,
        roomsList,
        isAdminPanelOpen,
        setIsAdminPanelOpen,
        addProduct,
        updateProduct,
        deleteProduct,
        resetProductsToDefault,
        addPromo,
        deletePromo
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}
