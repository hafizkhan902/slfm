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
  // 1. Dynamic Products State
  const [productsList, setProductsList] = useState(() => {
    try {
      const stored = localStorage.getItem('shahlajuk_products');
      return stored ? JSON.parse(stored) : initialProducts;
    } catch {
      return initialProducts;
    }
  });

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
    const fetchCatalogFromDB = async () => {
      try {
        const prodRes = await api.getProducts();
        if (prodRes && Array.isArray(prodRes.products) && prodRes.products.length > 0) {
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
      } catch (err) {
        console.warn('[ProductContext] Backend products fetch fallback:', err.message);
      }

      try {
        const promoRes = await api.getPromos();
        if (promoRes && Array.isArray(promoRes.promos) && promoRes.promos.length > 0) {
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
    console.info('[ProductContext] Step 1: Initiating product addition for:', newProduct.name);
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
    console.info('[ProductContext] Step 2: Formatted product object:', productObj);

    console.info('[ProductContext] Step 3: Sending POST request to backend DB via api.createProduct...');
    const created = await api.createProduct(productObj);
    if (created && (created._id || created.id)) {
      productObj.mongoId = created._id;
      productObj.id = created.productId || created._id || productObj.id;
      console.info('[ProductContext] Step 4: MongoDB backend product created successfully. MongoId:', created._id);
    }

    setProductsList(prev => [productObj, ...prev]);
    console.info('[ProductContext] Step 5: Updated local React state with new product list.');
    return productObj;
  };

  const updateProduct = async (productId, updatedFields) => {
    console.info('[ProductContext] Step 1: Initiating product update for ID/MongoID:', productId);
    const target = productsList.find(p => p.id === productId || p.mongoId === productId);
    console.info('[ProductContext] Step 2: Target product found in state:', target);
    
    const targetId = target?.mongoId || productId;
    console.info('[ProductContext] Step 3: Sending update request to backend DB via api.updateProduct for ID:', targetId);
    await api.updateProduct(targetId, updatedFields);
    console.info('[ProductContext] Step 4: MongoDB backend confirmed product update.');

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
    console.info('[ProductContext] Step 5: Updated local React state for product ID:', productId);
  };

  const deleteProduct = async (productId) => {
    console.info('[ProductContext] Step 1: Initiating product deletion for ID/MongoID:', productId);
    const target = productsList.find(p => p.id === productId || p.mongoId === productId);
    console.info('[ProductContext] Step 2: Target product found in state:', target);
    const targetId = target?.mongoId || productId;

    console.info('[ProductContext] Step 3: Sending DELETE request to backend DB via api.deleteProduct for ID:', targetId);
    await api.deleteProduct(targetId);
    console.info('[ProductContext] Step 4: MongoDB backend confirmed product deletion.');

    setProductsList(prev => prev.filter(item => item.id !== productId && item.mongoId !== productId));
    console.info('[ProductContext] Step 5: Removed product from local React state.');
  };

  const resetProductsToDefault = () => {
    console.info('[ProductContext] Resetting products and promo banners to defaults.');
    setProductsList(initialProducts);
    setPromosList(DEFAULT_PROMO_BANNERS);
    localStorage.removeItem('shahlajuk_products');
    localStorage.removeItem('shahlajuk_promos');
  };

  // Promo Banner CRUD Methods
  const addPromo = async (newPromo) => {
    console.info('[ProductContext] Step 1: Initiating promo poster addition for:', newPromo.title);
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
    console.info('[ProductContext] Step 2: Formatted promo object:', promoObj);

    console.info('[ProductContext] Step 3: Sending POST request to backend DB via api.createPromo...');
    const created = await api.createPromo(promoObj);
    if (created && (created._id || created.id)) {
      promoObj.mongoId = created._id;
      console.info('[ProductContext] Step 4: MongoDB backend promo created successfully. MongoId:', created._id);
    }

    setPromosList(prev => [...prev, promoObj]);
    console.info('[ProductContext] Step 5: Updated local React state with new promo list.');
  };

  const deletePromo = async (promoId) => {
    console.info('[ProductContext] Step 1: Initiating promo poster deletion for ID/MongoID:', promoId);
    const target = promosList.find(p => p.id === promoId || p.mongoId === promoId);
    console.info('[ProductContext] Step 2: Target promo found in state:', target);
    const targetId = target?.mongoId || promoId;

    console.info('[ProductContext] Step 3: Sending DELETE request to backend DB via api.deletePromo for ID:', targetId);
    await api.deletePromo(targetId);
    console.info('[ProductContext] Step 4: MongoDB backend confirmed promo deletion.');

    setPromosList(prev => prev.filter(p => p.id !== promoId && p.mongoId !== promoId));
    console.info('[ProductContext] Step 5: Removed promo poster from local React state.');
  };

  return (
    <ProductContext.Provider
      value={{
        products: productsList,
        promos: promosList,
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
