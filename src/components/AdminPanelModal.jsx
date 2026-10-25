import React, { useState, useEffect, useRef } from 'react';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { ProductIcon } from './ProductIcon';
import { api } from '../services/api';

export function AdminPanelModal() {
  const {
    products,
    promos,
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
  } = useProducts();

  const { ordersDb, usersDb, updateOrderStatus, updateUserStatus, currentUser, fetchLatestOrders } = useAuth();

  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'products' | 'promos' | 'orders' | 'users' | 'visitors'
  const [productSearch, setProductSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [analyticsCustomerSort, setAnalyticsCustomerSort] = useState('spent-desc'); // 'spent-desc' | 'spent-asc' | 'orders-desc' | 'name-asc'

  // ----------------------------------------------------
  // Delivery Areas Management State & Effects
  // ----------------------------------------------------
  const [deliveryAreas, setDeliveryAreas] = useState([]);
  const [deliveryMetrics, setDeliveryMetrics] = useState({ totalCount: 0, activeCount: 0, inactiveCount: 0, avgFee: 0 });
  const [isLoadingDeliveryAreas, setIsLoadingDeliveryAreas] = useState(false);
  const [deliveryFilterSearch, setDeliveryFilterSearch] = useState('');
  const [deliveryFilterDivision, setDeliveryFilterDivision] = useState('all');
  const [deliveryFilterDistrict, setDeliveryFilterDistrict] = useState('all');
  const [deliveryFilterStatus, setDeliveryFilterStatus] = useState('all');
  const [selectedTableAreaIds, setSelectedTableAreaIds] = useState([]);
  const [editingAreaId, setEditingAreaId] = useState(null);
  const [editingFeeValue, setEditingFeeValue] = useState('');
  const [isBulkFeeModalOpen, setIsBulkFeeModalOpen] = useState(false);
  const [bulkFeeInput, setBulkFeeInput] = useState(120);

  // BD-Geo Cascading Selector State (BD-GeoAPI)
  const [geoDivisions, setGeoDivisions] = useState([]);
  const [selectedGeoDivisionId, setSelectedGeoDivisionId] = useState('');
  const [geoDistricts, setGeoDistricts] = useState([]);
  const [selectedGeoDistrictId, setSelectedGeoDistrictId] = useState('');
  const [geoUpazilas, setGeoUpazilas] = useState([]);
  const [isLoadingGeoUpazilas, setIsLoadingGeoUpazilas] = useState(false);
  const [selectedUpazilaMap, setSelectedUpazilaMap] = useState({});
  const [commonFeeInput, setCommonFeeInput] = useState(120);
  const [isSavingAreas, setIsSavingAreas] = useState(false);

  // ----------------------------------------------------
  // Custom Furniture Inquiries Management State
  // ----------------------------------------------------
  const [inquiries, setInquiries] = useState([]);
  const [inquiryMetrics, setInquiryMetrics] = useState({ total: 0, pendingReview: 0, contacted: 0, confirmed: 0, cancelled: 0 });
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(false);
  const [inquirySearch, setInquirySearch] = useState('');
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState('all');
  const [activeImagePreview, setActiveImagePreview] = useState(null);
  const [confirmModalData, setConfirmModalData] = useState(null);

  const fetchInquiries = async () => {
    setIsLoadingInquiries(true);
    try {
      const res = await api.getAdminInquiries();
      if (res && res.success) {
        setInquiries(res.inquiries || []);
        if (res.metrics) {
          setInquiryMetrics(res.metrics);
        }
      }
    } catch (err) {
      console.warn('[AdminPanel] Error fetching inquiries:', err.message);
    } finally {
      setIsLoadingInquiries(false);
    }
  };

  const handleOpenConfirmModal = (inq) => {
    setConfirmModalData({
      inquiry: inq,
      agreedPrice: inq.confirmedPrice || '',
      shippingAddress: inq.shippingAddress || inq.userId?.address || '',
      paymentMethod: 'Cash on Delivery (Custom Order)',
      notes: inq.adminNotes || '',
      isSubmitting: false
    });
  };

  const handleConfirmOrderSubmit = async (e) => {
    e.preventDefault();
    if (!confirmModalData || !confirmModalData.inquiry) return;
    const { inquiry, agreedPrice, shippingAddress, paymentMethod, notes } = confirmModalData;

    const priceNum = parseFloat(agreedPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Please enter a valid agreed price (৳) greater than 0.');
      return;
    }

    setConfirmModalData(prev => ({ ...prev, isSubmitting: true }));
    try {
      const res = await api.confirmInquiryToOrder(inquiry._id, {
        confirmedPrice: priceNum,
        shippingAddress: (shippingAddress || '').trim() || 'To be confirmed upon call',
        paymentMethod,
        adminNotes: notes
      });

      if (res && res.success) {
        alert(`🎉 Custom inquiry confirmed! Order #${res.order?.orderNumber || ''} created with Pending status.`);
        setConfirmModalData(null);
        await fetchInquiries();
        if (fetchLatestOrders) {
          await fetchLatestOrders();
        }
      }
    } catch (err) {
      alert(`Failed to confirm custom order: ${err.message}`);
      setConfirmModalData(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleUpdateInquiryStatus = async (inq, newStatus) => {
    if (newStatus === 'Confirmed' && !inq.convertedOrderId) {
      handleOpenConfirmModal(inq);
      return;
    }

    try {
      const res = await api.updateInquiryStatus(inq._id, newStatus);
      if (res && res.success) {
        setInquiries(prev => prev.map(item => item._id === inq._id ? { ...item, status: newStatus } : item));
        fetchInquiries();
        if (fetchLatestOrders) {
          await fetchLatestOrders();
        }
      }
    } catch (err) {
      alert(`Failed to update inquiry status: ${err.message}`);
    }
  };

  const fetchDeliveryAreas = async () => {
    setIsLoadingDeliveryAreas(true);
    try {
      const res = await api.getAdminDeliveryAreas();
      if (res && res.success) {
        setDeliveryAreas(res.areas || []);
        if (res.metrics) {
          setDeliveryMetrics(res.metrics);
        }
      }
    } catch (err) {
      console.warn('[AdminPanel] Error fetching delivery areas:', err.message);
    } finally {
      setIsLoadingDeliveryAreas(false);
    }
  };

  const fetchGeoDivisions = async () => {
    try {
      const res = await api.getGeoDivisions();
      if (res && Array.isArray(res.data)) {
        setGeoDivisions(res.data);
      }
    } catch (err) {
      console.warn('[AdminPanel] Error loading BD divisions:', err.message);
    }
  };

  useEffect(() => {
    if (isAdminPanelOpen) {
      fetchDeliveryAreas();
      fetchGeoDivisions();
      fetchInquiries();
    }
  }, [isAdminPanelOpen]);


  // Load districts when division selected in geo picker
  useEffect(() => {
    if (!selectedGeoDivisionId) {
      setGeoDistricts([]);
      setSelectedGeoDistrictId('');
      setGeoUpazilas([]);
      setSelectedUpazilaMap({});
      return;
    }
    const loadDistricts = async () => {
      try {
        const res = await api.getGeoDistricts(selectedGeoDivisionId);
        if (res && Array.isArray(res.data)) {
          setGeoDistricts(res.data);
        } else {
          setGeoDistricts([]);
        }
        setSelectedGeoDistrictId('');
        setGeoUpazilas([]);
        setSelectedUpazilaMap({});
      } catch (err) {
        console.warn('[AdminPanel] Error loading districts:', err.message);
      }
    };
    loadDistricts();
  }, [selectedGeoDivisionId]);

  // Load upazilas when district selected in geo picker
  useEffect(() => {
    if (!selectedGeoDistrictId) {
      setGeoUpazilas([]);
      setSelectedUpazilaMap({});
      return;
    }
    const loadUpazilas = async () => {
      setIsLoadingGeoUpazilas(true);
      try {
        const res = await api.getGeoUpazilas(selectedGeoDistrictId);
        const upzs = (res && Array.isArray(res.data)) ? res.data : [];
        setGeoUpazilas(upzs);

        const initialMap = {};
        for (const u of upzs) {
          const already = deliveryAreas.find(a => Number(a.upazilaId) === Number(u.id));
          initialMap[u.id] = {
            checked: false,
            fee: already ? already.deliveryFee : commonFeeInput,
            estimatedDays: already ? (already.estimatedDays || '2-4 business days') : '2-4 business days'
          };
        }
        setSelectedUpazilaMap(initialMap);
      } catch (err) {
        console.warn('[AdminPanel] Error loading upazilas:', err.message);
      } finally {
        setIsLoadingGeoUpazilas(false);
      }
    };
    loadUpazilas();
  }, [selectedGeoDistrictId, deliveryAreas]);

  const handleToggleSelectAllUpazilas = (checkAll) => {
    const updated = { ...selectedUpazilaMap };
    for (const u of geoUpazilas) {
      if (updated[u.id]) {
        updated[u.id].checked = checkAll;
      }
    }
    setSelectedUpazilaMap(updated);
  };

  const handleApplyCommonFee = () => {
    const fee = Number(commonFeeInput);
    if (isNaN(fee) || fee < 0) {
      alert('Please enter a valid non-negative fee amount in BDT.');
      return;
    }
    const updated = { ...selectedUpazilaMap };
    for (const key of Object.keys(updated)) {
      if (updated[key].checked) {
        updated[key].fee = fee;
      }
    }
    setSelectedUpazilaMap(updated);
  };

  const handleSaveConfiguredAreas = async () => {
    const currentDiv = geoDivisions.find(d => String(d.id) === String(selectedGeoDivisionId));
    const currentDist = geoDistricts.find(d => String(d.id) === String(selectedGeoDistrictId));

    if (!currentDiv || !currentDist) {
      alert('Please select both a Division and District from the cascading dropdowns.');
      return;
    }

    const areasToSave = [];
    for (const u of geoUpazilas) {
      const entry = selectedUpazilaMap[u.id];
      if (entry && entry.checked) {
        areasToSave.push({
          divisionId: Number(currentDiv.id),
          divisionName: currentDiv.name,
          divisionNameBn: currentDiv.nameBn || currentDiv.name_bn || '',
          districtId: Number(currentDist.id),
          districtName: currentDist.name,
          districtNameBn: currentDist.nameBn || currentDist.name_bn || '',
          upazilaId: Number(u.id),
          upazilaName: u.name,
          upazilaNameBn: u.nameBn || u.name_bn || '',
          deliveryFee: Number(entry.fee || commonFeeInput || 120),
          estimatedDays: entry.estimatedDays || '2-4 business days',
          isActive: true
        });
      }
    }

    if (areasToSave.length === 0) {
      alert('Please check at least one upazila to add/configure for delivery.');
      return;
    }

    setIsSavingAreas(true);
    try {
      const res = await api.createDeliveryAreas({ areas: areasToSave });
      alert(res.message || `Configured ${areasToSave.length} delivery area(s) successfully!`);
      await fetchDeliveryAreas();
      handleToggleSelectAllUpazilas(false);
    } catch (err) {
      alert(`Failed to save delivery areas: ${err.message}`);
    } finally {
      setIsSavingAreas(false);
    }
  };

  const handleToggleAreaStatus = async (area) => {
    try {
      await api.toggleDeliveryAreaStatus(area._id, !area.isActive);
      setDeliveryAreas(prev =>
        prev.map(a => a._id === area._id ? { ...a, isActive: !a.isActive } : a)
      );
      setDeliveryMetrics(prev => ({
        ...prev,
        activeCount: area.isActive ? prev.activeCount - 1 : prev.activeCount + 1,
        inactiveCount: area.isActive ? prev.inactiveCount + 1 : prev.inactiveCount - 1
      }));
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleSaveInlineFee = async (areaId) => {
    const fee = Number(editingFeeValue);
    if (isNaN(fee) || fee < 0) {
      alert('Please enter a valid non-negative fee amount.');
      return;
    }
    try {
      await api.updateDeliveryArea(areaId, { deliveryFee: fee });
      setDeliveryAreas(prev =>
        prev.map(a => a._id === areaId ? { ...a, deliveryFee: fee } : a)
      );
      setEditingAreaId(null);
    } catch (err) {
      alert(`Failed to update delivery fee: ${err.message}`);
    }
  };

  const handleDeleteArea = async (area) => {
    if (!window.confirm(`Are you sure you want to remove "${area.upazilaName}" from delivery areas?`)) {
      return;
    }
    try {
      await api.deleteDeliveryArea(area._id);
      setDeliveryAreas(prev => prev.filter(a => a._id !== area._id));
      setSelectedTableAreaIds(prev => prev.filter(id => id !== area._id));
      await fetchDeliveryAreas();
    } catch (err) {
      alert(`Failed to delete area: ${err.message}`);
    }
  };

  const handleBulkActivate = async (isActive) => {
    if (selectedTableAreaIds.length === 0) return;
    try {
      await api.bulkUpdateDeliveryStatus(selectedTableAreaIds, isActive);
      await fetchDeliveryAreas();
      setSelectedTableAreaIds([]);
    } catch (err) {
      alert(`Bulk update failed: ${err.message}`);
    }
  };

  const handleBulkUpdateFee = async () => {
    if (selectedTableAreaIds.length === 0) return;
    const fee = Number(bulkFeeInput);
    if (isNaN(fee) || fee < 0) {
      alert('Please enter a valid non-negative fee amount.');
      return;
    }
    try {
      await api.bulkUpdateDeliveryFee(selectedTableAreaIds, fee);
      await fetchDeliveryAreas();
      setIsBulkFeeModalOpen(false);
      setSelectedTableAreaIds([]);
    } catch (err) {
      alert(`Bulk fee update failed: ${err.message}`);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTableAreaIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedTableAreaIds.length} delivery area(s)?`)) {
      return;
    }
    try {
      await api.bulkDeleteDeliveryAreas(selectedTableAreaIds);
      await fetchDeliveryAreas();
      setSelectedTableAreaIds([]);
    } catch (err) {
      alert(`Bulk delete failed: ${err.message}`);
    }
  };


  // Expandable row state for mobile table details
  const [expandedRowIds, setExpandedRowIds] = useState({});
  const toggleRowExpand = (id) => {
    setExpandedRowIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Visitor logs state (persisted in localStorage)
  const [visitorLogs, setVisitorLogs] = useState(() => {
    const defaultLogs = [
      {
        id: 'vis-101',
        city: 'Trishal, Mymensingh',
        country: 'Bangladesh',
        ip: '103.145.74.12',
        device: 'Mobile (Safari / iOS)',
        browsedSection: 'Living Room & Dining Sets',
        timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        pageViews: 6
      },
      {
        id: 'vis-102',
        city: 'Chittagong',
        country: 'Bangladesh',
        ip: '103.230.104.45',
        device: 'Desktop (Chrome / Windows)',
        browsedSection: 'Noyon Dining Table & Chairs',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        pageViews: 8
      },
      {
        id: 'vis-103',
        city: 'Sylhet',
        country: 'Bangladesh',
        ip: '119.30.38.89',
        device: 'Desktop (Chrome / macOS)',
        browsedSection: 'Bedroom Queen Bed & Wardrobe',
        timestamp: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
        pageViews: 5
      },
      {
        id: 'vis-104',
        city: 'Rajshahi',
        country: 'Bangladesh',
        ip: '103.88.220.15',
        device: 'Mobile (Chrome / Android)',
        browsedSection: 'Study Tables & Office Furniture',
        timestamp: new Date(Date.now() - 1000 * 60 * 220).toISOString(),
        pageViews: 4
      },
      {
        id: 'vis-105',
        city: 'Khulna',
        country: 'Bangladesh',
        ip: '180.211.230.64',
        device: 'Desktop (Firefox / Windows)',
        browsedSection: 'Home Page & Promo Banners',
        timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
        pageViews: 9
      },
      {
        id: 'vis-106',
        city: 'Trishal, Mymensingh',
        country: 'Bangladesh',
        ip: '103.134.58.22',
        device: 'Mobile (Safari / iOS)',
        browsedSection: 'Cart & Checkout Page',
        timestamp: new Date(Date.now() - 1000 * 60 * 540).toISOString(),
        pageViews: 7
      },
      {
        id: 'vis-107',
        city: 'Barisal',
        country: 'Bangladesh',
        ip: '103.245.112.80',
        device: 'Desktop (Edge / Windows)',
        browsedSection: 'Bookshelves & Wall Shelves',
        timestamp: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
        pageViews: 3
      },
      {
        id: 'vis-108',
        city: 'Comilla',
        country: 'Bangladesh',
        ip: '103.195.204.14',
        device: 'Mobile (Chrome / Android)',
        browsedSection: 'Dressing Tables & Mirrors',
        timestamp: new Date(Date.now() - 1000 * 60 * 980).toISOString(),
        pageViews: 5
      }
    ];

    try {
      const stored = localStorage.getItem('shahlajuk_visitor_logs');
      if (!stored) {
        localStorage.setItem('shahlajuk_visitor_logs', JSON.stringify(defaultLogs));
        return defaultLogs;
      }
      return JSON.parse(stored);
    } catch {
      return defaultLogs;
    }
  });

  const [visitorSearch, setVisitorSearch] = useState('');
  const [visitorCityFilter, setVisitorCityFilter] = useState('all');

  // Fetch real visitor traffic logs from backend database
  useEffect(() => {
    if (!isAdminPanelOpen && activeTab !== 'visitors') return;

    const fetchLogs = async () => {
      try {
        const res = await api.getVisitorLogs();
        if (res && res.logs && Array.isArray(res.logs) && res.logs.length > 0) {
          const formatted = res.logs.map(log => ({
            id: log._id || log.sessionId,
            city: log.city || 'Trishal, Mymensingh',
            country: log.country || 'Bangladesh',
            ip: log.ip,
            device: log.device,
            browsedSection: log.browsedSection,
            timestamp: log.createdAt || log.updatedAt || new Date().toISOString(),
            pageViews: log.pageViews || 1
          }));
          setVisitorLogs(formatted);
        }
      } catch (err) {
        console.warn('[AdminPanelModal] Visitor logs fetch fallback:', err.message);
      }
    };

    fetchLogs();
  }, [isAdminPanelOpen, activeTab]);

  // Store Settings (MFS, Footer, Promo Banner Toggle) State
  const [storeSettings, setStoreSettings] = useState({
    bkashNumber: '01712-345678',
    nagadNumber: '01812-345678',
    deliveryChargeInsideDhaka: 120,
    deliveryChargeOutsideDhaka: 250,
    storeAddress: 'Porabari Road CNG Station, Trishal, Mymensingh',
    storePhone: '+880 1700-000000',
    storeEmail: 'info@shahlajuk.com',
    openingHours: 'Open daily, 10am–8pm',
    facebookUrl: 'https://facebook.com',
    instagramUrl: 'https://instagram.com',
    whatsappNumber: '8801700000000',
    youtubeUrl: '',
    isPromoBannerEnabled: true
  });

  const [openSettingSections, setOpenSettingSections] = useState({
    mfs: true,
    footer: true,
    promos: true
  });

  const toggleSettingSection = (sectionKey) => {
    setOpenSettingSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');

  useEffect(() => {
    if (!isAdminPanelOpen) return;
    const fetchSettings = async () => {
      try {
        const data = await api.getSettings();
        if (data) {
          setStoreSettings({
            bkashNumber: data.bkashNumber || '01712-345678',
            nagadNumber: data.nagadNumber || '01812-345678',
            deliveryChargeInsideDhaka: data.deliveryChargeInsideDhaka ?? 120,
            deliveryChargeOutsideDhaka: data.deliveryChargeOutsideDhaka ?? 250,
            storeAddress: data.storeAddress || 'Porabari Road CNG Station, Trishal, Mymensingh',
            storePhone: data.storePhone || '+880 1700-000000',
            storeEmail: data.storeEmail || 'info@shahlajuk.com',
            openingHours: data.openingHours || 'Open daily, 10am–8pm',
            facebookUrl: data.facebookUrl || 'https://facebook.com',
            instagramUrl: data.instagramUrl || 'https://instagram.com',
            whatsappNumber: data.whatsappNumber || '8801700000000',
            youtubeUrl: data.youtubeUrl || '',
            isPromoBannerEnabled: data.isPromoBannerEnabled ?? true
          });
        }
      } catch (err) {
        console.warn('[AdminPanelModal] Failed to load store settings:', err.message);
      }
    };
    fetchSettings();
  }, [isAdminPanelOpen, activeTab]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsMessage('');
    try {
      const res = await api.updateSettings(storeSettings);
      if (res && res.settings) {
        setStoreSettings({
          bkashNumber: res.settings.bkashNumber,
          nagadNumber: res.settings.nagadNumber,
          deliveryChargeInsideDhaka: res.settings.deliveryChargeInsideDhaka,
          deliveryChargeOutsideDhaka: res.settings.deliveryChargeOutsideDhaka,
          storeAddress: res.settings.storeAddress,
          storePhone: res.settings.storePhone,
          storeEmail: res.settings.storeEmail,
          openingHours: res.settings.openingHours,
          facebookUrl: res.settings.facebookUrl,
          instagramUrl: res.settings.instagramUrl,
          whatsappNumber: res.settings.whatsappNumber,
          youtubeUrl: res.settings.youtubeUrl,
          isPromoBannerEnabled: res.settings.isPromoBannerEnabled
        });
      }
      setSettingsMessage('Store settings saved successfully!');
      window.dispatchEvent(new Event('shahlajuk_settings_updated'));
    } catch (err) {
      alert(`Failed to update store settings: ${err.message}`);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // ----------------------------------------------------
  // Architecture & Themes Section Management State
  // ----------------------------------------------------
  const [themeForm, setThemeForm] = useState({
    eyebrow: 'CURATED ARCHITECTURE & THEMES',
    heading: 'Spaces Sculpted for Serenity',
    subheading: 'We design with the belief that calm interiors create quiet minds. Explore our architectural collections curated for modern living.',
    cards: [
      {
        badgeText: 'THEME 01',
        imageUrl: '',
        category: 'LIVING & LOUNGE',
        title: 'The Minimalist Living Room',
        description: 'Solid Chittagong teak sofas and architectural low-tables. Proportion, tactile grain, and generous negative space that allows rooms to breathe.',
        buttonText: 'Explore Living Collection',
        buttonLink: 'room:living-room',
        order: 1
      },
      {
        badgeText: 'THEME 02',
        imageUrl: '',
        category: 'MATERIALITY',
        title: 'Warm Japandi Textures',
        description: "An organic dialogue between raw timber and moisture-sealed melamine board. Crafted for Bangladesh's humid seasons without warping.",
        buttonText: 'Learn About Board Durability',
        buttonLink: '#material',
        order: 2
      },
      {
        badgeText: 'THEME 03',
        imageUrl: '',
        category: 'STUDY & STORAGE',
        title: 'Modular Architectural Joinery',
        description: 'Clean-lined study desks, ergonomic bookshelves, and multi-door wardrobes engineered with smooth silent hardware for lifetime utility.',
        buttonText: 'Explore Study & Desks',
        buttonLink: 'room:reading-room',
        order: 3
      }
    ]
  });
  const [isLoadingThemes, setIsLoadingThemes] = useState(false);
  const [isSavingThemes, setIsSavingThemes] = useState(false);
  const [themeToast, setThemeToast] = useState(null); // { type: 'success' | 'error', message: string }
  const [uploadingCardIndex, setUploadingCardIndex] = useState(null);

  const fetchThemeSection = async () => {
    setIsLoadingThemes(true);
    try {
      const res = await api.getThemeSection();
      if (res && res.data) {
        setThemeForm({
          eyebrow: res.data.eyebrow || '',
          heading: res.data.heading || '',
          subheading: res.data.subheading || '',
          cards: Array.isArray(res.data.cards) && res.data.cards.length > 0 ? res.data.cards : themeForm.cards
        });
      }
    } catch (err) {
      console.warn('[AdminPanelModal] Failed to load theme section:', err.message);
    } finally {
      setIsLoadingThemes(false);
    }
  };

  useEffect(() => {
    if (!isAdminPanelOpen && activeTab !== 'themes') return;
    fetchThemeSection();
  }, [isAdminPanelOpen, activeTab]);

  const handleCardFieldChange = (index, field, value) => {
    setThemeForm((prev) => {
      const updatedCards = [...prev.cards];
      updatedCards[index] = {
        ...updatedCards[index],
        [field]: value
      };
      return { ...prev, cards: updatedCards };
    });
  };

  const handleCardImageUpload = async (index, file) => {
    if (!file) return;
    setUploadingCardIndex(index);
    try {
      const res = await api.uploadImage(file);
      if (res && res.url) {
        handleCardFieldChange(index, 'imageUrl', res.url);
        setThemeToast({ type: 'success', message: `Theme 0${index + 1} image uploaded successfully!` });
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      const reader = new FileReader();
      reader.onload = () => {
        handleCardFieldChange(index, 'imageUrl', reader.result);
        setThemeToast({ type: 'success', message: `Theme 0${index + 1} image preview loaded!` });
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingCardIndex(null);
      setTimeout(() => setThemeToast(null), 3500);
    }
  };

  const handleSaveThemeSection = async (e) => {
    if (e) e.preventDefault();
    setIsSavingThemes(true);
    setThemeToast(null);
    try {
      const res = await api.updateThemeSection(themeForm);
      if (res && res.success) {
        setThemeToast({ type: 'success', message: 'Architecture & Themes section saved successfully!' });
      } else {
        throw new Error(res.message || 'Failed to save');
      }
    } catch (err) {
      console.error('Failed to save theme section:', err);
      setThemeToast({ type: 'error', message: err.message || 'Failed to save changes.' });
    } finally {
      setIsSavingThemes(false);
      setTimeout(() => setThemeToast(null), 4000);
    }
  };

  // ----------------------------------------------------
  // Native Banner (320x50) Management State
  // ----------------------------------------------------
  const [nativeBannerForm, setNativeBannerForm] = useState({
    title: 'ShahLajuk Exclusive Collections & Offers',
    adestraLink: '',
    adScriptCode: '',
    imageUrl: '',
    badgeText: 'SPONSORED',
    placement: 'footer',
    isActive: true,
    openInNewTab: true,
    altText: 'ShahLajuk Furniture Partner'
  });
  const [isLoadingBanner, setIsLoadingBanner] = useState(false);
  const [isSavingBanner, setIsSavingBanner] = useState(false);
  const [bannerToast, setBannerToast] = useState(null);
  const [isUploadingBannerImage, setIsUploadingBannerImage] = useState(false);
  const bannerFileInputRef = useRef(null);

  const fetchNativeBanner = async () => {
    setIsLoadingBanner(true);
    try {
      const res = await api.getNativeBanner();
      if (res && res.data) {
        setNativeBannerForm({
          title: res.data.title || '',
          adestraLink: res.data.adestraLink || '',
          adScriptCode: res.data.adScriptCode || '',
          imageUrl: res.data.imageUrl || '',
          badgeText: res.data.badgeText || 'SPONSORED',
          placement: res.data.placement || 'footer',
          isActive: res.data.isActive !== false,
          openInNewTab: res.data.openInNewTab !== false,
          altText: res.data.altText || ''
        });
      }
    } catch (err) {
      console.warn('[AdminPanelModal] Failed to load native banner:', err.message);
    } finally {
      setIsLoadingBanner(false);
    }
  };

  useEffect(() => {
    if (!isAdminPanelOpen && activeTab !== 'banner') return;
    fetchNativeBanner();
  }, [isAdminPanelOpen, activeTab]);

  const handleBannerImageUpload = async (file) => {
    if (!file) return;
    setIsUploadingBannerImage(true);
    try {
      const res = await api.uploadImage(file);
      if (res && res.url) {
        setNativeBannerForm(prev => ({ ...prev, imageUrl: res.url }));
        setBannerToast({ type: 'success', message: 'Banner graphic uploaded successfully!' });
      }
    } catch (err) {
      console.error('Banner upload error:', err);
      const reader = new FileReader();
      reader.onload = () => {
        setNativeBannerForm(prev => ({ ...prev, imageUrl: reader.result }));
        setBannerToast({ type: 'success', message: 'Banner image preview loaded!' });
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingBannerImage(false);
      setTimeout(() => setBannerToast(null), 3500);
    }
  };

  const handleSaveNativeBanner = async (e) => {
    if (e) e.preventDefault();
    setIsSavingBanner(true);
    setBannerToast(null);
    try {
      const payload = {
        ...nativeBannerForm,
        adScriptCodeBase64: btoa(unescape(encodeURIComponent(nativeBannerForm.adScriptCode || '')))
      };
      const res = await api.updateNativeBanner(payload);
      if (res && res.success) {
        setBannerToast({ type: 'success', message: 'Native Banner (320x50) saved successfully!' });
      } else {
        throw new Error(res?.error || 'Failed to save banner');
      }
    } catch (err) {
      console.error('Failed to save native banner:', err);
      setBannerToast({ type: 'error', message: err.message || 'Failed to save native banner.' });
    } finally {
      setIsSavingBanner(false);
      setTimeout(() => setBannerToast(null), 4000);
    }
  };

  // Product Form Modal state (Add / Edit)
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [productFormData, setProductFormData] = useState({
    name: '',
    category: 'table',
    room: 'living-room',
    price: '',
    originalPrice: '',
    badge: '',
    bg: 'var(--surface)',
    iconType: 'table',
    image: '',
    image2: '',
    image3: '',
    image4: '',
    description: '',
    dimensions: '3ft x 2ft x 2.5ft',
    material: 'Melamine-faced board with PVC edge banding',
    warranty: '2 Years Warranty',
    finish: 'Walnut Woodgrain Finish'
  });

  // Promo Form Modal state
  const [isPromoFormOpen, setIsPromoFormOpen] = useState(false);
  const [promoFormData, setPromoFormData] = useState({
    badge: ' SPECIAL PROMOTION',
    title: '',
    subtitle: '',
    discountPill: '15% OFF',
    buttonText: 'Shop Special Deal',
    linkAnchor: '#shop',
    theme: 'walnut-gold',
    artType: 'living-set',
    layoutDirection: 'normal'
  });

  if (!isAdminPanelOpen || !currentUser || currentUser.role !== 'ADMIN') return null;

  // Advanced Store & Customer Analytics Math
  const totalRevenue = ordersDb.reduce((acc, order) => acc + (order.totalAmount || 0), 0);
  const avgOrderValue = ordersDb.length > 0 ? Math.round(totalRevenue / ordersDb.length) : 0;
  const pendingOrdersCount = ordersDb.filter(o => o.status === 'Placed').length;
  const confirmedOrdersCount = ordersDb.filter(o => o.status === 'Confirmed').length;
  const shippedOrdersCount = ordersDb.filter(o => o.status === 'Shipped').length;
  const deliveredOrdersCount = ordersDb.filter(o => o.status === 'Delivered').length;
  const bkashNagadOrdersCount = ordersDb.filter(o => ['bKash', 'Nagad'].includes(o.paymentMethod)).length;

  // Payment Breakdown
  const bkashOrders = ordersDb.filter(o => o.paymentMethod === 'bKash');
  const nagadOrders = ordersDb.filter(o => o.paymentMethod === 'Nagad');
  const codOrders = ordersDb.filter(o => !['bKash', 'Nagad'].includes(o.paymentMethod));

  const bkashRev = bkashOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  const nagadRev = nagadOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  const codRev = codOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

  // Top Products Sold Breakdown
  const productSalesMap = {};
  ordersDb.forEach(o => {
    (o.items || []).forEach(item => {
      const pName = item.product?.name || item.name || 'Furniture Item';
      const pId = item.product?.id || item.id || pName;
      const qty = item.quantity || 1;
      const itemPrice = item.product?.price || item.price || 0;
      const rev = itemPrice * qty;

      if (!productSalesMap[pId]) {
        productSalesMap[pId] = { id: pId, name: pName, units: 0, revenue: 0 };
      }
      productSalesMap[pId].units += qty;
      productSalesMap[pId].revenue += rev;
    });
  });

  const topProductsList = Object.values(productSalesMap).sort((a, b) => b.units - a.units);

  // Customer Analytics & Sorted Leaderboard
  const customerStatsList = (usersDb || []).map(user => {
    const userOrders = ordersDb.filter(
      o => o.userId === user.id ||
           (o.phone && o.phone === user.phone) ||
           (o.customerName && user.name && o.customerName.toLowerCase() === user.name.toLowerCase()) ||
           (o.customerName && user.email && o.customerName.toLowerCase() === user.email.toLowerCase())
    );
    const totalSpent = userOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    const orderCount = userOrders.length;
    const avgOrder = orderCount > 0 ? Math.round(totalSpent / orderCount) : 0;
    
    // Most used payment method
    const paymentCounts = {};
    userOrders.forEach(o => {
      const p = o.paymentMethod || 'COD';
      paymentCounts[p] = (paymentCounts[p] || 0) + 1;
    });
    let preferredPayment = 'COD';
    let maxP = 0;
    Object.entries(paymentCounts).forEach(([method, cnt]) => {
      if (cnt > maxP) {
        maxP = cnt;
        preferredPayment = method;
      }
    });

    return {
      ...user,
      orderCount,
      totalSpent,
      avgOrder,
      preferredPayment
    };
  });

  const sortedCustomerStats = [...customerStatsList].sort((a, b) => {
    if (analyticsCustomerSort === 'spent-desc') return b.totalSpent - a.totalSpent;
    if (analyticsCustomerSort === 'spent-asc') return a.totalSpent - b.totalSpent;
    if (analyticsCustomerSort === 'orders-desc') return b.orderCount - a.orderCount;
    if (analyticsCustomerSort === 'name-asc') return (a.name || '').localeCompare(b.name || '');
    return 0;
  });

  const handleImageFileChange = async (e, fieldName = 'image') => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const res = await api.uploadImage(file);
      if (res && res.url) {
        setProductFormData((prev) => ({ ...prev, [fieldName]: res.url }));
        console.info(`[Cloudinary Upload] Image uploaded successfully for ${fieldName}:`, res.url);
      }
    } catch (err) {
      alert(`Image upload failed: ${err.message}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleOpenAddProduct = () => {
    setEditingProductId(null);
    setProductFormData({
      name: '',
      category: 'table',
      room: 'living-room',
      price: '',
      originalPrice: '',
      badge: '',
      bg: 'var(--surface)',
      iconType: 'table',
      image: '',
      image2: '',
      image3: '',
      image4: '',
      description: '',
      dimensions: '3ft x 2ft x 2.5ft',
      material: 'Melamine-faced board with PVC edge banding',
      warranty: '2 Years Warranty',
      finish: 'Walnut Woodgrain Finish'
    });
    setIsProductFormOpen(true);
  };

  const handleOpenEditProduct = (prod) => {
    setEditingProductId(prod.id);
    const extraImgs = Array.isArray(prod.images) ? prod.images.slice(1) : [];
    setProductFormData({
      name: prod.name,
      category: prod.category,
      room: prod.room,
      price: prod.price,
      originalPrice: prod.originalPrice || '',
      badge: prod.badge || '',
      bg: prod.bg || 'var(--surface)',
      iconType: prod.iconType || 'table',
      image: prod.image || '',
      image2: prod.image2 || extraImgs[0] || '',
      image3: prod.image3 || extraImgs[1] || '',
      image4: prod.image4 || extraImgs[2] || '',
      description: prod.description || '',
      dimensions: prod.specs?.dimensions || '3ft x 2ft x 2.5ft',
      material: prod.specs?.material || 'Melamine board',
      warranty: prod.specs?.warranty || '2 Years Warranty',
      finish: prod.specs?.finish || 'Woodgrain Finish'
    });
    setIsProductFormOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productFormData.name || !productFormData.price || !productFormData.description) {
      alert('Please fill in product name, price, and description.');
      return;
    }

    const extraImages = [
      productFormData.image2,
      productFormData.image3,
      productFormData.image4
    ].filter(Boolean);

    const payload = {
      ...productFormData,
      image: productFormData.image || '',
      image2: productFormData.image2 || '',
      image3: productFormData.image3 || '',
      image4: productFormData.image4 || '',
      images: [productFormData.image, ...extraImages].filter(Boolean),
      price: Number(productFormData.price),
      originalPrice: productFormData.originalPrice ? Number(productFormData.originalPrice) : null,
      specs: {
        dimensions: productFormData.dimensions,
        material: productFormData.material,
        warranty: productFormData.warranty,
        finish: productFormData.finish
      }
    };

    try {
      if (editingProductId) {
        await updateProduct(editingProductId, payload);
      } else {
        await addProduct(payload);
      }
      setIsProductFormOpen(false);
    } catch (err) {
      alert(`Failed to save product: ${err.message}`);
    }
  };

  const handleSavePromo = async (e) => {
    e.preventDefault();
    if (!promoFormData.title || !promoFormData.subtitle) {
      alert('Please fill in promo banner title and subtitle.');
      return;
    }

    try {
      await addPromo(promoFormData);
      setIsPromoFormOpen(false);
    } catch (err) {
      alert(`Failed to create promo poster: ${err.message}`);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.categoryName.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className={`modal-backdrop admin-modal-backdrop ${isAdminPanelOpen ? 'open' : ''}`} onClick={() => setIsAdminPanelOpen(false)}>
      <div className="modal-box admin-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Admin Header */}
        <div className="admin-modal-header">
          <div className="admin-title-badge">
            <span className="admin-kicker">ADMINISTRATION DASHBOARD</span>
            <h2> Store Management Panel</h2>
            <span className="admin-user-tag">Logged in as {currentUser?.name || 'Admin Master'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              className="admin-tab-btn"
              onClick={() => {
                setActiveTab('visitors');
                setSelectedUserId(null);
              }}
              style={{
                background: 'var(--oak-light)',
                color: 'var(--walnut)',
                borderColor: 'var(--walnut)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              title="Click to view visitor locations & browsing logs"
            >
              <span></span>
              Total Visits: <strong>{visitorLogs.length}</strong>
            </button>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setIsAdminPanelOpen(false)}
              aria-label="Close Admin Panel"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="admin-tabs">
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => { setActiveTab('analytics'); setSelectedUserId(null); }}
          >
             Analytics & Overview
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => { setActiveTab('products'); setSelectedUserId(null); }}
          >
             Products ({products.length})
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'promos' ? 'active' : ''}`}
            onClick={() => { setActiveTab('promos'); setSelectedUserId(null); }}
          >
             Home Banners ({promos.length})
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => { setActiveTab('orders'); setSelectedUserId(null); }}
          >
             Orders ({ordersDb.length})
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => { setActiveTab('users'); setSelectedUserId(null); }}
          >
             Users List ({(usersDb || []).length})
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'visitors' ? 'active' : ''}`}
            onClick={() => { setActiveTab('visitors'); setSelectedUserId(null); }}
          >
             Visitor Traffic ({visitorLogs.length})
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'delivery' ? 'active' : ''}`}
            onClick={() => { setActiveTab('delivery'); setSelectedUserId(null); }}
          >
            🚚 Delivery Areas ({deliveryAreas.length})
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'inquiries' ? 'active' : ''}`}
            onClick={() => { setActiveTab('inquiries'); setSelectedUserId(null); }}
          >
            📐 Custom Inquiries ({inquiries.length})
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'themes' ? 'active' : ''}`}
            onClick={() => { setActiveTab('themes'); setSelectedUserId(null); }}
          >
            Architecture & Themes Section
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'banner' ? 'active' : ''}`}
            onClick={() => { setActiveTab('banner'); setSelectedUserId(null); }}
          >
            Native Banner (320x50)
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => { setActiveTab('settings'); setSelectedUserId(null); }}
          >
            Settings
          </button>

        </div>

        {/* Tab Content 1: Analytics & Store Insights */}
        {activeTab === 'analytics' && (
          <div className="admin-tab-content">
            {/* KPI Grid (6 Cards) */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <span className="stat-label">TOTAL STORE REVENUE</span>
                <span className="stat-value">৳{totalRevenue.toLocaleString()}</span>
                <span className="stat-sub">From {ordersDb.length} completed transactions</span>
              </div>
              <div className="admin-stat-card">
                <span className="stat-label">AVERAGE ORDER VALUE (AOV)</span>
                <span className="stat-value">৳{avgOrderValue.toLocaleString()}</span>
                <span className="stat-sub">Average spend per purchase</span>
              </div>
              <div className="admin-stat-card">
                <span className="stat-label">REGISTERED CUSTOMERS</span>
                <span className="stat-value">{(usersDb || []).length} Accounts</span>
                <span className="stat-sub">Active registered user profiles</span>
              </div>
              <div className="admin-stat-card">
                <span className="stat-label">CATALOG INVENTORY</span>
                <span className="stat-value">{products.length} Products</span>
                <span className="stat-sub">{categoriesList.length - 1} Categories across {roomsList.length} Rooms</span>
              </div>
              <div className="admin-stat-card">
                <span className="stat-label">PENDING VERIFICATION</span>
                <span className="stat-value">{pendingOrdersCount} Orders</span>
                <span className="stat-sub">{bkashNagadOrdersCount} bKash / Nagad TrxID checks</span>
              </div>
              <div className="admin-stat-card">
                <span className="stat-label">COMPLETED DELIVERIES</span>
                <span className="stat-value">{deliveredOrdersCount} Delivered</span>
                <span className="stat-sub">{shippedOrdersCount} currently in transit</span>
              </div>
            </div>

            {/* Pipeline & Payment Breakdown Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginTop: '24px' }}>
              {/* Order Status Pipeline */}
              <div className="admin-stat-card" style={{ padding: '24px' }}>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--ink)' }}>
                   Order Status Pipeline
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Placed (Pending Verification)', count: pendingOrdersCount, color: '#F59E0B' },
                    { label: 'Confirmed (Payment Verified)', count: confirmedOrdersCount, color: '#3B82F6' },
                    { label: 'Shipped (In Transit)', count: shippedOrdersCount, color: '#8B5CF6' },
                    { label: 'Delivered (Completed)', count: deliveredOrdersCount, color: '#10B981' }
                  ].map((stage, idx) => {
                    const pct = ordersDb.length > 0 ? Math.round((stage.count / ordersDb.length) * 100) : 0;
                    return (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '500' }}>{stage.label}</span>
                          <strong>{stage.count} ({pct}%)</strong>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'var(--line)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: stage.color, transition: 'width 0.3s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Gateway Distribution */}
              <div className="admin-stat-card" style={{ padding: '24px' }}>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--ink)' }}>
                   Payment Gateway Revenue Breakdown
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    { name: 'bKash Mobile Banking', count: bkashOrders.length, rev: bkashRev, color: '#E2136E' },
                    { name: 'Nagad Mobile Banking', count: nagadOrders.length, rev: nagadRev, color: '#F7931E' },
                    { name: 'Cash on Delivery (COD)', count: codOrders.length, rev: codRev, color: 'var(--walnut)' }
                  ].map((pm, idx) => {
                    const pct = totalRevenue > 0 ? Math.round((pm.rev / totalRevenue) * 100) : 0;
                    return (
                      <div key={idx} style={{ padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ display: 'block', fontSize: '0.9rem', color: pm.color }}>{pm.name}</strong>
                            <span style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>{pm.count} orders placed</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <strong style={{ fontSize: '0.98rem' }}>৳{pm.rev.toLocaleString()}</strong>
                            <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>{pct}% of sales</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Customer Analytics & Sorting Leaderboard Section */}
            <div style={{ marginTop: '28px' }}>
              <div className="admin-toolbar" style={{ marginBottom: '16px' }}>
                <div>
                  <h4 style={{ fontSize: '1.2rem', color: 'var(--ink)' }}>
                     Customer Order Analytics & Leaderboard
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', marginTop: '2px' }}>
                    Gather customer purchase history, total lifetime spend, and transaction frequency.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--ink-soft)' }}>Sort By:</label>
                  <select
                    className="admin-status-select"
                    value={analyticsCustomerSort}
                    onChange={(e) => setAnalyticsCustomerSort(e.target.value)}
                    style={{ padding: '8px 14px', borderRadius: '0' }}
                  >
                    <option value="spent-desc"> Highest Total Spent</option>
                    <option value="spent-asc"> Lowest Total Spent</option>
                    <option value="orders-desc"> Most Orders Placed</option>
                    <option value="name-asc"> Customer Name (A-Z)</option>
                  </select>
                </div>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Rank & Customer</th>
                      <th>Role</th>
                      <th>Total Orders</th>
                      <th>Total Lifetime Spend</th>
                      <th>Avg Order Value</th>
                      <th>Preferred Payment</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCustomerStats.map((cust, index) => {
                      const isExpanded = !!expandedRowIds[`cust-${cust.id}`];
                      return (
                        <tr key={cust.id} className={isExpanded ? 'row-expanded' : ''}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{
                                fontWeight: '700',
                                fontSize: '0.85rem',
                                color: index === 0 ? '#D97706' : index === 1 ? '#4B5563' : index === 2 ? '#B45309' : 'var(--ink-soft)',
                                width: '20px'
                              }}>
                                #{index + 1}
                              </span>
                              <div style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '50%',
                                background: cust.role === 'ADMIN' ? 'var(--walnut)' : 'var(--oak-light)',
                                color: cust.role === 'ADMIN' ? 'var(--paper)' : 'var(--walnut)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.88rem',
                                fontWeight: '700',
                                flexShrink: 0
                              }}>
                                {cust.name?.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <div>
                                <strong style={{ display: 'block', color: 'var(--ink)' }}>{cust.name}</strong>
                                <span className="table-subid">{cust.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="col-desktop">
                            <span
                              className="admin-badge-pill"
                              style={{
                                background: cust.role === 'ADMIN' ? 'var(--oak-light)' : 'var(--sage-light)',
                                color: cust.role === 'ADMIN' ? 'var(--walnut)' : 'var(--ink)'
                              }}
                            >
                              {cust.role === 'ADMIN' ? ' ADMIN' : ' USER'}
                            </span>
                          </td>
                          <td>
                            <strong>{cust.orderCount}</strong> orders
                          </td>
                          <td>
                            <strong>৳{cust.totalSpent.toLocaleString()}</strong>
                          </td>
                          <td className="col-desktop">
                            ৳{cust.avgOrder.toLocaleString()}
                          </td>
                          <td className="col-desktop">
                            <span className={`payment-tag ${['bKash', 'Nagad'].includes(cust.preferredPayment) ? 'm-banking' : 'cod'}`}>
                              {cust.preferredPayment}
                            </span>
                          </td>
                          <td>
                            {isExpanded && (
                              <div className="mobile-row-details-box">
                                <div className="detail-item"><strong>Role:</strong> {cust.role}</div>
                                <div className="detail-item"><strong>Avg Order Value:</strong> ৳{cust.avgOrder.toLocaleString()}</div>
                                <div className="detail-item"><strong>Preferred Payment:</strong> {cust.preferredPayment}</div>
                              </div>
                            )}

                            <div className="action-btns-group">
                              <button
                                type="button"
                                className="btn-action-edit"
                                onClick={() => {
                                  setActiveTab('users');
                                  setSelectedUserId(cust.id);
                                }}
                              >
                                View
                              </button>
                              <button
                                type="button"
                                className="btn-row-details"
                                onClick={() => toggleRowExpand(`cust-${cust.id}`)}
                              >
                                {isExpanded ? 'Hide ▲' : 'Details ▼'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Selling Products Leaderboard */}
            {topProductsList.length > 0 && (
              <div style={{ marginTop: '28px' }}>
                <h4 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--ink)' }}>
                   Bestselling Furniture Products (By Sales Volume)
                </h4>
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Product Name</th>
                        <th>Units Sold</th>
                        <th>Total Gross Revenue</th>
                        <th>Revenue Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProductsList.map((prod, index) => {
                        const sharePct = totalRevenue > 0 ? Math.round((prod.revenue / totalRevenue) * 100) : 0;
                        return (
                          <tr key={prod.id}>
                            <td>
                              <span style={{ fontWeight: '700', color: index === 0 ? '#D97706' : 'var(--ink-soft)' }}>
                                #{index + 1}
                              </span>
                            </td>
                            <td>
                              <strong>{prod.name}</strong>
                            </td>
                            <td>
                              <strong>{prod.units}</strong> units
                            </td>
                            <td>
                              <strong>৳{prod.revenue.toLocaleString()}</strong>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ flex: 1, height: '6px', background: 'var(--line)', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ width: `${sharePct}%`, height: '100%', background: 'var(--walnut)' }} />
                                </div>
                                <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>{sharePct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Reset Action */}
            <div className="admin-action-row" style={{ marginTop: '28px', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
              <button
                type="button"
                className="btn-admin-secondary"
                onClick={() => {
                  if (confirm('Reset all products and banners to default seed data?')) {
                    resetProductsToDefault();
                  }
                }}
              >
                 Reset Products & Banners to Defaults
              </button>
            </div>
          </div>
        )}

        {/* Tab Content 2: Product Management */}
        {activeTab === 'products' && (
          <div className="admin-tab-content">
            <div className="admin-toolbar">
              <div className="search-box admin-search-box">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  placeholder="Search products..."
                  className="admin-search-input"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="btn-admin-primary"
                onClick={handleOpenAddProduct}
              >
                + Add New Furniture Product
              </button>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Room</th>
                    <th>Price</th>
                    <th>Badge</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((prod) => {
                    const isExpanded = !!expandedRowIds[`prod-${prod.id}`];
                    return (
                      <tr key={prod.id} className={isExpanded ? 'row-expanded' : ''}>
                        <td className="table-product-cell">
                          <div className="table-thumb" style={{ background: prod.bg }}>
                            <ProductIcon type={prod.iconType} image={prod.image} alt={prod.name} />
                          </div>
                          <div>
                            <strong>{prod.name}</strong>
                            <span className="table-subid">ID: {prod.id}</span>
                          </div>
                        </td>
                        <td className="col-desktop">{prod.categoryName}</td>
                        <td className="col-desktop">{prod.roomName}</td>
                        <td>
                          <strong>৳{prod.price.toLocaleString()}</strong>
                          {prod.originalPrice && <span className="price-strike"> ৳{prod.originalPrice.toLocaleString()}</span>}
                        </td>
                        <td className="col-desktop">
                          {prod.badge ? <span className="admin-badge-pill">{prod.badge}</span> : <span className="text-muted">—</span>}
                        </td>
                        <td>
                          {isExpanded && (
                            <div className="mobile-row-details-box">
                              <div className="detail-item"><strong>Category:</strong> {prod.categoryName}</div>
                              <div className="detail-item"><strong>Room:</strong> {prod.roomName}</div>
                              <div className="detail-item"><strong>Badge:</strong> {prod.badge || 'None'}</div>
                              {prod.originalPrice && <div className="detail-item"><strong>Original Price:</strong> ৳{prod.originalPrice.toLocaleString()}</div>}
                              {prod.description && <div className="detail-item"><strong>Description:</strong> {prod.description}</div>}
                            </div>
                          )}

                          <div className="action-btns-group">
                            <button
                              type="button"
                              className="btn-action-edit"
                              onClick={() => handleOpenEditProduct(prod)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn-action-delete"
                              onClick={() => {
                                if (confirm(`Delete "${prod.name}"?`)) {
                                  deleteProduct(prod.id);
                                }
                              }}
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              className="btn-row-details"
                              onClick={() => toggleRowExpand(`prod-${prod.id}`)}
                            >
                              {isExpanded ? 'Hide ▲' : 'Details ▼'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content 3: Home Banner Management */}
        {activeTab === 'promos' && (
          <div className="admin-tab-content">
            <div className="admin-toolbar">
              <h3>Home Page Z-Pattern Promotional Posters</h3>
              <button
                type="button"
                className="btn-admin-primary"
                onClick={() => setIsPromoFormOpen(true)}
              >
                + Add New Promo Poster
              </button>
            </div>

            <div className="admin-promos-grid">
              {promos.map((p) => (
                <div key={p.id} className={`admin-promo-card ${p.theme}`}>
                  <div className="promo-card-top">
                    <span className="promo-badge">{p.badge}</span>
                    <span className="promo-discount-pill">{p.discountPill}</span>
                  </div>
                  <h4>{p.title}</h4>
                  <p>{p.subtitle}</p>
                  <div className="promo-card-footer">
                    <span className="promo-direction-tag">Direction: {p.layoutDirection}</span>
                    <button
                      type="button"
                      className="btn-action-delete"
                      onClick={() => deletePromo(p.id)}
                    >
                      Delete Poster
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content 4: Orders & TrxID Verification */}
        {activeTab === 'orders' && (
          <div className="admin-tab-content">
            {/* Orders Toolbar: Live Search & Status Filter */}
            <div className="admin-toolbar">
              <div className="search-box admin-search-box">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  placeholder="Search orders by ID (SLM-...), customer name, phone, TrxID, or item..."
                  className="admin-search-input"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
              </div>
              <select
                className="admin-status-select"
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                style={{ padding: '10px 16px', borderRadius: '0' }}
              >
                <option value="all">All Order Statuses</option>
                <option value="Pending">Pending (Custom Orders)</option>
                <option value="Placed">Placed</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
              </select>
              <div style={{ fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
                Showing <strong>{ordersDb.filter((order) => {
                  const query = orderSearch.toLowerCase();
                  if (orderStatusFilter !== 'all' && order.status !== orderStatusFilter) return false;
                  if (!query) return true;
                  return (
                    order.id?.toLowerCase().includes(query) ||
                    order.customerName?.toLowerCase().includes(query) ||
                    order.phone?.includes(query) ||
                    order.address?.toLowerCase().includes(query) ||
                    order.paymentMethod?.toLowerCase().includes(query) ||
                    order.trxId?.toLowerCase().includes(query) ||
                    order.items?.some((item) => (item.product?.name || item.name || '').toLowerCase().includes(query))
                  );
                }).length}</strong> of {ordersDb.length} Orders
              </div>
            </div>

            {(() => {
              const filteredOrders = ordersDb.filter((order) => {
                const query = orderSearch.toLowerCase();
                if (orderStatusFilter !== 'all' && order.status !== orderStatusFilter) return false;
                if (!query) return true;
                return (
                  order.id?.toLowerCase().includes(query) ||
                  order.customerName?.toLowerCase().includes(query) ||
                  order.phone?.includes(query) ||
                  order.address?.toLowerCase().includes(query) ||
                  order.paymentMethod?.toLowerCase().includes(query) ||
                  order.trxId?.toLowerCase().includes(query) ||
                  order.items?.some((item) => (item.product?.name || item.name || '').toLowerCase().includes(query))
                );
              });

              if (filteredOrders.length === 0) {
                return (
                  <div style={{
                    padding: '36px 20px',
                    textAlign: 'center',
                    background: 'var(--bg)',
                    border: '1px dashed var(--line)',
                    borderRadius: '12px',
                    color: 'var(--ink-soft)'
                  }}>
                    <p style={{ fontSize: '1rem', fontWeight: '500' }}>No orders found matching "{orderSearch}".</p>
                    <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Try searching with a different order ID, phone number, or customer name.</p>
                  </div>
                );
              }

              return (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer & Phone</th>
                        <th>Payment Method</th>
                        <th>TrxID / Verification</th>
                        <th>Total</th>
                        <th>Status Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => {
                        const isExpanded = !!expandedRowIds[`order-${order.id}`];
                        const isCustomOrder = Boolean(order.customInquiryId || order.items?.some(i => i.product?.isCustom));
                        return (
                          <tr key={order.id} className={isExpanded ? 'row-expanded' : ''}>
                            <td>
                              <strong>{order.id}</strong>
                              <div className="table-subid">{new Date(order.createdAt).toLocaleDateString()}</div>
                              {isCustomOrder && (
                                <div style={{ marginTop: '4px' }}>
                                  <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.04em', background: '#FEF3C7', color: '#92400E', padding: '2px 6px', borderRadius: '4px', border: '1px solid #FCD34D', display: 'inline-block' }}>
                                    BESPOKE COMMISSION
                                  </span>
                                </div>
                              )}
                            </td>
                            <td>
                              <div><strong>{order.customerName}</strong></div>
                              <div className="table-subid">{order.phone}</div>
                              <div className="col-desktop table-subid" style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>{order.address}</div>
                            </td>
                            <td className="col-desktop">
                              <span className={`payment-tag ${['bKash', 'Nagad'].includes(order.paymentMethod) ? 'm-banking' : 'cod'}`}>
                                {order.paymentMethod}
                              </span>
                            </td>
                            <td className="col-desktop">
                              {['bKash', 'Nagad'].includes(order.paymentMethod) ? (
                                <div className="trx-copy-group">
                                  <span className="trx-code">{order.trxId || 'No TrxID Entered'}</span>
                                  {order.trxId && (
                                    <button
                                      type="button"
                                      className="btn-copy-mini"
                                      onClick={() => {
                                        navigator.clipboard.writeText(order.trxId);
                                        alert(`TrxID "${order.trxId}" copied!`);
                                      }}
                                    >
                                      Copy
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted">COD Advance Charge</span>
                              )}
                            </td>
                            <td>
                              <strong>৳{(order.totalAmount || 0).toLocaleString()}</strong>
                              <div className="table-subid">{order.items?.length || 0} items</div>
                            </td>
                            <td>
                              {isExpanded && (
                                <div className="mobile-row-details-box">
                                  <div className="detail-item"><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</div>
                                  <div className="detail-item"><strong>Shipping Address:</strong> {order.address || 'N/A'}</div>
                                  <div className="detail-item">
                                    <strong>Payment Method:</strong> {order.paymentMethod}
                                    {order.trxId && (
                                      <span style={{ marginLeft: '6px' }}>
                                        (TrxID: <code>{order.trxId}</code>)
                                        <button
                                          type="button"
                                          className="btn-copy-mini"
                                          style={{ marginLeft: '6px' }}
                                          onClick={() => {
                                            navigator.clipboard.writeText(order.trxId);
                                            alert(`TrxID "${order.trxId}" copied!`);
                                          }}
                                        >
                                          Copy
                                        </button>
                                      </span>
                                    )}
                                  </div>
                                  <div className="detail-item">
                                    <strong>Items Purchased ({order.items?.length || 0}):</strong>
                                    <div style={{ marginTop: '4px', paddingLeft: '8px' }}>
                                      {order.items?.map((item, idx) => (
                                        <div key={idx} style={{ marginBottom: '4px' }}>
                                          • {item.product?.name || item.name} x {item.quantity} (৳{(item.price || item.product?.price || 0) * item.quantity})
                                          {item.product?.dimensions && (
                                            <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', paddingLeft: '10px' }}>
                                              Dimensions: {item.product.dimensions}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div style={{ marginTop: '8px' }}>
                                    <button
                                      type="button"
                                      className="btn-copy-mini"
                                      style={{ background: '#F8F6F2', border: '1px solid #C9A876', color: '#4A2C19', fontWeight: 600, padding: '6px 12px' }}
                                      onClick={() => {
                                        const targetId = order.orderNumber || order.id || order._id;
                                        window.open(api.getOrderReceiptUrl(targetId), '_blank');
                                      }}
                                    >
                                      Print PDF Receipt
                                    </button>
                                  </div>
                                </div>
                              )}

                              <div className="action-btns-group">
                                <select
                                  value={order.status}
                                  className="admin-status-select"
                                  style={{
                                    fontWeight: 600,
                                    background: order.status === 'Pending' ? '#FEF3C7' : undefined,
                                    color: order.status === 'Pending' ? '#92400E' : undefined
                                  }}
                                  onChange={async (e) => {
                                    const newSt = e.target.value;
                                    try {
                                      await updateOrderStatus(order.id, newSt);
                                    } catch (err) {
                                      alert(`Order status update failed: ${err.message}`);
                                    }
                                  }}
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Placed">Placed</option>
                                  <option value="Confirmed">Confirmed</option>
                                  <option value="Shipped">Shipped</option>
                                  <option value="Delivered">Delivered</option>
                                </select>
                                <button
                                  type="button"
                                  className="btn-row-details"
                                  onClick={() => toggleRowExpand(`order-${order.id}`)}
                                >
                                  {isExpanded ? 'Hide ▲' : 'Details ▼'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        )}

        {/* Tab Content 5: Users List & User Details */}
        {activeTab === 'users' && (
          <div className="admin-tab-content">
            {selectedUserId ? (
              /* User Details & Orders View */
              (() => {
                const selectedUser = (usersDb || []).find(u => u.id === selectedUserId);
                if (!selectedUser) {
                  return (
                    <div>
                      <button
                        type="button"
                        className="btn-admin-secondary"
                        onClick={() => setSelectedUserId(null)}
                        style={{ marginBottom: '16px' }}
                      >
                        ← Back to Users List
                      </button>
                      <p>User not found.</p>
                    </div>
                  );
                }

                const userOrders = ordersDb.filter(
                  o => o.userId === selectedUser.id ||
                       (o.phone && o.phone === selectedUser.phone) ||
                       (o.customerName && selectedUser.name && o.customerName.toLowerCase() === selectedUser.name.toLowerCase()) ||
                       (o.customerName && selectedUser.email && o.customerName.toLowerCase() === selectedUser.email.toLowerCase())
                );

                const totalUserSpent = userOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

                return (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                      <button
                        type="button"
                        className="btn-admin-secondary"
                        onClick={() => setSelectedUserId(null)}
                      >
                        ← Back to Users List
                      </button>
                      <span className="admin-badge-pill" style={{
                        background: selectedUser.role === 'ADMIN' ? 'var(--oak-light)' : 'var(--sage-light)',
                        color: selectedUser.role === 'ADMIN' ? 'var(--walnut)' : 'var(--ink)'
                      }}>
                        {selectedUser.role === 'ADMIN' ? ' Admin Account' : ' Customer Account'}
                      </span>
                    </div>

                    {/* User Profile Card */}
                    <div className="admin-stat-card" style={{ marginBottom: '20px', padding: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{
                          width: '54px',
                          height: '54px',
                          borderRadius: '50%',
                          background: selectedUser.role === 'ADMIN' ? 'var(--walnut)' : 'var(--oak-light)',
                          color: selectedUser.role === 'ADMIN' ? 'var(--paper)' : 'var(--walnut)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.4rem',
                          fontWeight: '700'
                        }}>
                          {selectedUser.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <h3 style={{ fontSize: '1.4rem', color: 'var(--ink)' }}>{selectedUser.name}</h3>
                            <span
                              className="admin-badge-pill"
                              style={{
                                background: (selectedUser.status === 'Approved' || selectedUser.role === 'ADMIN' || selectedUser.isVerified) ? '#D1FAE5' : selectedUser.status === 'Rejected' ? '#FEE2E2' : '#FEF3C7',
                                color: (selectedUser.status === 'Approved' || selectedUser.role === 'ADMIN' || selectedUser.isVerified) ? '#065F46' : selectedUser.status === 'Rejected' ? '#991B1B' : '#92400E',
                                fontWeight: '600'
                              }}
                            >
                              {(selectedUser.status === 'Approved' || selectedUser.role === 'ADMIN' || selectedUser.isVerified) ? ' Approved' : selectedUser.status === 'Rejected' ? ' Rejected' : ' Pending Admin Approval'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '6px', fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
                            <span> {selectedUser.email}</span>
                            <span> {selectedUser.phone || 'N/A'}</span>
                            <span> {selectedUser.id}</span>
                          </div>
                          {selectedUser.address && (
                            <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
                               <strong>Shipping Address:</strong> {selectedUser.address}
                            </div>
                          )}
                        </div>
                        {selectedUser.role !== 'ADMIN' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {selectedUser.status !== 'Approved' && (
                              <button
                                type="button"
                                className="btn-admin-primary"
                                onClick={() => updateUserStatus(selectedUser.id, 'Approved')}
                                style={{ background: '#065F46', fontSize: '0.82rem' }}
                              >
                                 Approve Registration
                              </button>
                            )}
                            {selectedUser.status !== 'Rejected' && (
                              <button
                                type="button"
                                className="btn-action-delete"
                                onClick={() => updateUserStatus(selectedUser.id, 'Rejected')}
                                style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                              >
                                 Reject
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats Summary Row for User */}
                    <div className="admin-stats-grid" style={{ marginBottom: '24px' }}>
                      <div className="admin-stat-card">
                        <span className="stat-label">TOTAL ORDERS PLACED</span>
                        <span className="stat-value">{userOrders.length} Orders</span>
                        <span className="stat-sub">Lifetime orders by this customer</span>
                      </div>
                      <div className="admin-stat-card">
                        <span className="stat-label">TOTAL SPENT AMOUNT</span>
                        <span className="stat-value">৳{totalUserSpent.toLocaleString()}</span>
                        <span className="stat-sub">Combined total order value</span>
                      </div>
                      <div className="admin-stat-card">
                        <span className="stat-label">ACCOUNT TYPE & ROLE</span>
                        <span className="stat-value" style={{ textTransform: 'capitalize' }}>{selectedUser.role || 'USER'}</span>
                        <span className="stat-sub">System privilege level</span>
                      </div>
                    </div>

                    {/* User Orders Table */}
                    <h4 style={{ fontSize: '1.2rem', marginBottom: '12px', color: 'var(--ink)' }}>
                       Order History for {selectedUser.name} ({userOrders.length})
                    </h4>

                    {userOrders.length === 0 ? (
                      <div style={{
                        padding: '36px 20px',
                        textAlign: 'center',
                        background: 'var(--bg)',
                        border: '1px dashed var(--line)',
                        borderRadius: '12px',
                        color: 'var(--ink-soft)'
                      }}>
                        <p style={{ fontSize: '1rem', fontWeight: '500' }}>No orders found for this user yet.</p>
                        <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>When this user places orders, they will appear here automatically.</p>
                      </div>
                    ) : (
                      <div className="admin-table-container">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Order ID</th>
                              <th>Date</th>
                              <th>Payment</th>
                              <th>Items Purchased</th>
                              <th>Total Amount</th>
                              <th>Order Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userOrders.map((order) => (
                              <tr key={order.id}>
                                <td>
                                  <strong>{order.id}</strong>
                                </td>
                                <td>
                                  {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  }) : 'Recent'}
                                </td>
                                <td>
                                  <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{order.paymentMethod || 'Cash on Delivery'}</span>
                                  {order.trxId && (
                                    <div className="table-subid">
                                      TrxID: <strong>{order.trxId}</strong>
                                    </div>
                                  )}
                                </td>
                                <td>
                                  <div style={{ fontSize: '0.85rem' }}>
                                    {order.items?.map((item, idx) => (
                                      <div key={idx}>
                                        • {item.product?.name || item.name} x {item.quantity}
                                      </div>
                                    )) || <span className="text-muted">No details</span>}
                                  </div>
                                </td>
                                <td>
                                  <strong>৳{(order.totalAmount || 0).toLocaleString()}</strong>
                                </td>
                                <td>
                                  <select
                                    value={order.status}
                                    className="admin-status-select"
                                    onChange={async (e) => {
                                      const newSt = e.target.value;
                                      try {
                                        await updateOrderStatus(order.id, newSt);
                                      } catch (err) {
                                        alert(`Order status update failed: ${err.message}`);
                                      }
                                    }}
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="Placed">Placed</option>
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Shipped">Shipped</option>
                                    <option value="Delivered">Delivered</option>
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              /* Users List Main View */
              <div>
                <div className="admin-toolbar">
                  <input
                    type="text"
                    placeholder="Search users by name, email, phone, role..."
                    className="admin-search-input"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                  <div style={{ fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
                    Total Registered Accounts: <strong>{(usersDb || []).length}</strong>
                  </div>
                </div>

                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User Profile</th>
                        <th>Contact Details</th>
                        <th>Role</th>
                        <th>Approval Status</th>
                        <th>Orders Made</th>
                        <th>Total Spent</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(usersDb || [])
                        .filter((user) => {
                          const query = userSearch.toLowerCase();
                          return (
                            user.name?.toLowerCase().includes(query) ||
                            user.email?.toLowerCase().includes(query) ||
                            user.phone?.includes(query) ||
                            user.role?.toLowerCase().includes(query) ||
                            user.status?.toLowerCase().includes(query) ||
                            user.id?.toLowerCase().includes(query)
                          );
                        })
                        .map((user) => {
                          const userOrders = ordersDb.filter(
                            o => o.userId === user.id ||
                                 (o.phone && o.phone === user.phone) ||
                                 (o.customerName && user.name && o.customerName.toLowerCase() === user.name.toLowerCase()) ||
                                 (o.customerName && user.email && o.customerName.toLowerCase() === user.email.toLowerCase())
                          );
                          const userSpent = userOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
                          const isAppr = user.status === 'Approved' || user.role === 'ADMIN' || user.isVerified;
                          const isRej = user.status === 'Rejected';

                          const isExpanded = !!expandedRowIds[`user-${user.id}`];

                          return (
                            <tr key={user.id} className={isExpanded ? 'row-expanded' : ''}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    background: user.role === 'ADMIN' ? 'var(--walnut)' : 'var(--oak-light)',
                                    color: user.role === 'ADMIN' ? 'var(--paper)' : 'var(--walnut)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.9rem',
                                    fontWeight: '700',
                                    flexShrink: 0
                                  }}>
                                    {user.name?.charAt(0).toUpperCase() || 'U'}
                                  </div>
                                  <div>
                                    <strong style={{ display: 'block', color: 'var(--ink)' }}>{user.name}</strong>
                                    <span className="table-subid">{user.email}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="col-desktop">
                                <div style={{ fontSize: '0.85rem' }}>{user.phone || 'N/A'}</div>
                                {user.address && (
                                  <span className="table-subid" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {user.address}
                                  </span>
                                )}
                              </td>
                              <td>
                                <span
                                  className="admin-badge-pill"
                                  style={{
                                    background: user.role === 'ADMIN' ? 'var(--oak-light)' : 'var(--sage-light)',
                                    color: user.role === 'ADMIN' ? 'var(--walnut)' : 'var(--ink)'
                                  }}
                                >
                                  {user.role === 'ADMIN' ? ' ADMIN' : ' USER'}
                                </span>
                              </td>
                              <td className="col-desktop">
                                <span
                                  className="admin-badge-pill"
                                  style={{
                                    background: isAppr ? '#D1FAE5' : isRej ? '#FEE2E2' : '#FEF3C7',
                                    color: isAppr ? '#065F46' : isRej ? '#991B1B' : '#92400E',
                                    fontWeight: '600'
                                  }}
                                >
                                  {isAppr ? ' Approved' : isRej ? ' Rejected' : ' Pending'}
                                </span>
                              </td>
                              <td className="col-desktop">
                                <strong>{userOrders.length}</strong> orders
                              </td>
                              <td className="col-desktop">
                                <strong>৳{userSpent.toLocaleString()}</strong>
                              </td>
                              <td>
                                {isExpanded && (
                                  <div className="mobile-row-details-box">
                                    <div className="detail-item"><strong>Phone:</strong> {user.phone || 'N/A'}</div>
                                    <div className="detail-item"><strong>Address:</strong> {user.address || 'N/A'}</div>
                                    <div className="detail-item"><strong>Approval Status:</strong> {user.status || 'Approved'}</div>
                                    <div className="detail-item"><strong>Orders Count:</strong> {userOrders.length} orders</div>
                                    <div className="detail-item"><strong>Total Spend:</strong> ৳{userSpent.toLocaleString()}</div>
                                  </div>
                                )}

                                <div className="action-btns-group">
                                  <button
                                    type="button"
                                    className="btn-action-edit"
                                    onClick={() => setSelectedUserId(user.id)}
                                  >
                                    Info
                                  </button>
                                  {user.role !== 'ADMIN' && (
                                    <>
                                      {user.status !== 'Approved' && (
                                        <button
                                          type="button"
                                          className="btn-action-edit"
                                          onClick={() => updateUserStatus(user.id, 'Approved')}
                                          style={{ background: '#D1FAE5', color: '#065F46', borderColor: '#A7F3D0' }}
                                        >
                                          Approve
                                        </button>
                                      )}
                                      {user.status !== 'Rejected' && (
                                        <button
                                          type="button"
                                          className="btn-action-delete"
                                          onClick={() => updateUserStatus(user.id, 'Rejected')}
                                        >
                                          Reject
                                        </button>
                                      )}
                                    </>
                                  )}
                                  <button
                                    type="button"
                                    className="btn-row-details"
                                    onClick={() => toggleRowExpand(`user-${user.id}`)}
                                  >
                                    {isExpanded ? 'Hide ▲' : 'Details ▼'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content 6: Visitor Traffic & Geolocation Logs */}
        {activeTab === 'visitors' && (
          <div className="admin-tab-content">
            {/* Traffic Overview KPI Grid */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <span className="stat-label">TOTAL STORE VISITS LOGGED</span>
                <span className="stat-value">{visitorLogs.length} Sessions</span>
                <span className="stat-sub">Tracked visitor sessions</span>
              </div>
              <div className="admin-stat-card">
                <span className="stat-label">TOP VISITOR LOCATION</span>
                <span className="stat-value">Trishal, Mymensingh</span>
                <span className="stat-sub">Primary geographic traffic source</span>
              </div>
              <div className="admin-stat-card">
                <span className="stat-label">MOBILE VS DESKTOP</span>
                <span className="stat-value">
                  {Math.round((visitorLogs.filter(v => v.device.includes('Mobile')).length / (visitorLogs.length || 1)) * 100)}% Mobile
                </span>
                <span className="stat-sub">
                  {visitorLogs.filter(v => v.device.includes('Mobile')).length} Mobile / {visitorLogs.filter(v => !v.device.includes('Mobile')).length} Desktop
                </span>
              </div>
              <div className="admin-stat-card">
                <span className="stat-label">AVG PAGES PER SESSION</span>
                <span className="stat-value">
                  {(visitorLogs.reduce((acc, v) => acc + (v.pageViews || 1), 0) / (visitorLogs.length || 1)).toFixed(1)} Pages
                </span>
                <span className="stat-sub">Average catalog engagement</span>
              </div>
            </div>

            {/* Visitors Search & Filter Toolbar */}
            <div className="admin-toolbar" style={{ marginTop: '24px' }}>
              <div className="search-box admin-search-box">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  placeholder="Search visitors by city, country, IP address, device, or browsed section..."
                  className="admin-search-input"
                  value={visitorSearch}
                  onChange={(e) => setVisitorSearch(e.target.value)}
                />
              </div>
              <select
                className="admin-status-select"
                value={visitorCityFilter}
                onChange={(e) => setVisitorCityFilter(e.target.value)}
                style={{ padding: '10px 16px', borderRadius: '0' }}
              >
                <option value="all">All Visitor Cities</option>
                {Array.from(new Set(visitorLogs.map(v => v.city))).map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <div style={{ fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
                Showing <strong>{visitorLogs.filter((v) => {
                  const query = visitorSearch.toLowerCase();
                  if (visitorCityFilter !== 'all' && v.city !== visitorCityFilter) return false;
                  if (!query) return true;
                  return (
                    v.city?.toLowerCase().includes(query) ||
                    v.country?.toLowerCase().includes(query) ||
                    v.ip?.includes(query) ||
                    v.device?.toLowerCase().includes(query) ||
                    v.browsedSection?.toLowerCase().includes(query)
                  );
                }).length}</strong> of {visitorLogs.length} Sessions
              </div>
            </div>

            {/* Visitor Sessions Table */}
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Location & City</th>
                    <th>IP Address</th>
                    <th>Device & OS</th>
                    <th>Browsed Catalog Section</th>
                    <th>Page Views</th>
                    <th>Visit Time</th>
                  </tr>
                </thead>
                <tbody>
                  {visitorLogs
                    .filter((v) => {
                      const query = visitorSearch.toLowerCase();
                      if (visitorCityFilter !== 'all' && v.city !== visitorCityFilter) return false;
                      if (!query) return true;
                      return (
                        v.city?.toLowerCase().includes(query) ||
                        v.country?.toLowerCase().includes(query) ||
                        v.ip?.includes(query) ||
                        v.device?.toLowerCase().includes(query) ||
                        v.browsedSection?.toLowerCase().includes(query)
                      );
                    })
                    .map((v) => {
                      const isExpanded = !!expandedRowIds[`vis-${v.id}`];
                      return (
                        <tr key={v.id} className={isExpanded ? 'row-expanded' : ''}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div>
                                <strong style={{ display: 'block', color: 'var(--ink)' }}>{v.city}, {v.country}</strong>
                                <span className="table-subid">Session: {v.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="col-desktop">
                            <code style={{ background: 'var(--bg)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.82rem', border: '1px solid var(--line)' }}>
                              {v.ip}
                            </code>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.85rem' }}>
                              {v.device}
                            </div>
                          </td>
                          <td className="col-desktop">
                            <span className="admin-badge-pill" style={{ background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--ink)' }}>
                              {v.browsedSection}
                            </span>
                          </td>
                          <td className="col-desktop">
                            <strong>{v.pageViews || 1}</strong> pages
                          </td>
                          <td>
                            {isExpanded && (
                              <div className="mobile-row-details-box">
                                <div className="detail-item"><strong>IP Address:</strong> <code>{v.ip}</code></div>
                                <div className="detail-item"><strong>Browsed Section:</strong> {v.browsedSection}</div>
                                <div className="detail-item"><strong>Page Views:</strong> {v.pageViews || 1} pages</div>
                                <div className="detail-item"><strong>Timestamp:</strong> {v.timestamp ? new Date(v.timestamp).toLocaleString() : 'Just now'}</div>
                              </div>
                            )}

                            <div className="action-btns-group">
                              <span style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
                                {v.timestamp ? new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                              </span>
                              <button
                                type="button"
                                className="btn-row-details"
                                onClick={() => toggleRowExpand(`vis-${v.id}`)}
                              >
                                {isExpanded ? 'Hide ▲' : 'Details ▼'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content: Custom Furniture Inquiries & Bespoke Commissions */}
        {activeTab === 'inquiries' && (
          <div className="admin-tab-content">
            {/* KPI Stats Grid */}
            <div className="admin-stats-grid" style={{ marginBottom: '24px' }}>
              <div className="admin-stat-card">
                <span className="stat-label">TOTAL INQUIRIES</span>
                <span className="stat-value">{inquiryMetrics.total || inquiries.length}</span>
                <span className="stat-sub">Lifetime bespoke requests</span>
              </div>
              <div className="admin-stat-card">
                <span className="stat-label">PENDING REVIEW</span>
                <span className="stat-value" style={{ color: '#D97706' }}>
                  {inquiryMetrics.pendingReview || inquiries.filter(i => i.status === 'Pending Review').length}
                </span>
                <span className="stat-sub">Awaiting customer callback</span>
              </div>
              <div className="admin-stat-card">
                <span className="stat-label">CONTACTED</span>
                <span className="stat-value" style={{ color: '#2563EB' }}>
                  {inquiryMetrics.contacted || inquiries.filter(i => i.status === 'Contacted').length}
                </span>
                <span className="stat-sub">Quote discussions ongoing</span>
              </div>
              <div className="admin-stat-card">
                <span className="stat-label">CONFIRMED</span>
                <span className="stat-value" style={{ color: '#16A34A' }}>
                  {inquiryMetrics.confirmed || inquiries.filter(i => i.status === 'Confirmed').length}
                </span>
                <span className="stat-sub">Orders placed in workshop</span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px' }}>
                <input
                  type="text"
                  className="editorial-input"
                  style={{ flex: 1, maxWidth: '360px' }}
                  placeholder="Search by customer name, phone, or furniture type..."
                  value={inquirySearch}
                  onChange={(e) => setInquirySearch(e.target.value)}
                />
                <select
                  className="editorial-select"
                  style={{ width: '180px' }}
                  value={inquiryStatusFilter}
                  onChange={(e) => setInquiryStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <button
                type="button"
                className="btn-editorial-ghost"
                onClick={fetchInquiries}
                disabled={isLoadingInquiries}
              >
                {isLoadingInquiries ? 'Refreshing...' : '↻ Refresh Inquiries'}
              </button>
            </div>

            {/* Inquiries Cards List */}
            {(() => {
              const filteredInquiries = inquiries.filter((inq) => {
                if (inquiryStatusFilter !== 'all' && inq.status !== inquiryStatusFilter) return false;
                if (inquirySearch.trim()) {
                  const q = inquirySearch.toLowerCase();
                  const matchName = inq.customerName?.toLowerCase().includes(q);
                  const matchPhone = inq.phone?.includes(q);
                  const matchType = inq.productType?.toLowerCase().includes(q);
                  const matchDesc = inq.customDetails?.description?.toLowerCase().includes(q);
                  if (!matchName && !matchPhone && !matchType && !matchDesc) return false;
                }
                return true;
              });

              if (filteredInquiries.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--paper)', borderRadius: '12px', border: '1px solid var(--line)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📐</div>
                    <h4 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.2rem', color: 'var(--walnut)' }}>No Custom Inquiries Found</h4>
                    <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', maxWidth: '420px', margin: '8px auto 0' }}>
                      {inquirySearch || inquiryStatusFilter !== 'all'
                        ? 'Try clearing your search query or status filter.'
                        : 'Custom furniture requests submitted by customers through the website will appear here for review and callback.'}
                    </p>
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {filteredInquiries.map((inq) => {
                    const formattedDate = inq.createdAt
                      ? new Date(inq.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : 'Recent';

                    const cleanPhone = (inq.phone || '').replace(/\D/g, '');
                    const waNumber = cleanPhone.startsWith('880') ? cleanPhone : cleanPhone.startsWith('0') ? `88${cleanPhone}` : `880${cleanPhone}`;

                    return (
                      <div
                        key={inq._id}
                        style={{
                          background: 'var(--paper)',
                          border: '1px solid var(--line)',
                          borderRadius: '12px',
                          padding: '20px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                        }}
                      >
                        {/* Header Row: ID, Date & Status */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--line)', paddingBottom: '12px', marginBottom: '16px' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--ink-soft)', textTransform: 'uppercase' }}>
                              INQUIRY #{inq._id.slice(-6).toUpperCase()} · {formattedDate}
                            </span>
                            <h4 style={{ fontSize: '1.15rem', fontFamily: 'Fraunces, serif', color: 'var(--walnut)', margin: '4px 0 0' }}>
                              {inq.productType}
                            </h4>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            {!inq.convertedOrderId && inq.status !== 'Confirmed' && (
                              <button
                                type="button"
                                style={{
                                  background: '#15803D',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '6px 12px',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                onClick={() => handleOpenConfirmModal(inq)}
                                title="Confirm inquiry and convert into a Pending workshop order"
                              >
                                Confirm & Move to Orders
                              </button>
                            )}

                            <span style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>Status:</span>
                            <select
                              value={inq.status}
                              onChange={(e) => handleUpdateInquiryStatus(inq, e.target.value)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                border: '1px solid var(--line)',
                                background: inq.status === 'Pending Review' ? '#FEF3C7' : inq.status === 'Contacted' ? '#DBEAFE' : inq.status === 'Confirmed' ? '#DCFCE7' : '#F3F4F6',
                                color: inq.status === 'Pending Review' ? '#92400E' : inq.status === 'Contacted' ? '#1E40AF' : inq.status === 'Confirmed' ? '#166534' : '#4B5563',
                                cursor: 'pointer'
                              }}
                            >
                              <option value="Pending Review">Pending Review</option>
                              <option value="Contacted">Contacted</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>

                        {/* Linked Workshop Order Banner (if confirmed/converted) */}
                        {Boolean(inq.convertedOrderId || inq.convertedOrderNumber) && (
                          <div style={{
                            background: '#F0FDF4',
                            border: '1px solid #BBF7D0',
                            borderRadius: '8px',
                            padding: '12px 16px',
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '10px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '1.25rem' }}>📦</span>
                              <div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#166534' }}>
                                  Linked Workshop Order: #{inq.convertedOrderNumber || inq.convertedOrderId?.orderNumber || 'SLM-ORDER'}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#15803D', marginTop: '2px' }}>
                                  Order Status:{' '}
                                  <strong style={{
                                    display: 'inline-block',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    background: (inq.convertedOrderId?.status === 'Delivered') ? '#DCFCE7' : (inq.convertedOrderId?.status === 'Pending') ? '#FEF3C7' : '#DBEAFE',
                                    color: (inq.convertedOrderId?.status === 'Delivered') ? '#166534' : (inq.convertedOrderId?.status === 'Pending') ? '#92400E' : '#1E40AF'
                                  }}>
                                    {inq.convertedOrderId?.status || 'Pending'}
                                  </strong>
                                  {inq.confirmedPrice ? (
                                    <span style={{ marginLeft: '8px', fontWeight: 600 }}>
                                      · Agreed Price: ৳{Number(inq.confirmedPrice).toLocaleString()}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn-editorial-ghost"
                              style={{
                                fontSize: '0.8rem',
                                padding: '6px 14px',
                                borderColor: '#16A34A',
                                color: '#166534',
                                background: '#FFFFFF',
                                cursor: 'pointer',
                                fontWeight: 600
                              }}
                              onClick={() => {
                                const targetOrderNumber = inq.convertedOrderNumber || inq.convertedOrderId?.orderNumber || '';
                                setActiveTab('orders');
                                if (targetOrderNumber) {
                                  setOrderSearch(targetOrderNumber);
                                  setOrderStatusFilter('all');
                                }
                              }}
                            >
                              Manage in Orders Tab ↗
                            </button>
                          </div>
                        )}

                        {/* Customer & Spec Details Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                          {/* Customer Contact */}
                          <div style={{ background: 'var(--surface)', padding: '12px 14px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', marginBottom: '6px' }}>
                              Customer Contact
                            </div>
                            <div style={{ fontWeight: 600, color: 'var(--walnut)', fontSize: '0.95rem' }}>
                              {inq.customerName || inq.userId?.name || 'Customer'}
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', alignItems: 'center' }}>
                              <a
                                href={`tel:${inq.phone}`}
                                style={{ color: 'var(--terracotta)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}
                              >
                                📞 {inq.phone}
                              </a>
                              {cleanPhone && (
                                <a
                                  href={`https://wa.me/${waNumber}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ background: '#25D366', color: '#fff', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', textDecoration: 'none', fontWeight: 600 }}
                                >
                                  WhatsApp
                                </a>
                              )}
                            </div>
                            {inq.email && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', marginTop: '4px' }}>
                                ✉️ {inq.email}
                              </div>
                            )}
                          </div>

                          {/* Dimensions & Sizing */}
                          <div style={{ background: 'var(--surface)', padding: '12px 14px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', marginBottom: '6px' }}>
                              Required Dimensions
                            </div>
                            <div style={{ fontWeight: 700, color: 'var(--walnut)', fontSize: '1rem', letterSpacing: '0.02em' }}>
                              {inq.dimensions?.height} (H) × {inq.dimensions?.width} (W) × {inq.dimensions?.depth} (D) {inq.dimensions?.unit || 'inch'}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '4px' }}>
                              Unit: {inq.dimensions?.unit === 'cm' ? 'Centimeters' : 'Inches'}
                            </div>
                          </div>

                          {/* Materials & Finishes (if provided) */}
                          {inq.materials && (inq.materials.woodType || inq.materials.finish || inq.materials.hardware) ? (
                            <div style={{ background: 'var(--surface)', padding: '12px 14px', borderRadius: '8px' }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', marginBottom: '6px' }}>
                                Materials & Hardware
                              </div>
                              {inq.materials.woodType && (
                                <div style={{ fontSize: '0.88rem', color: 'var(--walnut)', fontWeight: 600 }}>
                                  {inq.materials.woodType}
                                </div>
                              )}
                              {inq.materials.finish && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', marginTop: '2px' }}>
                                  Finish: {inq.materials.finish}
                                </div>
                              )}
                              {inq.materials.hardware && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', marginTop: '2px' }}>
                                  Hardware: {inq.materials.hardware}
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>


                        {/* Customer Notes / Special Requests */}
                        {inq.customDetails?.description && (
                          <div style={{ marginBottom: '16px', background: '#FBFBFA', padding: '12px 14px', borderRadius: '8px', borderLeft: '3px solid var(--terracotta)' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', marginBottom: '4px' }}>
                              Customer Special Requests & Notes:
                            </div>
                            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--ink)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                              {inq.customDetails.description}
                            </p>
                          </div>
                        )}

                        {/* Reference Images Gallery */}
                        {inq.customDetails?.referenceImages && inq.customDetails.referenceImages.length > 0 && (
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', marginBottom: '8px' }}>
                              Reference Inspiration Photos ({inq.customDetails.referenceImages.length}):
                            </div>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                              {inq.customDetails.referenceImages.map((imgUrl, imgIdx) => (
                                <div
                                  key={imgIdx}
                                  style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '6px',
                                    overflow: 'hidden',
                                    border: '1px solid var(--line)',
                                    cursor: 'pointer',
                                    position: 'relative'
                                  }}
                                  onClick={() => setActiveImagePreview(imgUrl)}
                                  title="Click to zoom reference photo"
                                >
                                  <img
                                    src={imgUrl}
                                    alt={`Ref photo ${imgIdx + 1}`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Lightbox / Zoom for Reference Images */}
            {activeImagePreview && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.85)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 99999,
                  padding: '24px'
                }}
                onClick={() => setActiveImagePreview(null)}
              >
                <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
                  <img
                    src={activeImagePreview}
                    alt="Full size reference photo"
                    style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setActiveImagePreview(null)}
                    style={{
                      position: 'absolute',
                      top: '-14px',
                      right: '-14px',
                      background: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content 7: Store Settings (MFS Accounts, Promo Banner ON/OFF, Footer Info) */}
        {activeTab === 'settings' && (

          <div className="admin-tab-content">
            <div style={{ maxWidth: '720px', margin: '0 auto', background: 'var(--paper)', padding: '28px', borderRadius: '12px', border: '1px solid var(--line)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.4rem', fontFamily: 'Fraunces, serif', color: 'var(--walnut)' }}>
                  Settings
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', marginTop: '4px' }}>
                  Manage store settings including MFS accounts, homepage promo banner visibility, and showroom contact details. Click any section to expand or collapse options.
                </p>
              </div>

              {settingsMessage && (
                <div style={{ padding: '12px 16px', borderRadius: '8px', background: '#D1FAE5', color: '#065F46', fontWeight: '600', marginBottom: '20px', border: '1px solid #A7F3D0' }}>
                  {settingsMessage}
                </div>
              )}

              <form onSubmit={handleSaveSettings}>
                {/* Collapsible Section 1: MFS Payment & Delivery Charges */}
                <div className="settings-accordion-card" style={{ marginBottom: '16px', border: '1px solid var(--line)', borderRadius: '8px', overflow: 'hidden' }}>
                  <button
                    type="button"
                    className="settings-accordion-header"
                    onClick={() => toggleSettingSection('mfs')}
                    style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'var(--bg)', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--ink)' }}>
                      MFS Payment Accounts & Delivery Charges
                    </span>
                    <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--ink-soft)' }}>
                      {openSettingSections.mfs ? '−' : '+'}
                    </span>
                  </button>

                  {openSettingSections.mfs && (
                    <div style={{ padding: '18px', background: 'var(--paper)', borderTop: '1px solid var(--line)' }}>
                      <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                          bKash Personal / Merchant Account Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={storeSettings.bkashNumber}
                          onChange={(e) => setStoreSettings({ ...storeSettings, bkashNumber: e.target.value })}
                          placeholder="e.g. 01712-345678"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '0.92rem' }}
                        />
                        <span style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '4px', display: 'block' }}>
                          This number is shown in checkout instructions & copy button when customers select bKash.
                        </span>
                      </div>

                      <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                          Nagad Personal / Merchant Account Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={storeSettings.nagadNumber}
                          onChange={(e) => setStoreSettings({ ...storeSettings, nagadNumber: e.target.value })}
                          placeholder="e.g. 01812-345678"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '0.92rem' }}
                        />
                        <span style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '4px', display: 'block' }}>
                          This number is shown in checkout instructions & copy button when customers select Nagad.
                        </span>
                      </div>

                      <div className="form-grid-2">
                        <div className="form-group">
                          <label style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                            Delivery Fee (Inside Trishal, Mymensingh - ৳)
                          </label>
                          <input
                            type="number"
                            value={storeSettings.deliveryChargeInsideDhaka}
                            onChange={(e) => setStoreSettings({ ...storeSettings, deliveryChargeInsideDhaka: Number(e.target.value) })}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)' }}
                          />
                        </div>
                        <div className="form-group">
                          <label style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                            Delivery Fee (Outside Trishal, Mymensingh - ৳)
                          </label>
                          <input
                            type="number"
                            value={storeSettings.deliveryChargeOutsideDhaka}
                            onChange={(e) => setStoreSettings({ ...storeSettings, deliveryChargeOutsideDhaka: Number(e.target.value) })}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Collapsible Section 2: Home Promo Banners Visibility Toggle */}
                <div className="settings-accordion-card" style={{ marginBottom: '16px', border: '1px solid var(--line)', borderRadius: '8px', overflow: 'hidden' }}>
                  <button
                    type="button"
                    className="settings-accordion-header"
                    onClick={() => toggleSettingSection('promos')}
                    style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'var(--bg)', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--ink)' }}>
                      Home Promo Banners Display (ON / OFF)
                    </span>
                    <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--ink-soft)' }}>
                      {openSettingSections.promos ? '−' : '+'}
                    </span>
                  </button>

                  {openSettingSections.promos && (
                    <div style={{ padding: '18px', background: 'var(--paper)', borderTop: '1px solid var(--line)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg)', borderRadius: '6px', border: '1px solid var(--line)', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ flex: 1, minWidth: '220px' }}>
                          <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--ink)' }}>
                            Promo Banners Visibility Status
                          </strong>
                          <span style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', marginTop: '2px', display: 'block' }}>
                            Turn OFF to immediately stop displaying promo banners on the homepage for store visitors.
                          </span>
                        </div>

                        <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: '10px', background: 'var(--paper)', padding: '8px 14px', borderRadius: '20px', border: '1px solid var(--line)' }}>
                          <input
                            type="checkbox"
                            checked={storeSettings.isPromoBannerEnabled}
                            onChange={(e) => setStoreSettings({ ...storeSettings, isPromoBannerEnabled: e.target.checked })}
                            style={{ width: '18px', height: '18px', accentColor: 'var(--walnut)', cursor: 'pointer' }}
                          />
                          <span style={{ fontWeight: '700', fontSize: '0.88rem', color: storeSettings.isPromoBannerEnabled ? '#065F46' : '#991B1B' }}>
                            {storeSettings.isPromoBannerEnabled ? 'ON (Visible)' : 'OFF (Hidden)'}
                          </span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Collapsible Section 3: Footer & Showroom Information */}
                <div className="settings-accordion-card" style={{ marginBottom: '16px', border: '1px solid var(--line)', borderRadius: '8px', overflow: 'hidden' }}>
                  <button
                    type="button"
                    className="settings-accordion-header"
                    onClick={() => toggleSettingSection('footer')}
                    style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'var(--bg)', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--ink)' }}>
                      Footer & Showroom Contact Information
                    </span>
                    <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--ink-soft)' }}>
                      {openSettingSections.footer ? '−' : '+'}
                    </span>
                  </button>

                  {openSettingSections.footer && (
                    <div style={{ padding: '18px', background: 'var(--paper)', borderTop: '1px solid var(--line)' }}>
                      <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                          Showroom Address *
                        </label>
                        <textarea
                          rows="2"
                          required
                          value={storeSettings.storeAddress}
                          onChange={(e) => setStoreSettings({ ...storeSettings, storeAddress: e.target.value })}
                          placeholder="e.g. Porabari Road CNG Station, Trishal, Mymensingh"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '0.92rem' }}
                        />
                      </div>

                      <div className="form-grid-2" style={{ marginBottom: '16px' }}>
                        <div className="form-group">
                          <label style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                            Opening & Closing Hours *
                          </label>
                          <input
                            type="text"
                            required
                            value={storeSettings.openingHours}
                            onChange={(e) => setStoreSettings({ ...storeSettings, openingHours: e.target.value })}
                            placeholder="e.g. Open daily, 10am–8pm"
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '0.92rem' }}
                          />
                        </div>
                        <div className="form-group">
                          <label style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                            Store Phone Number *
                          </label>
                          <input
                            type="text"
                            required
                            value={storeSettings.storePhone}
                            onChange={(e) => setStoreSettings({ ...storeSettings, storePhone: e.target.value })}
                            placeholder="e.g. +880 1700-000000"
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '0.92rem' }}
                          />
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                          Support Email
                        </label>
                        <input
                          type="email"
                          value={storeSettings.storeEmail}
                          onChange={(e) => setStoreSettings({ ...storeSettings, storeEmail: e.target.value })}
                          placeholder="e.g. info@shahlajuk.com"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '0.92rem' }}
                        />
                      </div>

                      <h5 style={{ fontSize: '0.95rem', color: 'var(--ink)', marginBottom: '12px', fontWeight: '700' }}>
                        Social Media Profile Links
                      </h5>

                      <div className="form-grid-2" style={{ marginBottom: '14px' }}>
                        <div className="form-group">
                          <label style={{ fontWeight: '500', marginBottom: '6px', display: 'block', fontSize: '0.88rem' }}>
                            Facebook Page URL
                          </label>
                          <input
                            type="text"
                            value={storeSettings.facebookUrl}
                            onChange={(e) => setStoreSettings({ ...storeSettings, facebookUrl: e.target.value })}
                            placeholder="https://facebook.com/shahlajuk"
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '0.9rem' }}
                          />
                        </div>
                        <div className="form-group">
                          <label style={{ fontWeight: '500', marginBottom: '6px', display: 'block', fontSize: '0.88rem' }}>
                            Instagram Profile URL
                          </label>
                          <input
                            type="text"
                            value={storeSettings.instagramUrl}
                            onChange={(e) => setStoreSettings({ ...storeSettings, instagramUrl: e.target.value })}
                            placeholder="https://instagram.com/shahlajuk"
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '0.9rem' }}
                          />
                        </div>
                      </div>

                      <div className="form-grid-2">
                        <div className="form-group">
                          <label style={{ fontWeight: '500', marginBottom: '6px', display: 'block', fontSize: '0.88rem' }}>
                            WhatsApp Number (digits only)
                          </label>
                          <input
                            type="text"
                            value={storeSettings.whatsappNumber}
                            onChange={(e) => setStoreSettings({ ...storeSettings, whatsappNumber: e.target.value })}
                            placeholder="8801700000000"
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '0.9rem' }}
                          />
                        </div>
                        <div className="form-group">
                          <label style={{ fontWeight: '500', marginBottom: '6px', display: 'block', fontSize: '0.88rem' }}>
                            YouTube Channel URL
                          </label>
                          <input
                            type="text"
                            value={storeSettings.youtubeUrl}
                            onChange={(e) => setStoreSettings({ ...storeSettings, youtubeUrl: e.target.value })}
                            placeholder="https://youtube.com/@shahlajuk"
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '0.9rem' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                  <button
                    type="submit"
                    className="btn-admin-primary"
                    disabled={isSavingSettings}
                    style={{ padding: '12px 28px', fontSize: '0.95rem', fontWeight: '600' }}
                  >
                    {isSavingSettings ? 'Saving Settings...' : 'Save All Store Settings'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab Content: Architecture & Themes Section */}
        {activeTab === 'themes' && (
          <div className="admin-tab-content">
            <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
              {/* Header Box */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontFamily: 'Fraunces, serif', color: 'var(--walnut)' }}>
                    Architecture & Themes Section
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', marginTop: '4px' }}>
                    Manage the curated editorial spaces, headlines, descriptions, and custom images featured in "Spaces Sculpted for Serenity" on the homepage.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={fetchThemeSection}
                    disabled={isLoadingThemes || isSavingThemes}
                    title="Reload latest from server"
                  >
                    {isLoadingThemes ? 'Refreshing...' : 'Refresh'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveThemeSection}
                    disabled={isSavingThemes}
                    style={{ minWidth: '140px' }}
                  >
                    {isSavingThemes ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span className="spinner" style={{ width: '14px', height: '14px' }}></span>
                        Saving...
                      </span>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </div>

              {/* Toast Notification Banner */}
              {themeToast && (
                <div
                  style={{
                    padding: '12px 18px',
                    borderRadius: '8px',
                    background: themeToast.type === 'error' ? '#FEE2E2' : '#ECFDF5',
                    color: themeToast.type === 'error' ? '#991B1B' : '#065F46',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    marginBottom: '24px',
                    border: `1px solid ${themeToast.type === 'error' ? '#FCA5A5' : '#A7F3D0'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>{themeToast.message}</span>
                  <button
                    type="button"
                    onClick={() => setThemeToast(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 'bold', fontSize: '1rem' }}
                  >
                    ✕
                  </button>
                </div>
              )}

              <form onSubmit={handleSaveThemeSection}>
                {/* 1. Main Section Header Configuration */}
                <div style={{ background: 'var(--paper)', padding: '24px', borderRadius: '12px', border: '1px solid var(--line)', marginBottom: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--walnut)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Section Header & Editorial Headline</span>
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Eyebrow Label (Small Overline)
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={themeForm.eyebrow}
                        onChange={(e) => setThemeForm({ ...themeForm, eyebrow: e.target.value })}
                        placeholder="CURATED ARCHITECTURE & THEMES"
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Main Heading
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={themeForm.heading}
                        onChange={(e) => setThemeForm({ ...themeForm, heading: e.target.value })}
                        placeholder="Spaces Sculpted for Serenity"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Subheading / Narrative Text
                    </label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={themeForm.subheading}
                      onChange={(e) => setThemeForm({ ...themeForm, subheading: e.target.value })}
                      placeholder="We design with the belief that calm interiors create quiet minds..."
                    />
                  </div>
                </div>

                {/* 2. Theme Cards Grid / Stack */}
                <div style={{ marginBottom: '28px' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--walnut)', marginBottom: '8px' }}>
                    Curated Theme Cards ({themeForm.cards.length} Cards)
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--ink-soft)', marginBottom: '20px' }}>
                    Card 1 is displayed as the prominent wide hero card on the left. Cards 2 and 3 are displayed in the right column stack. Upload a custom photo or leave empty to use the default architectural illustration.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                    {themeForm.cards.map((card, idx) => {
                      const isUploading = uploadingCardIndex === idx;
                      const cardRole = idx === 0 ? 'Primary Feature (Wide)' : idx === 1 ? 'Split Feature A' : 'Split Feature B';

                      return (
                        <div
                          key={idx}
                          style={{
                            background: 'var(--paper)',
                            border: '1px solid var(--line)',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                          }}
                        >
                          {/* Card Top Title Banner */}
                          <div style={{ background: '#F5F4F0', padding: '12px 18px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--walnut)' }}>
                              {cardRole}
                            </span>
                            <span style={{ fontSize: '0.72rem', background: '#E7E5E4', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                              Card #{idx + 1}
                            </span>
                          </div>

                          {/* Visual Media & Uploader Box */}
                          <div style={{ padding: '18px', borderBottom: '1px solid var(--line)', background: '#FAFAF9' }}>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '8px', textTransform: 'uppercase' }}>
                              Visual Graphic / Custom Image
                            </label>

                            {/* Aspect Ratio Preview Container */}
                            <div
                              style={{
                                width: '100%',
                                aspectRatio: '16 / 8',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                background: '#EAE5DC',
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid var(--line)',
                                marginBottom: '12px'
                              }}
                            >
                              {card.imageUrl ? (
                                <img
                                  src={card.imageUrl}
                                  alt={card.title || `Theme ${idx + 1}`}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <div style={{ textAlign: 'center', padding: '12px', color: '#78716C' }}>
                                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 6px', display: 'block', opacity: 0.7 }}>
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                    <polyline points="21 15 16 10 5 21"></polyline>
                                  </svg>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                    Default Editorial Illustration
                                  </span>
                                  <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.8 }}>
                                    (Active on storefront)
                                  </span>
                                </div>
                              )}

                              {/* Card Badge Overlay Preview */}
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '8px',
                                  left: '8px',
                                  fontSize: '0.62rem',
                                  fontWeight: 700,
                                  background: 'rgba(255,255,255,0.92)',
                                  padding: '2px 8px',
                                  borderRadius: '2px',
                                  border: '1px solid #E7E5E4',
                                  letterSpacing: '0.08em'
                                }}
                              >
                                {card.badgeText || `THEME 0${idx + 1}`}
                              </div>
                            </div>

                            {/* Upload & Link Controls */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <label
                                  className="btn btn-outline"
                                  style={{
                                    cursor: isUploading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.78rem',
                                    padding: '6px 12px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    margin: 0
                                  }}
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="17 8 12 3 7 8"></polyline>
                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                  </svg>
                                  <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    disabled={isUploading}
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        handleCardImageUpload(idx, e.target.files[0]);
                                      }
                                    }}
                                  />
                                </label>

                                {card.imageUrl && (
                                  <button
                                    type="button"
                                    onClick={() => handleCardFieldChange(idx, 'imageUrl', '')}
                                    className="btn btn-ghost"
                                    style={{ fontSize: '0.76rem', color: '#B91C1C', padding: '6px 8px' }}
                                    title="Clear image and revert to default illustration"
                                  >
                                    Revert to Default
                                  </button>
                                )}
                              </div>

                              <input
                                type="text"
                                className="form-control"
                                style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                                value={card.imageUrl}
                                onChange={(e) => handleCardFieldChange(idx, 'imageUrl', e.target.value)}
                                placeholder="Or paste image URL (https://...)"
                              />
                            </div>
                          </div>

                          {/* Card Text Content Fields */}
                          <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '4px' }}>
                                  Badge Text
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  style={{ fontSize: '0.85rem' }}
                                  value={card.badgeText}
                                  onChange={(e) => handleCardFieldChange(idx, 'badgeText', e.target.value)}
                                  placeholder={`THEME 0${idx + 1}`}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '4px' }}>
                                  Category Label
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  style={{ fontSize: '0.85rem' }}
                                  value={card.category}
                                  onChange={(e) => handleCardFieldChange(idx, 'category', e.target.value)}
                                  placeholder="e.g. LIVING & LOUNGE"
                                />
                              </div>
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '4px' }}>
                                Card Title
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                style={{ fontSize: '0.9rem', fontWeight: 600 }}
                                value={card.title}
                                onChange={(e) => handleCardFieldChange(idx, 'title', e.target.value)}
                                placeholder="Card headline"
                                required
                              />
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '4px' }}>
                                Description Paragraph
                              </label>
                              <textarea
                                className="form-control"
                                rows={3}
                                style={{ fontSize: '0.82rem', lineHeight: '1.4' }}
                                value={card.description}
                                onChange={(e) => handleCardFieldChange(idx, 'description', e.target.value)}
                                placeholder="Describe the materials, craftsmanship, and serenity..."
                              />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '4px' }}>
                                  Button Text
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  style={{ fontSize: '0.85rem' }}
                                  value={card.buttonText}
                                  onChange={(e) => handleCardFieldChange(idx, 'buttonText', e.target.value)}
                                  placeholder="Explore Collection"
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '4px' }}>
                                  Button Link / Route
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  style={{ fontSize: '0.85rem' }}
                                  value={card.buttonLink}
                                  onChange={(e) => handleCardFieldChange(idx, 'buttonLink', e.target.value)}
                                  placeholder="e.g. room:living-room or #material"
                                />
                              </div>
                            </div>

                            {/* Quick Route Shortcut Chips */}
                            <div style={{ marginTop: '2px' }}>
                              <span style={{ fontSize: '0.68rem', color: '#78716C', display: 'block', marginBottom: '4px' }}>
                                Quick route targets:
                              </span>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {[
                                  { label: 'Living Room', val: 'room:living-room' },
                                  { label: 'Reading/Study', val: 'room:reading-room' },
                                  { label: 'Bed Room', val: 'room:bed-room' },
                                  { label: 'Dining', val: 'room:dining-room' },
                                  { label: 'Materials', val: '#material' },
                                  { label: 'Shop All', val: '/catalog' }
                                ].map((target) => (
                                  <button
                                    key={target.val}
                                    type="button"
                                    onClick={() => handleCardFieldChange(idx, 'buttonLink', target.val)}
                                    style={{
                                      fontSize: '0.68rem',
                                      padding: '2px 6px',
                                      borderRadius: '3px',
                                      border: '1px solid #D6D3D1',
                                      background: card.buttonLink === target.val ? '#5A3720' : '#FFFFFF',
                                      color: card.buttonLink === target.val ? '#FFFFFF' : '#44403C',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {target.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Sticky / Fixed Save Bar */}
                <div style={{ background: 'var(--paper)', padding: '16px 24px', borderRadius: '12px', border: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
                    Make sure to click Save Changes to publish updates to the storefront.
                  </span>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSavingThemes}
                    style={{ minWidth: '160px', padding: '10px 24px', fontWeight: 600 }}
                  >
                    {isSavingThemes ? 'Saving Changes...' : 'Save All Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab Content: Native Banner (320x50) */}
        {activeTab === 'banner' && (
          <div className="admin-tab-content">
            <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
              {/* Header Box */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontFamily: 'Fraunces, serif', color: 'var(--walnut)' }}>
                    Native Banner Management (320x50)
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', marginTop: '4px' }}>
                    Configure a non-intrusive 320x50 native ad banner with your Adestra / Adsterra direct link, custom graphic, and storefront placement.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={fetchNativeBanner}
                    disabled={isLoadingBanner || isSavingBanner}
                    title="Reload latest from server"
                  >
                    {isLoadingBanner ? 'Refreshing...' : 'Refresh'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveNativeBanner}
                    disabled={isSavingBanner}
                    style={{ minWidth: '140px' }}
                  >
                    {isSavingBanner ? 'Saving...' : 'Save Banner'}
                  </button>
                </div>
              </div>

              {/* Toast Feedback */}
              {bannerToast && (
                <div
                  style={{
                    padding: '12px 18px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    background: bannerToast.type === 'success' ? '#DCFCE7' : '#FEE2E2',
                    color: bannerToast.type === 'success' ? '#166534' : '#991B1B',
                    border: `1px solid ${bannerToast.type === 'success' ? '#86EFAC' : '#FCA5A5'}`
                  }}
                >
                  {bannerToast.message}
                </div>
              )}

              <form onSubmit={handleSaveNativeBanner}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)', gap: '24px', alignItems: 'start' }}>
                  
                  {/* Left Column: Form Fields */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Status & Placement Card */}
                    <div className="admin-form-card" style={{ background: 'var(--paper)', padding: '24px', borderRadius: '12px', border: '1px solid var(--line)' }}>
                      <h4 style={{ fontSize: '1.05rem', color: 'var(--ink)', marginBottom: '16px', fontWeight: 600 }}>
                        1. Status & Placement Settings
                      </h4>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Active Toggle */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none', background: 'var(--surface)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                          <input
                            type="checkbox"
                            checked={nativeBannerForm.isActive}
                            onChange={(e) => setNativeBannerForm(prev => ({ ...prev, isActive: e.target.checked }))}
                            style={{ width: '18px', height: '18px', accentColor: 'var(--walnut)', cursor: 'pointer' }}
                          />
                          <div>
                            <strong style={{ fontSize: '0.9rem', display: 'block', color: 'var(--ink)' }}>
                              Enable Native Banner on Storefront
                            </strong>
                            <span style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
                              When enabled, the 320x50 native banner will be visible to store visitors.
                            </span>
                          </div>
                        </label>

                        {/* Placement Selector */}
                        <div>
                          <label className="input-sublabel" style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '6px' }}>
                            Storefront Placement Location
                          </label>
                          <select
                            value={nativeBannerForm.placement}
                            onChange={(e) => setNativeBannerForm(prev => ({ ...prev, placement: e.target.value }))}
                            className="form-control"
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--paper)' }}
                          >
                            <option value="footer">Above Footer (Global on All Pages) — Recommended</option>
                            <option value="home_mid">Homepage Mid-Feed (Between Themes & Featured Pieces)</option>
                            <option value="both">Both Placements (Mid-Feed & Above Footer)</option>
                          </select>
                          <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', marginTop: '4px', display: 'block' }}>
                            The banner is non-intrusive and cleanly integrated into the normal page flow.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ad Network Script Embed Code (Adsterra / CPM Network) */}
                    <div className="admin-form-card" style={{ background: 'var(--paper)', padding: '24px', borderRadius: '12px', border: '1px solid var(--line)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <h4 style={{ fontSize: '1.05rem', color: 'var(--ink)', margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>2. Ad Network Script Code (Adsterra / CPM Network)</span>
                            <span style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: '4px', background: nativeBannerForm.adScriptCode?.trim() ? '#DCFCE7' : '#F3F4F6', color: nativeBannerForm.adScriptCode?.trim() ? '#166534' : '#6B7280', fontWeight: 700, letterSpacing: '0.04em' }}>
                              {nativeBannerForm.adScriptCode?.trim() ? 'SCRIPT ACTIVE' : 'OPTIONAL'}
                            </span>
                          </h4>
                          <span style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '4px', display: 'block' }}>
                            Paste the full script embed tag and container div from your ad network here.
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => {
                              const sampleSnippet = `<script async="async" data-cfasync="false" src="https://pl32018631.profitableratecpmnetwork.com/cbdefa9aba08563b50f57b82e52a93f5/invoke.js"></script>\n<div id="container-cbdefa9aba08563b50f57b82e52a93f5"></div>`;
                              setNativeBannerForm(prev => ({ ...prev, adScriptCode: sampleSnippet }));
                            }}
                            style={{ fontSize: '0.75rem', padding: '6px 10px', borderRadius: '6px', background: '#FAF8F5' }}
                          >
                            + Insert Sample Adsterra Snippet
                          </button>
                          {nativeBannerForm.adScriptCode && (
                            <button
                              type="button"
                              className="btn btn-ghost"
                              onClick={() => setNativeBannerForm(prev => ({ ...prev, adScriptCode: '' }))}
                              style={{ fontSize: '0.75rem', padding: '6px 10px', color: '#B91C1C' }}
                            >
                              Clear Script
                            </button>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <textarea
                          rows={4}
                          className="form-control"
                          placeholder={'<script async="async" data-cfasync="false" src="https://.../invoke.js"></script>\n<div id="container-..."></div>'}
                          value={nativeBannerForm.adScriptCode}
                          onChange={(e) => setNativeBannerForm(prev => ({ ...prev, adScriptCode: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            borderRadius: '8px',
                            border: nativeBannerForm.adScriptCode?.trim() ? '1.5px solid #16A34A' : '1px solid var(--line)',
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                            fontSize: '0.8rem',
                            lineHeight: 1.5,
                            background: '#FAF9F6',
                            color: 'var(--ink)'
                          }}
                        />
                        <div style={{ fontSize: '0.74rem', color: 'var(--ink-soft)', lineHeight: 1.45, background: '#F8FAFC', padding: '10px 12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                          💡 <strong>Dynamic Script Execution:</strong> When an ad script is entered, the storefront dynamically injects and runs the ad network script (e.g. <code>invoke.js</code>) and mounts its target container div inside the 320x50 native slot. If empty, the banner uses the direct link & image fallback below.
                        </div>
                      </div>
                    </div>

                    {/* Destination Link & Settings */}
                    <div className="admin-form-card" style={{ background: 'var(--paper)', padding: '24px', borderRadius: '12px', border: '1px solid var(--line)' }}>
                      <h4 style={{ fontSize: '1.05rem', color: 'var(--ink)', marginBottom: '16px', fontWeight: 600 }}>
                        3. Direct Adestra / Target Link (Fallback Mode)
                      </h4>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <label className="input-sublabel" style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '6px' }}>
                            Adestra / Smartlink / Destination URL
                          </label>
                          <input
                            type="url"
                            className="form-control"
                            placeholder="https://... (optional when Adsterra script is used above)"
                            value={nativeBannerForm.adestraLink}
                            onChange={(e) => setNativeBannerForm(prev => ({ ...prev, adestraLink: e.target.value }))}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}
                          />
                          <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', marginTop: '4px', display: 'block' }}>
                            Destination URL when users click the banner image or when no ad network script is provided.
                          </span>
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--ink)' }}>
                          <input
                            type="checkbox"
                            checked={nativeBannerForm.openInNewTab}
                            onChange={(e) => setNativeBannerForm(prev => ({ ...prev, openInNewTab: e.target.checked }))}
                            style={{ accentColor: 'var(--walnut)' }}
                          />
                          <span>Open link in a new browser tab (target="_blank" with rel="sponsored")</span>
                        </label>
                      </div>
                    </div>

                    {/* Banner Graphic & Copy Card */}
                    <div className="admin-form-card" style={{ background: 'var(--paper)', padding: '24px', borderRadius: '12px', border: '1px solid var(--line)' }}>
                      <h4 style={{ fontSize: '1.05rem', color: 'var(--ink)', marginBottom: '16px', fontWeight: 600 }}>
                        4. Banner Creative & Text (320×50 px)
                      </h4>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* File Upload or URL */}
                        <div>
                          <label className="input-sublabel" style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '6px' }}>
                            Banner Graphic (Exact 320x50 Recommended)
                          </label>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                            <input
                              type="file"
                              ref={bannerFileInputRef}
                              accept="image/png,image/jpeg,image/webp,image/gif"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleBannerImageUpload(e.target.files[0]);
                                }
                              }}
                            />
                            <button
                              type="button"
                              className="btn btn-outline"
                              onClick={() => bannerFileInputRef.current && bannerFileInputRef.current.click()}
                              disabled={isUploadingBannerImage}
                              style={{ fontSize: '0.85rem', padding: '8px 14px' }}
                            >
                              {isUploadingBannerImage ? 'Uploading...' : 'Upload 320x50 Image'}
                            </button>
                            {nativeBannerForm.imageUrl && (
                              <button
                                type="button"
                                className="btn btn-ghost"
                                style={{ color: '#B91C1C', fontSize: '0.8rem' }}
                                onClick={() => setNativeBannerForm(prev => ({ ...prev, imageUrl: '' }))}
                              >
                                Remove Image (Use Fallback)
                              </button>
                            )}
                          </div>

                          <input
                            type="text"
                            className="form-control"
                            placeholder="Or paste direct image URL (e.g. https://.../banner-320x50.png)"
                            value={nativeBannerForm.imageUrl}
                            onChange={(e) => setNativeBannerForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label className="input-sublabel" style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '6px' }}>
                              Headline / Title
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g. Curated Partner Collections"
                              value={nativeBannerForm.title}
                              onChange={(e) => setNativeBannerForm(prev => ({ ...prev, title: e.target.value }))}
                              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
                            />
                          </div>

                          <div>
                            <label className="input-sublabel" style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '6px' }}>
                              Micro-Badge Tag
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g. SPONSORED, PARTNER, AD"
                              value={nativeBannerForm.badgeText}
                              onChange={(e) => setNativeBannerForm(prev => ({ ...prev, badgeText: e.target.value }))}
                              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="input-sublabel" style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '6px' }}>
                            Image Alt Text (Accessibility & SEO)
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. Exclusive Furniture Partner Deal"
                            value={nativeBannerForm.altText}
                            onChange={(e) => setNativeBannerForm(prev => ({ ...prev, altText: e.target.value }))}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Live 320x50 Preview & Guidelines */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="admin-form-card" style={{ background: 'var(--paper)', padding: '24px', borderRadius: '12px', border: '1px solid var(--line)', position: 'sticky', top: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <h4 style={{ fontSize: '1.05rem', color: 'var(--ink)', fontWeight: 600, margin: 0 }}>
                          Live 320x50 Preview
                        </h4>
                        <span style={{ fontSize: '0.72rem', background: '#F5F4F0', padding: '3px 8px', borderRadius: '4px', fontWeight: 600, color: 'var(--ink-soft)' }}>
                          320 × 50 px
                        </span>
                      </div>

                      <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', marginBottom: '18px' }}>
                        This is the exact size and styling visitors will see on mobile & desktop screens:
                      </p>

                      {/* Mockup Container */}
                      <div style={{ background: 'var(--bg)', padding: '24px 16px', borderRadius: '8px', border: '1px dashed var(--line)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        
                        {/* Render Preview Component */}
                        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', width: '320px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--walnut)', textTransform: 'uppercase' }}>
                              {nativeBannerForm.badgeText || 'SPONSORED'}
                            </span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--ink-soft)' }}>
                              {nativeBannerForm.adScriptCode?.trim() ? 'Adsterra CPM Network' : 'Adestra Partner'}
                            </span>
                          </div>

                          <div
                            style={{
                              width: '320px',
                              height: '50px',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              border: '1px solid var(--line)',
                              background: '#FFFFFF',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                              position: 'relative'
                            }}
                          >
                            {nativeBannerForm.adScriptCode && nativeBannerForm.adScriptCode.trim() ? (
                              <div style={{ width: '320px', height: '50px', display: 'flex', alignItems: 'center', padding: '0 12px', gap: '10px', background: 'linear-gradient(90deg, #F0FDF4 0%, #DCFCE7 100%)', border: '1px solid #BBF7D0' }}>
                                <div style={{ width: '28px', height: '28px', borderRadius: '4px', background: '#16A34A', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                    <polyline points="16 18 22 12 16 6"></polyline>
                                    <polyline points="8 6 2 12 8 18"></polyline>
                                  </svg>
                                </div>
                                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#166534', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    Adsterra CPM Script Active
                                  </div>
                                  <div style={{ fontSize: '0.65rem', color: '#15803D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'monospace' }}>
                                    {nativeBannerForm.adScriptCode.includes('container-')
                                      ? (nativeBannerForm.adScriptCode.match(/id=["'](container-[^"']+)["']/)?.[1] || 'Dynamic container mounted')
                                      : 'invoke.js script mounted'}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', display: 'inline-block' }}></span>
                                </div>
                              </div>
                            ) : nativeBannerForm.imageUrl ? (
                              <img
                                src={nativeBannerForm.imageUrl}
                                alt="Banner preview"
                                style={{ width: '320px', height: '50px', objectFit: 'cover', display: 'block' }}
                              />
                            ) : (
                              <div style={{ width: '320px', height: '50px', display: 'flex', alignItems: 'center', padding: '0 12px', gap: '10px', background: 'linear-gradient(90deg, #F5F4F0 0%, #FAF8F5 100%)' }}>
                                <div style={{ width: '28px', height: '28px', borderRadius: '4px', background: 'var(--walnut)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                                    <path d="M2 17l10 5 10-5"></path>
                                    <path d="M2 12l10 5 10-5"></path>
                                  </svg>
                                </div>
                                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {nativeBannerForm.title || 'ShahLajuk Architectural Collections'}
                                  </div>
                                  <div style={{ fontSize: '0.65rem', color: 'var(--ink-soft)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    Tap to explore Adestra link
                                  </div>
                                </div>
                                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#FFFFFF', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--walnut)' }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="12 5 19 12 12 19"></polyline>
                                  </svg>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* Non-intrusive Guarantee */}
                      <div style={{ marginTop: '20px', padding: '14px', background: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 600, fontSize: '0.84rem', marginBottom: '4px' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          <span>Non-Intrusive UX Assured</span>
                        </div>
                        <p style={{ fontSize: '0.76rem', color: '#166534', lineHeight: 1.45, margin: 0 }}>
                          Placed smoothly inside page sections. Zero popup interruptions, zero floating button blocks, and fully responsive across mobile and desktop devices.
                        </p>
                      </div>

                      {/* Save Button */}
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSavingBanner}
                        style={{ width: '100%', marginTop: '20px', padding: '12px 18px', fontWeight: 600 }}
                      >
                        {isSavingBanner ? 'Saving...' : 'Save Banner Configuration'}
                      </button>
                    </div>
                  </div>

                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab Content 8: Delivery Areas & Upazila-Based Delivery Charges */}
        {activeTab === 'delivery' && (() => {
          const filteredDeliveryAreas = deliveryAreas.filter(area => {
            if (deliveryFilterStatus === 'active' && !area.isActive) return false;
            if (deliveryFilterStatus === 'inactive' && area.isActive) return false;
            if (deliveryFilterDivision !== 'all' && String(area.divisionId) !== String(deliveryFilterDivision)) return false;
            if (deliveryFilterDistrict !== 'all' && String(area.districtId) !== String(deliveryFilterDistrict)) return false;
            if (deliveryFilterSearch.trim()) {
              const q = deliveryFilterSearch.trim().toLowerCase();
              const match =
                (area.upazilaName && area.upazilaName.toLowerCase().includes(q)) ||
                (area.upazilaNameBn && area.upazilaNameBn.includes(q)) ||
                (area.districtName && area.districtName.toLowerCase().includes(q)) ||
                (area.districtNameBn && area.districtNameBn.includes(q)) ||
                (area.divisionName && area.divisionName.toLowerCase().includes(q)) ||
                (area.divisionNameBn && area.divisionNameBn.includes(q));
              if (!match) return false;
            }
            return true;
          });

          const configuredDivisions = Array.from(
            new Map(deliveryAreas.map(a => [a.divisionId, { id: a.divisionId, name: a.divisionName }])).values()
          );
          const configuredDistricts = Array.from(
            new Map(deliveryAreas.map(a => [a.districtId, { id: a.districtId, name: a.districtName, divisionId: a.divisionId }])).values()
          ).filter(d => deliveryFilterDivision === 'all' || String(d.divisionId) === String(deliveryFilterDivision));

          const allVisibleSelected = filteredDeliveryAreas.length > 0 &&
            filteredDeliveryAreas.every(a => selectedTableAreaIds.includes(a._id));

          const handleToggleSelectAllVisible = () => {
            if (allVisibleSelected) {
              const visibleIds = new Set(filteredDeliveryAreas.map(a => a._id));
              setSelectedTableAreaIds(prev => prev.filter(id => !visibleIds.has(id)));
            } else {
              const visibleIds = filteredDeliveryAreas.map(a => a._id);
              setSelectedTableAreaIds(prev => Array.from(new Set([...prev, ...visibleIds])));
            }
          };

          const handleToggleRowSelect = (id) => {
            setSelectedTableAreaIds(prev =>
              prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
            );
          };

          const selectedUpazilasCount = Object.values(selectedUpazilaMap).filter(v => v.checked).length;

          return (
            <div className="admin-tab-content">
              {/* Header Banner */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontFamily: 'Fraunces, serif', color: 'var(--walnut)', marginBottom: '4px' }}>
                    🚚 Delivery Areas & Upazila-Based Charges
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', margin: 0 }}>
                    Configure official delivery areas across Bangladesh using BD-GeoAPI. Set custom delivery fees (BDT) and activate coverage.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-admin-cancel"
                  onClick={() => { fetchDeliveryAreas(); fetchGeoDivisions(); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', padding: '8px 14px' }}
                >
                  🔄 Refresh Data
                </button>
              </div>

              {/* KPI Metrics Grid */}
              <div className="admin-stats-grid" style={{ marginBottom: '24px' }}>
                <div className="admin-stat-card">
                  <span className="stat-label">TOTAL CONFIGURED AREAS</span>
                  <span className="stat-value">{deliveryMetrics.totalCount || deliveryAreas.length}</span>
                  <span className="stat-sub">Upazilas in store database</span>
                </div>
                <div className="admin-stat-card">
                  <span className="stat-label">ACTIVE DELIVERY COVERAGE</span>
                  <span className="stat-value" style={{ color: '#166534' }}>
                    {deliveryMetrics.activeCount}
                  </span>
                  <span className="stat-sub">Available at checkout</span>
                </div>
                <div className="admin-stat-card">
                  <span className="stat-label">INACTIVE / PAUSED AREAS</span>
                  <span className="stat-value" style={{ color: '#991B1B' }}>
                    {deliveryMetrics.inactiveCount}
                  </span>
                  <span className="stat-sub">Temporarily suspended</span>
                </div>
                <div className="admin-stat-card">
                  <span className="stat-label">AVERAGE DELIVERY FEE</span>
                  <span className="stat-value">৳{deliveryMetrics.avgFee}</span>
                  <span className="stat-sub">Across all configured areas</span>
                </div>
              </div>

              {/* Section 1: Add New Delivery Areas with Cascading BD-GeoAPI Picker */}
              <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '10px', padding: '22px', marginBottom: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
                  <span style={{ fontSize: '1.2rem' }}>📍</span>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                      Add & Configure Delivery Areas (BD-GeoAPI)
                    </h4>
                    <span style={{ fontSize: '0.82rem', color: 'var(--ink-soft)' }}>
                      Select a division and district to browse upazilas, set delivery fees, and activate delivery coverage.
                    </span>
                  </div>
                </div>

                {/* Cascading Selectors */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      1. Select Division *
                    </label>
                    <select
                      value={selectedGeoDivisionId}
                      onChange={(e) => setSelectedGeoDivisionId(e.target.value)}
                      style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--bg)', fontSize: '0.92rem' }}
                    >
                      <option value="">-- Choose Division ({geoDivisions.length} available) --</option>
                      {geoDivisions.map(div => (
                        <option key={div.id} value={div.id}>
                          {div.name} {div.nameBn ? `(${div.nameBn})` : ''} - {div.districtsCount} Districts
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      2. Select District *
                    </label>
                    <select
                      value={selectedGeoDistrictId}
                      onChange={(e) => setSelectedGeoDistrictId(e.target.value)}
                      disabled={!selectedGeoDivisionId}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--line)',
                        background: selectedGeoDivisionId ? 'var(--bg)' : 'rgba(0,0,0,0.03)',
                        fontSize: '0.92rem',
                        cursor: selectedGeoDivisionId ? 'pointer' : 'not-allowed'
                      }}
                    >
                      <option value="">
                        {selectedGeoDivisionId ? `-- Choose District (${geoDistricts.length} available) --` : 'Select Division first'}
                      </option>
                      {geoDistricts.map(dist => (
                        <option key={dist.id} value={dist.id}>
                          {dist.name} {dist.nameBn ? `(${dist.nameBn})` : ''} - {dist.upazilasCount} Upazilas
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Upazilas Multi-selection Container */}
                {selectedGeoDistrictId && (
                  <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: '8px', padding: '18px' }}>
                    {isLoadingGeoUpazilas ? (
                      <div style={{ textAlign: 'center', padding: '24px', color: 'var(--ink-soft)' }}>
                        <span className="spinner" style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid var(--walnut)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '8px' }}></span>
                        <div>Loading upazilas from BD-GeoAPI...</div>
                      </div>
                    ) : geoUpazilas.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '16px', color: 'var(--ink-soft)' }}>
                        No upazilas found for this district in BD-GeoAPI.
                      </div>
                    ) : (
                      <>
                        {/* Upazilas Toolbar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--ink)' }}>
                              Upazilas in District ({geoUpazilas.length})
                            </span>
                            <button
                              type="button"
                              className="btn-admin-cancel"
                              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                              onClick={() => handleToggleSelectAllUpazilas(true)}
                            >
                              Select All
                            </button>
                            <button
                              type="button"
                              className="btn-admin-cancel"
                              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                              onClick={() => handleToggleSelectAllUpazilas(false)}
                            >
                              Deselect All
                            </button>
                          </div>

                          {/* Common Fee Setter */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink-soft)' }}>
                              Common Fee (BDT ৳):
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={commonFeeInput}
                              onChange={(e) => setCommonFeeInput(e.target.value)}
                              style={{ width: '85px', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--line)', fontSize: '0.88rem' }}
                            />
                            <button
                              type="button"
                              className="btn-admin-cancel"
                              style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--paper)', fontWeight: 600 }}
                              onClick={handleApplyCommonFee}
                              title="Set this fee for all currently selected upazilas"
                            >
                              Apply to Selected
                            </button>
                          </div>
                        </div>

                        {/* Upazila Cards Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px', marginBottom: '18px' }}>
                          {geoUpazilas.map(upz => {
                            const entry = selectedUpazilaMap[upz.id] || { checked: false, fee: commonFeeInput };
                            const alreadyConfigured = deliveryAreas.find(a => Number(a.upazilaId) === Number(upz.id));

                            return (
                              <div
                                key={upz.id}
                                style={{
                                  background: entry.checked ? 'rgba(201, 168, 118, 0.12)' : 'var(--paper)',
                                  border: entry.checked ? '1.5px solid var(--walnut)' : '1px solid var(--line)',
                                  borderRadius: '6px',
                                  padding: '12px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px',
                                  transition: 'border 0.2s, background 0.2s'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, fontWeight: 600, fontSize: '0.92rem', color: 'var(--ink)' }}>
                                    <input
                                      type="checkbox"
                                      checked={Boolean(entry.checked)}
                                      onChange={(e) => {
                                        setSelectedUpazilaMap(prev => ({
                                          ...prev,
                                          [upz.id]: {
                                            ...(prev[upz.id] || {}),
                                            checked: e.target.checked,
                                            fee: prev[upz.id]?.fee !== undefined ? prev[upz.id].fee : commonFeeInput
                                          }
                                        }));
                                      }}
                                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                    />
                                    <span>
                                      {upz.name} {upz.nameBn ? <span style={{ color: 'var(--ink-soft)', fontWeight: 400 }}>({upz.nameBn})</span> : ''}
                                    </span>
                                  </label>
                                  {alreadyConfigured ? (
                                    <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: alreadyConfigured.isActive ? '#DCFCE7' : '#FEE2E2', color: alreadyConfigured.isActive ? '#166534' : '#991B1B', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                      {alreadyConfigured.isActive ? `৳${alreadyConfigured.deliveryFee}` : 'Paused'}
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(0,0,0,0.06)', color: 'var(--ink-soft)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                      New
                                    </span>
                                  )}
                                </div>

                                {/* Individual Fee Input */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                                  <span style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
                                    Fee (BDT ৳):
                                  </span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={entry.fee !== undefined ? entry.fee : commonFeeInput}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setSelectedUpazilaMap(prev => ({
                                        ...prev,
                                        [upz.id]: {
                                          ...(prev[upz.id] || {}),
                                          fee: val === '' ? '' : Number(val)
                                        }
                                      }));
                                    }}
                                    style={{
                                      width: '90px',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      border: '1px solid var(--line)',
                                      fontSize: '0.86rem',
                                      fontWeight: 600,
                                      color: 'var(--walnut)'
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Save Action Bar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid var(--line)', paddingTop: '14px' }}>
                          <span style={{ fontSize: '0.86rem', color: 'var(--ink-soft)' }}>
                            Selected for configuration: <strong style={{ color: 'var(--walnut)' }}>{selectedUpazilasCount} upazila(s)</strong>
                          </span>
                          <button
                            type="button"
                            className="btn-admin-primary"
                            disabled={selectedUpazilasCount === 0 || isSavingAreas}
                            onClick={handleSaveConfiguredAreas}
                            style={{
                              padding: '10px 22px',
                              fontSize: '0.9rem',
                              opacity: selectedUpazilasCount === 0 ? 0.6 : 1,
                              cursor: selectedUpazilasCount === 0 ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {isSavingAreas ? 'Saving Areas...' : `Save ${selectedUpazilasCount} Delivery Area(s)`}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Section 2: Manage Configured Delivery Areas Table */}
              <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '10px', padding: '22px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>📋</span>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                      Configured Delivery Areas ({deliveryAreas.length})
                    </h4>
                  </div>

                  {/* Bulk Actions Toolbar */}
                  {selectedTableAreaIds.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(201, 168, 118, 0.15)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(201, 168, 118, 0.4)', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--walnut)' }}>
                        {selectedTableAreaIds.length} Selected:
                      </span>
                      <button
                        type="button"
                        className="btn-admin-cancel"
                        onClick={() => handleBulkActivate(true)}
                        style={{ padding: '4px 8px', fontSize: '0.78rem', background: '#DCFCE7', color: '#166534', border: 'none', fontWeight: 600 }}
                      >
                        ✓ Activate
                      </button>
                      <button
                        type="button"
                        className="btn-admin-cancel"
                        onClick={() => handleBulkActivate(false)}
                        style={{ padding: '4px 8px', fontSize: '0.78rem', background: '#FEE2E2', color: '#991B1B', border: 'none', fontWeight: 600 }}
                      >
                        ⏸ Deactivate
                      </button>
                      <button
                        type="button"
                        className="btn-admin-cancel"
                        onClick={() => setIsBulkFeeModalOpen(true)}
                        style={{ padding: '4px 8px', fontSize: '0.78rem', background: 'var(--paper)', fontWeight: 600 }}
                      >
                        ✏️ Set Fee
                      </button>
                      <button
                        type="button"
                        className="btn-admin-cancel"
                        onClick={handleBulkDelete}
                        style={{ padding: '4px 8px', fontSize: '0.78rem', background: '#991B1B', color: '#FFFFFF', border: 'none', fontWeight: 600 }}
                      >
                        🗑 Delete
                      </button>
                      <button
                        type="button"
                        className="btn-admin-cancel"
                        onClick={() => setSelectedTableAreaIds([])}
                        style={{ padding: '4px 6px', fontSize: '0.74rem' }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Filters & Search Toolbar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '18px', background: 'var(--bg)', padding: '12px', borderRadius: '8px' }}>
                  {/* Search */}
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>Search Areas</label>
                    <input
                      type="text"
                      placeholder="Search upazila, district..."
                      value={deliveryFilterSearch}
                      onChange={(e) => setDeliveryFilterSearch(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '5px', border: '1px solid var(--line)', fontSize: '0.88rem' }}
                    />
                  </div>

                  {/* Filter Division */}
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>Filter Division</label>
                    <select
                      value={deliveryFilterDivision}
                      onChange={(e) => {
                        setDeliveryFilterDivision(e.target.value);
                        setDeliveryFilterDistrict('all');
                      }}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '5px', border: '1px solid var(--line)', fontSize: '0.88rem' }}
                    >
                      <option value="all">All Divisions ({configuredDivisions.length})</option>
                      {configuredDivisions.map(div => (
                        <option key={div.id} value={div.id}>{div.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter District */}
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>Filter District</label>
                    <select
                      value={deliveryFilterDistrict}
                      onChange={(e) => setDeliveryFilterDistrict(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '5px', border: '1px solid var(--line)', fontSize: '0.88rem' }}
                    >
                      <option value="all">All Districts ({configuredDistricts.length})</option>
                      {configuredDistricts.map(dist => (
                        <option key={dist.id} value={dist.id}>{dist.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter Status */}
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>Filter Status</label>
                    <select
                      value={deliveryFilterStatus}
                      onChange={(e) => setDeliveryFilterStatus(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '5px', border: '1px solid var(--line)', fontSize: '0.88rem' }}
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active Only ({deliveryMetrics.activeCount})</option>
                      <option value="inactive">Inactive Only ({deliveryMetrics.inactiveCount})</option>
                    </select>
                  </div>
                </div>

                {/* Table Data */}
                {isLoadingDeliveryAreas ? (
                  <div style={{ textAlign: 'center', padding: '36px', color: 'var(--ink-soft)' }}>
                    <span className="spinner" style={{ display: 'inline-block', width: '22px', height: '22px', border: '2px solid var(--walnut)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '8px' }}></span>
                    <div>Loading configured delivery areas...</div>
                  </div>
                ) : filteredDeliveryAreas.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 16px', background: 'var(--bg)', borderRadius: '8px', color: 'var(--ink-soft)' }}>
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>
                      {deliveryAreas.length === 0
                        ? 'No delivery areas have been configured yet. Use the area picker above to configure your first delivery upazila.'
                        : 'No delivery areas match the selected filters.'}
                    </p>
                    {(deliveryFilterSearch || deliveryFilterDivision !== 'all' || deliveryFilterDistrict !== 'all' || deliveryFilterStatus !== 'all') && (
                      <button
                        type="button"
                        className="btn-admin-cancel"
                        style={{ marginTop: '12px', fontSize: '0.84rem' }}
                        onClick={() => {
                          setDeliveryFilterSearch('');
                          setDeliveryFilterDivision('all');
                          setDeliveryFilterDistrict('all');
                          setDeliveryFilterStatus('all');
                        }}
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="table-responsive" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg)', borderBottom: '2px solid var(--line)', textAlign: 'left' }}>
                          <th style={{ padding: '10px 12px', width: '36px' }}>
                            <input
                              type="checkbox"
                              checked={allVisibleSelected}
                              onChange={handleToggleSelectAllVisible}
                              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                              title="Select / Deselect all visible areas"
                            />
                          </th>
                          <th style={{ padding: '10px 12px' }}>Upazila (Area)</th>
                          <th style={{ padding: '10px 12px' }}>District</th>
                          <th style={{ padding: '10px 12px' }}>Division</th>
                          <th style={{ padding: '10px 12px' }}>Delivery Fee (BDT)</th>
                          <th style={{ padding: '10px 12px' }}>Delivery Time</th>
                          <th style={{ padding: '10px 12px' }}>Status</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDeliveryAreas.map((area) => {
                          const isSelected = selectedTableAreaIds.includes(area._id);
                          const isEditingThis = editingAreaId === area._id;

                          return (
                            <tr
                              key={area._id}
                              style={{
                                borderBottom: '1px solid var(--line)',
                                background: isSelected ? 'rgba(201, 168, 118, 0.08)' : 'transparent',
                                transition: 'background 0.15s'
                              }}
                            >
                              <td style={{ padding: '10px 12px' }}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleRowSelect(area._id)}
                                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                              </td>
                              <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--ink)' }}>
                                {area.upazilaName}
                                {area.upazilaNameBn ? (
                                  <span style={{ color: 'var(--ink-soft)', fontWeight: 400, marginLeft: '6px', fontSize: '0.82rem' }}>
                                    ({area.upazilaNameBn})
                                  </span>
                                ) : null}
                              </td>
                              <td style={{ padding: '10px 12px', color: 'var(--ink)' }}>
                                {area.districtName}
                              </td>
                              <td style={{ padding: '10px 12px', color: 'var(--ink-soft)' }}>
                                {area.divisionName}
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                {isEditingThis ? (
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    <input
                                      type="number"
                                      min="0"
                                      value={editingFeeValue}
                                      onChange={(e) => setEditingFeeValue(e.target.value)}
                                      style={{ width: '80px', padding: '4px 6px', borderRadius: '4px', border: '1px solid var(--walnut)', fontSize: '0.86rem', fontWeight: 700 }}
                                      autoFocus
                                    />
                                    <button
                                      type="button"
                                      className="btn-admin-cancel"
                                      onClick={() => handleSaveInlineFee(area._id)}
                                      style={{ padding: '3px 8px', fontSize: '0.76rem', background: '#DCFCE7', color: '#166534', border: 'none', fontWeight: 600 }}
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      className="btn-admin-cancel"
                                      onClick={() => setEditingAreaId(null)}
                                      style={{ padding: '3px 6px', fontSize: '0.76rem' }}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                    <strong style={{ color: 'var(--walnut)', fontSize: '0.94rem' }}>
                                      ৳{area.deliveryFee}
                                    </strong>
                                    <button
                                      type="button"
                                      className="btn-admin-cancel"
                                      onClick={() => {
                                        setEditingAreaId(area._id);
                                        setEditingFeeValue(area.deliveryFee);
                                      }}
                                      title="Edit Fee"
                                      style={{ padding: '2px 6px', fontSize: '0.72rem', borderRadius: '3px' }}
                                    >
                                      ✏️
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '10px 12px', color: 'var(--ink-soft)', fontSize: '0.82rem' }}>
                                {area.estimatedDays || '2-4 business days'}
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleAreaStatus(area)}
                                  style={{
                                    border: 'none',
                                    borderRadius: '12px',
                                    padding: '4px 10px',
                                    fontSize: '0.76rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    background: area.isActive ? '#DCFCE7' : '#FEE2E2',
                                    color: area.isActive ? '#166534' : '#991B1B',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  title="Click to toggle Active / Inactive"
                                >
                                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: area.isActive ? '#166534' : '#991B1B' }}></span>
                                  {area.isActive ? 'Active' : 'Inactive'}
                                </button>
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteArea(area)}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: '#991B1B',
                                    cursor: 'pointer',
                                    fontSize: '0.82rem',
                                    padding: '4px 8px',
                                    borderRadius: '4px'
                                  }}
                                  title="Delete configured area"
                                >
                                  🗑
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Bulk Delivery Fee Update Modal */}
              {isBulkFeeModalOpen && (
                <div className="admin-subform-backdrop" style={{ zIndex: 1200 }}>
                  <div className="admin-subform-card" style={{ maxWidth: '420px' }}>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--walnut)', marginBottom: '8px' }}>
                      ✏️ Set Common Delivery Fee
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', marginBottom: '16px' }}>
                      Apply a unified delivery fee for <strong>{selectedTableAreaIds.length}</strong> selected area(s).
                    </p>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Delivery Fee (BDT ৳) *</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={bulkFeeInput}
                        onChange={(e) => setBulkFeeInput(e.target.value)}
                        placeholder="e.g. 150"
                        style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '1rem', fontWeight: 700 }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button
                        type="button"
                        className="btn-admin-cancel"
                        onClick={() => setIsBulkFeeModalOpen(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn-admin-primary"
                        onClick={handleBulkUpdateFee}
                      >
                        Apply to {selectedTableAreaIds.length} Area(s)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Product Add/Edit Form Modal */}
        {isProductFormOpen && (
          <div className="admin-subform-backdrop">
            <div className="admin-subform-card">
              <h3>{editingProductId ? '️ Edit Furniture Product' : ' Add New Furniture Product'}</h3>
              <form onSubmit={handleSaveProduct}>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Product Name *</label>
                    <input
                      type="text"
                      required
                      value={productFormData.name}
                      onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                      placeholder="e.g. Noyon Dining Table"
                    />
                  </div>
                  <div className="form-group">
                    <label>Price (৳) *</label>
                    <input
                      type="number"
                      required
                      value={productFormData.price}
                      onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                      placeholder="14200"
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={productFormData.category}
                      onChange={(e) => setProductFormData({ ...productFormData, category: e.target.value })}
                    >
                      {categoriesList.filter(c => c.id !== 'all').map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Room</label>
                    <select
                      value={productFormData.room}
                      onChange={(e) => setProductFormData({ ...productFormData, room: e.target.value })}
                    >
                      {roomsList.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Original Price (৳) (Optional)</label>
                    <input
                      type="number"
                      value={productFormData.originalPrice}
                      onChange={(e) => setProductFormData({ ...productFormData, originalPrice: e.target.value })}
                      placeholder="e.g. 16000"
                    />
                  </div>
                  <div className="form-group">
                    <label>Badge Pill (Optional)</label>
                    <input
                      type="text"
                      value={productFormData.badge}
                      onChange={(e) => setProductFormData({ ...productFormData, badge: e.target.value })}
                      placeholder="e.g. Bestseller, 15% off, New"
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Icon Type (Fallback)</label>
                    <select
                      value={productFormData.iconType}
                      onChange={(e) => setProductFormData({ ...productFormData, iconType: e.target.value })}
                    >
                      <option value="table">Table</option>
                      <option value="study-table">Study Table</option>
                      <option value="dining-chair">Dining Chair</option>
                      <option value="accent-chair">Accent Chair</option>
                      <option value="wardrobe-2door">Wardrobe 2-Door</option>
                      <option value="wardrobe-3door">Wardrobe 3-Door</option>
                      <option value="dressing-table">Dressing Table</option>
                      <option value="bookshelf">Bookshelf</option>
                      <option value="bed-queen">Bed Queen</option>
                      <option value="bed-bunk">Bunk Bed</option>
                      <option value="sofa">Sofa</option>
                      <option value="wall-shelf">Wall Shelf</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Card Background Tone</label>
                    <select
                      value={productFormData.bg}
                      onChange={(e) => setProductFormData({ ...productFormData, bg: e.target.value })}
                    >
                      <option value="var(--surface)">Surface Sand</option>
                      <option value="var(--oak-light)">Oak Light</option>
                      <option value="var(--sage-light)">Sage Light</option>
                    </select>
                  </div>
                </div>

                {/* Primary Image Upload Section */}
                <div className="form-group" style={{ background: '#F8F6F2', padding: '12px 14px', borderRadius: '8px', border: '1px dashed #C9A876', marginBottom: '14px' }}>
                  <label style={{ fontWeight: 600, color: 'var(--walnut)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                     Primary Cover Image *
                    {isUploadingImage && <span style={{ fontSize: '0.8rem', color: '#0077ff' }}>Uploading file to Cloudinary...</span>}
                  </label>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap' }}>
                    {productFormData.image ? (
                      <div style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ccc', background: '#fff' }}>
                        <img src={productFormData.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => setProductFormData({ ...productFormData, image: '' })}
                          style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontSize: '10px', lineHeight: '18px', textAlign: 'center' }}
                          title="Remove main image"
                        >
                          ✕
                        </button>
                      </div>
                    ) : null}

                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageFileChange(e, 'image')}
                        disabled={isUploadingImage}
                        style={{ display: 'block', fontSize: '0.85rem', width: '100%', marginBottom: '6px' }}
                      />
                      <input
                        type="url"
                        placeholder="Or enter direct Cover Image URL (https://...)"
                        value={productFormData.image}
                        onChange={(e) => setProductFormData({ ...productFormData, image: e.target.value })}
                        style={{ fontSize: '0.85rem', width: '100%' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Product Photos (Optional - Up to 3 Extra Photos) */}
                <div className="form-group" style={{ background: '#F9F8F6', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)', marginBottom: '14px' }}>
                  <label style={{ fontWeight: 600, color: 'var(--walnut)', fontSize: '0.88rem', marginBottom: '8px', display: 'block' }}>
                     Additional Product Gallery Photos (Optional - Up to 3 Extra Photos)
                  </label>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { key: 'image2', label: 'Extra Photo 2' },
                      { key: 'image3', label: 'Extra Photo 3' },
                      { key: 'image4', label: 'Extra Photo 4' }
                    ].map(({ key, label }) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {productFormData[key] ? (
                          <div style={{ position: 'relative', width: '44px', height: '44px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #ccc', background: '#fff', flexShrink: 0 }}>
                            <img src={productFormData[key]} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button
                              type="button"
                              onClick={() => setProductFormData({ ...productFormData, [key]: '' })}
                              style={{ position: 'absolute', top: 1, right: 1, background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: '16px', height: '16px', cursor: 'pointer', fontSize: '9px', lineHeight: '16px', textAlign: 'center' }}
                              title="Remove photo"
                            >
                              ✕
                            </button>
                          </div>
                        ) : null}
                        <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageFileChange(e, key)}
                            disabled={isUploadingImage}
                            style={{ fontSize: '0.78rem', width: '130px', flexShrink: 0 }}
                          />
                          <input
                            type="url"
                            placeholder={`${label} URL (https://...)`}
                            value={productFormData[key]}
                            onChange={(e) => setProductFormData({ ...productFormData, [key]: e.target.value })}
                            style={{ fontSize: '0.83rem', flex: 1 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#777', marginTop: '8px', display: 'block' }}>
                     Upload files to Cloudinary or paste direct image URLs. Extra photos render as clickable gallery thumbnails in the single product view modal.
                  </span>
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    required
                    rows="2"
                    value={productFormData.description}
                    onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                    placeholder="Short product overview..."
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Dimensions</label>
                    <input
                      type="text"
                      value={productFormData.dimensions}
                      onChange={(e) => setProductFormData({ ...productFormData, dimensions: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Warranty</label>
                    <input
                      type="text"
                      value={productFormData.warranty}
                      onChange={(e) => setProductFormData({ ...productFormData, warranty: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-actions-right">
                  <button
                    type="button"
                    className="btn-admin-cancel"
                    onClick={() => setIsProductFormOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-admin-primary">
                    {editingProductId ? 'Save Changes' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Promo Poster Add Form Modal */}
        {isPromoFormOpen && (
          <div className="admin-subform-backdrop">
            <div className="admin-subform-card">
              <h3> Add New Home Page Promo Poster</h3>
              <form onSubmit={handleSavePromo}>
                <div className="form-group">
                  <label>Poster Title *</label>
                  <input
                    type="text"
                    required
                    value={promoFormData.title}
                    onChange={(e) => setPromoFormData({ ...promoFormData, title: e.target.value })}
                    placeholder="e.g. Artisanal Chittagong Teak Sets"
                  />
                </div>
                <div className="form-group">
                  <label>Subtitle *</label>
                  <textarea
                    required
                    rows="2"
                    value={promoFormData.subtitle}
                    onChange={(e) => setPromoFormData({ ...promoFormData, subtitle: e.target.value })}
                    placeholder="e.g. Up to 25% Off on handcrafted solid teak..."
                  />
                </div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Badge Header</label>
                    <input
                      type="text"
                      value={promoFormData.badge}
                      onChange={(e) => setPromoFormData({ ...promoFormData, badge: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Discount Pill</label>
                    <input
                      type="text"
                      value={promoFormData.discountPill}
                      onChange={(e) => setPromoFormData({ ...promoFormData, discountPill: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Theme</label>
                    <select
                      value={promoFormData.theme}
                      onChange={(e) => setPromoFormData({ ...promoFormData, theme: e.target.value })}
                    >
                      <option value="walnut-gold">Walnut Gold (Dark Wood)</option>
                      <option value="sage-timber">Sage Timber (Forest Green)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Layout Direction</label>
                    <select
                      value={promoFormData.layoutDirection}
                      onChange={(e) => setPromoFormData({ ...promoFormData, layoutDirection: e.target.value })}
                    >
                      <option value="normal">Normal (Text Left, Art Right)</option>
                      <option value="reverse">Reverse (Art Left, Text Right)</option>
                    </select>
                  </div>
                </div>

                <div className="form-actions-right">
                  <button
                    type="button"
                    className="btn-admin-cancel"
                    onClick={() => setIsPromoFormOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-admin-primary">
                    Create Poster
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Custom Order Confirmation Modal */}
        {confirmModalData && (
          <div className="admin-subform-backdrop" style={{ zIndex: 100000 }}>
            <div className="admin-subform-card" style={{ maxWidth: '540px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Convert Bespoke Commission to Workshop Order
                  </span>
                  <h3 style={{ margin: '4px 0 0', fontFamily: 'Fraunces, serif', color: 'var(--walnut)', fontSize: '1.25rem' }}>
                    Confirm Custom Order #{confirmModalData.inquiry?._id?.slice(-6)?.toUpperCase()}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmModalData(null)}
                  style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--ink-soft)' }}
                >
                  ✕
                </button>
              </div>

              {/* Inquiry Summary Box */}
              <div style={{ background: '#F8F6F2', border: '1px solid #E5E1D8', borderRadius: '8px', padding: '12px 14px', marginBottom: '18px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--ink-soft)' }}>Customer:</span>
                  <strong>{confirmModalData.inquiry?.customerName || confirmModalData.inquiry?.userId?.name || 'Customer'} ({confirmModalData.inquiry?.phone})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--ink-soft)' }}>Piece:</span>
                  <strong>{confirmModalData.inquiry?.productType}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--ink-soft)' }}>Dimensions:</span>
                  <strong>
                    {confirmModalData.inquiry?.dimensions?.height} (H) × {confirmModalData.inquiry?.dimensions?.width} (W) × {confirmModalData.inquiry?.dimensions?.depth} (D) {confirmModalData.inquiry?.dimensions?.unit || 'inch'}
                  </strong>
                </div>
              </div>

              <form onSubmit={handleConfirmOrderSubmit}>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label style={{ fontWeight: 600, color: 'var(--walnut)' }}>
                    Agreed Custom Price / Quote (৳) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    autoFocus
                    placeholder="e.g. 35000"
                    value={confirmModalData.agreedPrice}
                    onChange={(e) => setConfirmModalData({ ...confirmModalData, agreedPrice: e.target.value })}
                    style={{ fontSize: '1.05rem', fontWeight: 600, borderColor: '#C9A876' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', marginTop: '4px', display: 'block' }}>
                    Agreed price finalized with customer over phone call or WhatsApp consultation.
                  </span>
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label style={{ fontWeight: 600, color: 'var(--walnut)' }}>
                    Customer Shipping / Delivery Address *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. House 12, Road 4, Sector 7, Uttara, Dhaka"
                    value={confirmModalData.shippingAddress}
                    onChange={(e) => setConfirmModalData({ ...confirmModalData, shippingAddress: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label style={{ fontWeight: 600, color: 'var(--walnut)' }}>
                    Payment Method
                  </label>
                  <select
                    value={confirmModalData.paymentMethod}
                    onChange={(e) => setConfirmModalData({ ...confirmModalData, paymentMethod: e.target.value })}
                  >
                    <option value="Cash on Delivery (Custom Order)">Cash on Delivery (Custom Order)</option>
                    <option value="bKash (Advance Received)">bKash (Advance Received)</option>
                    <option value="Nagad (Advance Received)">Nagad (Advance Received)</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label style={{ fontWeight: 600, color: 'var(--walnut)' }}>
                    Admin / Workshop Notes (Optional)
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Specific wood shade, grain notes, or workshop deadline..."
                    value={confirmModalData.notes}
                    onChange={(e) => setConfirmModalData({ ...confirmModalData, notes: e.target.value })}
                  />
                </div>

                <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '6px', padding: '10px 12px', fontSize: '0.8rem', color: '#92400E', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>ℹ️</span>
                  <span>
                    Confirming will automatically generate an Order with status <strong>Pending</strong>. You can then track and update its workshop status in the <strong>Orders</strong> tab.
                  </span>
                </div>

                <div className="form-actions-right" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn-admin-cancel"
                    disabled={confirmModalData.isSubmitting}
                    onClick={() => setConfirmModalData(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-admin-primary"
                    disabled={confirmModalData.isSubmitting}
                    style={{ background: '#166534', borderColor: '#166534' }}
                  >
                    {confirmModalData.isSubmitting ? 'Converting...' : '✓ Confirm & Create Order (Pending)'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanelModal;
