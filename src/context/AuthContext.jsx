import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Current logged in user
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('shahlajuk_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Registered users database
  const [usersDb, setUsersDb] = useState(() => {
    const defaultUsers = [
      {
        id: 'user-demo-1',
        name: 'Tanvir Hasan',
        email: 'tanvir@gmail.com',
        phone: '+8801712345678',
        address: 'House 42, Road 11, Banani, Trishal, Mymensingh',
        password: 'password123',
        role: 'USER'
      },
      {
        id: 'admin-demo-1',
        name: 'Admin Master (ShahLajuk)',
        email: 'admin@shahlajuk.com',
        phone: '+8801700000000',
        address: 'ShahLajuk HQ, Gulshan-2, Trishal, Mymensingh',
        password: 'adminpassword',
        role: 'ADMIN'
      }
    ];
    try {
      const stored = localStorage.getItem('shahlajuk_users_db');
      if (!stored) return defaultUsers;
      const parsed = JSON.parse(stored);
      const hasAdmin = parsed.some((u) => u.email === 'admin@shahlajuk.com');
      if (!hasAdmin) {
        parsed.push(defaultUsers[1]);
      }
      return parsed;
    } catch {
      return defaultUsers;
    }
  });

  // Orders database
  const [ordersDb, setOrdersDb] = useState(() => {
    try {
      const stored = localStorage.getItem('shahlajuk_orders_db');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' | 'register'
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const formatOrderObj = (o) => ({
    id: o.orderNumber || o._id || o.id,
    mongoId: o._id,
    userId: o.userId || 'guest',
    customerName: o.customerName,
    phone: o.phone,
    address: o.shippingAddress || o.address,
    paymentMethod: o.paymentMethod,
    trxId: o.trxId || '',
    createdAt: o.createdAt || new Date().toISOString(),
    status: o.status || 'Placed',
    items: (o.items || []).map((item) => ({
      product: item.product || {
        id: item.id || 'prod-item',
        name: item.name || 'Furniture Item',
        price: item.price || 0,
        iconType: item.iconType || 'table',
        bg: item.bg || 'var(--surface)'
      },
      quantity: item.quantity || 1
    })),
    totalAmount: o.totalAmount
  });

  const fetchLatestOrders = async (user = currentUser) => {
    try {
      const activeRole = user?.role || 'USER';
      if (activeRole === 'ADMIN') {
        const orders = await api.getAllOrders();
        if (Array.isArray(orders) && orders.length > 0) {
          const formatted = orders.map(formatOrderObj);
          setOrdersDb(formatted);
          console.info(' [AuthContext] Realtime orders refreshed (Admin):', formatted.length);
        }
      } else {
        const myOrders = await api.getMyOrders();
        if (Array.isArray(myOrders) && myOrders.length > 0) {
          const formatted = myOrders.map(formatOrderObj);
          setOrdersDb((prev) => {
            const map = new Map();
            prev.forEach((item) => map.set(String(item.id || item.mongoId).toUpperCase(), item));
            formatted.forEach((item) => {
              const key = String(item.id || item.mongoId).toUpperCase();
              const existing = map.get(key);
              map.set(key, existing ? { ...existing, ...item, status: item.status } : item);
            });
            return Array.from(map.values());
          });
          console.info(' [AuthContext] Realtime user orders refreshed from MongoDB:', formatted.length);
        }
      }
    } catch (err) {
      console.warn('️ [AuthContext] fetchLatestOrders fallback to local state:', err.message);
    }
  };

  // Sync session with backend API on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('shahlajuk_token');
      let activeUserRole = null;
      let activeUser = null;

      if (token) {
        try {
          const profile = await api.getProfile();
          if (profile) {
            const userObj = {
              id: profile._id || profile.id,
              name: profile.name,
              email: profile.email,
              phone: profile.phone,
              address: profile.address || '',
              role: profile.role || 'USER',
              isVerified: true,
              status: profile.status || 'Approved'
            };
            setCurrentUser(userObj);
            activeUser = userObj;
            activeUserRole = profile.role || 'USER';
          }
        } catch (err) {
          console.warn('[AuthContext] Token validation fallback:', err.message);
        }
      }

      // Query Admin endpoints if authenticated user is ADMIN
      if (activeUserRole === 'ADMIN') {
        try {
          const users = await api.getUsers();
          if (Array.isArray(users) && users.length > 0) {
            const formatted = users.map(u => ({
              id: u._id || u.id,
              name: u.name,
              email: u.email,
              phone: u.phone,
              address: u.address || '',
              role: u.role || 'USER',
              status: u.status || 'Approved',
              isVerified: u.isVerified !== undefined ? u.isVerified : true
            }));
            setUsersDb(formatted);
          }
        } catch {
          // Fallback to local storage
        }
      }
      
      fetchLatestOrders(activeUser);
    };

    initAuth();
  }, []);

  // Fetch live orders whenever user opens tracker or profile modal
  useEffect(() => {
    if (isOrderTrackerOpen || isProfileModalOpen) {
      fetchLatestOrders();
    }
  }, [isOrderTrackerOpen, isProfileModalOpen]);

  // Periodic realtime order status poll (every 5s) for logged in user or open tracker modal
  useEffect(() => {
    if (!currentUser && !isOrderTrackerOpen) return;

    const timer = setInterval(() => {
      fetchLatestOrders();
    }, 5000);

    return () => clearInterval(timer);
  }, [currentUser, isOrderTrackerOpen]);

  // Sync state to localStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('shahlajuk_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('shahlajuk_user');
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('shahlajuk_users_db', JSON.stringify(usersDb));
    } catch (e) {
      console.error(e);
    }
  }, [usersDb]);

  useEffect(() => {
    try {
      localStorage.setItem('shahlajuk_orders_db', JSON.stringify(ordersDb));
    } catch (e) {
      console.error(e);
    }
  }, [ordersDb]);

  const login = async (emailOrPhone, password) => {
    try {
      console.info(' [AuthContext] Attempting server login for:', emailOrPhone);
      const res = await api.login(emailOrPhone, password);
      if (res && res.token) {
        localStorage.setItem('shahlajuk_token', res.token);
        const userObj = {
          id: res.user._id || res.user.id,
          name: res.user.name,
          email: res.user.email,
          phone: res.user.phone,
          address: res.user.address || '',
          role: res.user.role || 'USER',
          isVerified: true,
          status: res.user.status || 'Approved'
        };
        setCurrentUser(userObj);
        setIsAuthModalOpen(false);
        await fetchLatestOrders(userObj);
        return { success: true, message: `Welcome back, ${res.user.name}!` };
      }
      return { success: false, message: res?.error || 'Invalid credentials' };
    } catch (err) {
      console.warn(' [AuthContext] Backend login error:', err.message);
      return { success: false, message: err.message || 'Invalid email/phone or password.' };
    }
  };

  const register = async (name, email, phone, password, address = '') => {
    try {
      console.info(' [AuthContext] Registering user in MongoDB database:', email);
      const res = await api.register(name, email, phone, password, address);
      if (res && res.token) {
        localStorage.setItem('shahlajuk_token', res.token);
        const userObj = {
          id: res.user._id || res.user.id,
          name: res.user.name,
          email: res.user.email,
          phone: res.user.phone,
          address: res.user.address || address || '',
          role: res.user.role || 'USER',
          isVerified: true,
          status: 'Approved'
        };
        setCurrentUser(userObj);
        setUsersDb((prev) => [...prev, userObj]);
        setIsAuthModalOpen(false);
        return {
          success: true,
          message: ` Account created successfully! Welcome ${name}.`
        };
      }
      return { success: false, message: res?.error || 'Registration failed' };
    } catch (err) {
      console.warn(' [AuthContext] Backend register error:', err.message);
      return { success: false, message: err.message || 'Registration failed.' };
    }
  };

  const updateUserStatus = async (userId, newStatus) => {
    console.info(' [Admin Debug] Step 1: Initiating user status update', { userId, newStatus });
    try {
      const res = await api.updateUserStatus(userId, newStatus);
      console.log(' [Admin Debug] Step 2: User status updated in MongoDB:', res);
    } catch (err) {
      console.warn('️ [Admin Debug] updateUserStatus API fallback:', err.message);
    }
    setUsersDb((prev) =>
      prev.map((u) =>
        u.id === userId || u._id === userId
          ? { ...u, status: newStatus, isVerified: newStatus === 'Approved' }
          : u
      )
    );
  };

  const updateUserProfile = (updatedData) => {
    if (!currentUser) return { success: false, message: 'No user logged in.' };

    const updatedUser = {
      ...currentUser,
      name: updatedData.name !== undefined ? updatedData.name : currentUser.name,
      email: updatedData.email !== undefined ? updatedData.email : currentUser.email,
      phone: updatedData.phone !== undefined ? updatedData.phone : currentUser.phone,
      address: updatedData.address !== undefined ? updatedData.address : (currentUser.address || '')
    };

    setCurrentUser(updatedUser);

    setUsersDb((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, ...updatedData } : u))
    );

    return { success: true, message: 'Profile and shipping address updated successfully!' };
  };

  const logout = () => {
    console.info(' [Auth Debug] User logged out, clearing JWT token.');
    localStorage.removeItem('shahlajuk_token');
    setCurrentUser(null);
    setIsProfileModalOpen(false);
  };

  const createOrder = async (orderDetails) => {
    console.info(' [Checkout Debug] Step 1: Submitting new purchase order to server backend...', orderDetails);

    const payload = {
      customerName: orderDetails.name,
      phone: orderDetails.phone,
      shippingAddress: orderDetails.address,
      paymentMethod: orderDetails.paymentMethod,
      trxId: orderDetails.trxId || '',
      items: orderDetails.items,
      totalAmount: orderDetails.totalAmount
    };

    const res = await api.createOrder(payload);
    if (res && res.order) {
      const o = res.order;
      const serverOrderNumber = o.orderNumber || o._id;
      const createdOrderObj = {
        id: serverOrderNumber,
        mongoId: o._id,
        userId: currentUser ? (currentUser.id || currentUser._id) : 'guest',
        customerName: o.customerName,
        phone: o.phone,
        address: o.shippingAddress || o.address,
        paymentMethod: o.paymentMethod,
        trxId: o.trxId || '',
        createdAt: o.createdAt || new Date().toISOString(),
        status: o.status || 'Placed',
        items: o.items || [],
        totalAmount: o.totalAmount
      };

      console.log(' [Checkout Debug] Step 2: Order created with server-generated orderNumber:', serverOrderNumber);
      setOrdersDb((prev) => [createdOrderObj, ...prev]);
      return serverOrderNumber;
    }

    throw new Error(res?.error || 'Failed to generate order from server');
  };

  const getUserOrders = () => {
    if (!currentUser) return [];

    const userPhoneClean = (currentUser.phone || '').replace(/[^0-9]/g, '');
    const userPhoneSuffix = userPhoneClean && userPhoneClean.length >= 7 ? userPhoneClean.slice(-10) : '';
    const userEmailClean = (currentUser.email || '').toLowerCase();
    const userNameClean = (currentUser.name || '').toLowerCase();

    return ordersDb.filter((o) => {
      if (o.userId && (String(o.userId) === String(currentUser.id) || String(o.userId) === String(currentUser.mongoId || currentUser.id))) {
        return true;
      }
      const orderPhoneClean = (o.phone || '').replace(/[^0-9]/g, '');
      const orderPhoneSuffix = orderPhoneClean && orderPhoneClean.length >= 7 ? orderPhoneClean.slice(-10) : '';
      if (userPhoneSuffix && orderPhoneSuffix && (userPhoneSuffix === orderPhoneSuffix || orderPhoneClean.includes(userPhoneSuffix))) {
        return true;
      }
      if (o.customerName) {
        const cName = o.customerName.toLowerCase();
        if (cName === userNameClean || cName === userEmailClean) {
          return true;
        }
      }
      return false;
    });
  };

  const trackOrderById = async (orderId, phone) => {
    const cleanId = orderId.trim().toUpperCase();
    const cleanPhone = phone.trim();
    console.info(' [Tracker Debug] Searching for order:', { cleanId, cleanPhone });

    try {
      const serverOrder = await api.trackOrder(cleanId, cleanPhone);
      if (serverOrder) {
        console.log(' [Tracker Debug] Order found in MongoDB database:', serverOrder);
        return {
          id: serverOrder.orderNumber || serverOrder._id,
          customerName: serverOrder.customerName,
          phone: serverOrder.phone,
          address: serverOrder.shippingAddress,
          paymentMethod: serverOrder.paymentMethod,
          createdAt: serverOrder.createdAt,
          status: serverOrder.status,
          items: serverOrder.items,
          totalAmount: serverOrder.totalAmount
        };
      }
    } catch (err) {
      console.warn('️ [Tracker Debug] Server track lookup fallback:', err.message);
    }

    return ordersDb.find(
      (o) =>
        String(o.id).toUpperCase() === cleanId &&
        (String(o.phone).includes(cleanPhone) || cleanPhone.includes(String(o.phone)))
    );
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const cleanId = String(orderId).trim();
    const digitsOnly = cleanId.replace(/[^0-9]/g, '');

    console.info(` [Admin Debug] Step 1: Initiating Realtime Order Status Update for "${cleanId}" -> "${newStatus}"`);

    // 1. Dispatch PATCH request to MongoDB server API endpoint
    console.log(' [Admin Debug] Step 2: Dispatching PATCH HTTP request to MongoDB server endpoint...', `/orders/admin/${orderId}/status`, { newStatus });
    const updated = await api.updateOrderStatus(orderId, newStatus);

    if (updated && (updated.orderNumber || updated._id)) {
      const serverStatus = updated.status || newStatus;
      console.log(' [Admin Debug] Step 3: Server confirmed MongoDB status update in real time:', { orderNumber: updated.orderNumber || updated._id, status: serverStatus });

      setOrdersDb((prev) =>
        prev.map((o) => {
          const matches =
            String(o.id).trim().toUpperCase() === cleanId.toUpperCase() ||
            (o.mongoId && String(o.mongoId) === cleanId) ||
            (updated.orderNumber && String(o.id).toUpperCase() === String(updated.orderNumber).toUpperCase()) ||
            (updated._id && String(o.mongoId) === String(updated._id)) ||
            (digitsOnly && String(o.id).includes(digitsOnly));

          return matches ? { ...o, status: serverStatus, mongoId: updated._id || o.mongoId } : o;
        })
      );

      // Re-query database to synchronize realtime state across entire app
      await fetchLatestOrders();

      return updated;
    } else {
      throw new Error(`Order ${orderId} status update failed on server.`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        usersDb,
        login,
        register,
        updateUserProfile,
        updateUserStatus,
        logout,
        createOrder,
        getUserOrders,
        trackOrderById,
        updateOrderStatus,
        ordersDb,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        isOrderTrackerOpen,
        setIsOrderTrackerOpen,
        isProfileModalOpen,
        setIsProfileModalOpen
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
