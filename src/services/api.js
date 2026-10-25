// ShahLajuk Furniture Mart - Backend API Client Service
const API_BASE_URL = import.meta.env.VITE_API_URL;

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('shahlajuk_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || 'API request failed');
    }
    return data;
  } catch (error) {
    console.warn(`[API Client] Endpoint ${endpoint} unreachable:`, error.message);
    throw error;
  }
}

export const api = {
  // Server Health Check
  checkHealth: () => request('/health'),

  // Cloudinary Image Upload
  uploadImage: async (file) => {
    const token = localStorage.getItem('shahlajuk_token');
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to upload image to Cloudinary');
    }
    return data;
  },

  // PDF Receipt URL Generator
  getOrderReceiptUrl: (orderNumber) => {
    const cleanId = String(orderNumber).trim();
    return `${API_BASE_URL}/orders/${encodeURIComponent(cleanId)}/pdf`;
  },

  // Store MFS Settings & Account Numbers
  getSettings: () => request('/settings'),
  updateSettings: (settingsData) =>
    request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData)
    }),
  login: (emailOrPhone, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrPhone, password })
    }),

  register: (name, email, phone, password, address = '') =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone, password, address })
    }),

  getProfile: () => request('/auth/me'),

  getUsers: () => request('/auth/users'),

  updateUserStatus: (userId, status) =>
    request(`/auth/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  // Furniture Products Catalog
  getProducts: (queryString = '') =>
    request(`/products${queryString ? `?${queryString}` : ''}`),

  createProduct: (productData) =>
    request('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    }),

  updateProduct: (id, productData) =>
    request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    }),

  deleteProduct: (id) =>
    request(`/products/${id}`, {
      method: 'DELETE'
    }),

  // Homepage Dynamic Banners
  getPromos: () => request('/promos'),

  createPromo: (promoData) =>
    request('/promos/admin', {
      method: 'POST',
      body: JSON.stringify(promoData)
    }),

  deletePromo: (id) =>
    request(`/promos/admin/${id}`, {
      method: 'DELETE'
    }),

  // Furniture Orders & Payment Verification
  createOrder: (orderData) =>
    request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    }),

  getMyOrders: () => request('/orders/my-orders'),

  trackOrder: (orderNumber, phone) =>
    request(`/orders/track/${orderNumber}?phone=${encodeURIComponent(phone)}`),

  getAllOrders: () => request('/orders/admin/all'),

  updateOrderStatus: (id, status, extraData = {}) => {
    const { status: _oldStatus, ...restData } = extraData || {};
    return request(`/orders/admin/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ ...restData, status })
    });
  },

  // Admin Analytics & Traffic Logs
  getAnalytics: () => request('/admin/analytics'),

  logVisitorSession: (sessionData) =>
    request('/visitors/log', {
      method: 'POST',
      body: JSON.stringify(sessionData)
    }),

  getVisitorLogs: () => request('/admin/visitors'),

  // Bangladesh BD-GeoAPI & Delivery Area Management
  getGeoDivisions: () => request('/delivery/geo/divisions'),
  getGeoDistricts: (divisionId) =>
    request(`/delivery/geo/districts?division=${encodeURIComponent(divisionId)}`),
  getGeoUpazilas: (districtId) =>
    request(`/delivery/geo/upazilas?district=${encodeURIComponent(districtId)}`),
  searchGeo: (query) =>
    request(`/delivery/geo/search?q=${encodeURIComponent(query)}`),

  // Customer Checkout Delivery Areas
  getActiveDeliveryAreas: () => request('/delivery/areas/active'),
  getActiveDeliveryHierarchy: () => request('/delivery/areas/hierarchy'),
  validateDeliveryUpazila: (upazilaId) => request(`/delivery/validate/${upazilaId}`),

  // Admin Delivery Areas Management
  getAdminDeliveryAreas: (queryString = '') =>
    request(`/delivery/admin/areas${queryString ? `?${queryString}` : ''}`),
  createDeliveryAreas: (data) =>
    request('/delivery/admin/areas', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateDeliveryArea: (id, data) =>
    request(`/delivery/admin/areas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  toggleDeliveryAreaStatus: (id, isActive) =>
    request(`/delivery/admin/areas/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive })
    }),
  bulkUpdateDeliveryFee: (ids, deliveryFee) =>
    request('/delivery/admin/areas/bulk-fee', {
      method: 'PATCH',
      body: JSON.stringify({ ids, deliveryFee })
    }),
  bulkUpdateDeliveryStatus: (ids, isActive) =>
    request('/delivery/admin/areas/bulk-status', {
      method: 'PATCH',
      body: JSON.stringify({ ids, isActive })
    }),
  deleteDeliveryArea: (id) =>
    request(`/delivery/admin/areas/${id}`, {
      method: 'DELETE'
    }),
  bulkDeleteDeliveryAreas: (ids) =>
    request('/delivery/admin/areas/bulk-delete', {
      method: 'DELETE',
      body: JSON.stringify({ ids })
    }),

  // Custom Furniture Inquiry & Reference Upload
  createCustomInquiry: async (formData) => {
    const token = localStorage.getItem('shahlajuk_token');
    const response = await fetch(`${API_BASE_URL}/inquiries/custom`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to submit custom inquiry');
    }
    return data;
  },
  getAdminInquiries: (queryString = '') =>
    request(`/inquiries${queryString ? `?${queryString}` : ''}`),
  getMyInquiries: () => request('/inquiries/my'),
  getInquiryById: (id) => request(`/inquiries/${id}`),
  updateInquiryStatus: (id, status, extraData = {}) => {
    const payload = typeof extraData === 'string'
      ? { status, adminNotes: extraData }
      : { status, ...extraData };
    return request(`/inquiries/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },
  confirmInquiryToOrder: (id, data = {}) =>
    request(`/inquiries/${id}/confirm-order`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  deleteInquiry: (id) =>
    request(`/inquiries/${id}`, {
      method: 'DELETE'
    }),

  // Curated Architecture & Themes Section
  getThemeSection: () => request('/theme-section'),
  updateThemeSection: (themeData) =>
    request('/theme-section', {
      method: 'PUT',
      body: JSON.stringify(themeData)
    }),
  updateThemeSectionMultipart: async (formData) => {
    const token = localStorage.getItem('shahlajuk_token');
    const response = await fetch(`${API_BASE_URL}/theme-section`, {
      method: 'PUT',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to update theme section');
    }
    return data;
  }
};
