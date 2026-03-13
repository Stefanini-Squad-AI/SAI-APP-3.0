import axios from 'axios';
import secureStorage from '../utils/secureStorage';
import { isJWTExpired } from '../utils/jwtDecoder';

const normalizeApiBaseUrl = (rawBaseUrl) => {
  const fallback = 'http://localhost:5000/api';
  const base = (rawBaseUrl || fallback).trim().replace(/\/+$/, '');
  return /\/api$/i.test(base) ? base : `${base}/api`;
};

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
const USE_MOCK_AUTH = String(import.meta.env.VITE_ENABLE_MOCK_AUTH || 'false').toLowerCase() === 'true';

const nowIso = () => new Date().toISOString();
const id = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const mockDb = {
  users: [
    {
      id: 'u-admin',
      email: (import.meta.env.VITE_DEFAULT_ADMIN_EMAIL || 'admin@tucreditoonline.local').trim().toLowerCase(),
      fullName: 'System Administrator',
      role: 'Admin',
      isActive: true,
      createdAt: nowIso(),
      lastLogin: nowIso()
    }
  ],
  creditRequests: [
    {
      id: 'cr-1',
      fullName: 'Ana Gomez',
      email: 'ana@example.com',
      requestedAmount: 15000,
      termYears: 2,
      monthlyPayment: 760,
      requestDate: nowIso(),
      status: 'Pending'
    },
    {
      id: 'cr-2',
      fullName: 'Luis Perez',
      email: 'luis@example.com',
      requestedAmount: 50000,
      termYears: 3,
      monthlyPayment: 1850,
      requestDate: nowIso(),
      status: 'Approved'
    },
    {
      id: 'cr-3',
      fullName: 'Maria Diaz',
      email: 'maria@example.com',
      requestedAmount: 8000,
      termYears: 1,
      monthlyPayment: 740,
      requestDate: nowIso(),
      status: 'Rejected'
    }
  ],
  contactMessages: [
    {
      id: 'msg-1',
      name: 'John Smith',
      email: 'john@example.com',
      subject: 'Credit question',
      message: 'Can I pay early without penalty?',
      status: 0,
      createdAt: nowIso()
    }
  ],
  services: [
    {
      id: 'svc-1',
      icon: '💳',
      title: 'Personal Credit',
      description: 'Fast credit for personal goals.',
      displayOrder: 1,
      isActive: true
    },
    {
      id: 'svc-2',
      icon: '⚡',
      title: 'Express Credit',
      description: 'Small amounts with same-day response.',
      displayOrder: 2,
      isActive: true
    }
  ],
  creditTypes: [
    {
      id: 'ct-1',
      name: 'Personal Credit',
      description: 'General purpose credit',
      baseInterestRate: 18,
      minAmount: 5000,
      maxAmount: 200000,
      minTermMonths: 12,
      maxTermMonths: 60,
      isActive: true
    }
  ]
};

const buildDashboardStats = () => {
  const totalCreditRequests = mockDb.creditRequests.length;
  const pendingRequests = mockDb.creditRequests.filter((r) => r.status === 'Pending').length;
  const approvedRequests = mockDb.creditRequests.filter((r) => r.status === 'Approved').length;
  const rejectedRequests = mockDb.creditRequests.filter((r) => r.status === 'Rejected').length;
  const underReviewRequests = 0;
  const totalUsers = mockDb.users.length;
  const newUsersThisMonth = mockDb.users.length;
  const totalApprovedAmount = mockDb.creditRequests
    .filter((r) => r.status === 'Approved')
    .reduce((sum, r) => sum + (r.requestedAmount || 0), 0);
  const averageRequestAmount = totalCreditRequests
    ? Math.round(mockDb.creditRequests.reduce((sum, r) => sum + (r.requestedAmount || 0), 0) / totalCreditRequests)
    : 0;

  return {
    totalCreditRequests,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    underReviewRequests,
    totalUsers,
    newUsersThisMonth,
    totalApprovedAmount,
    averageRequestAmount,
    monthlyStats: [
      { month: 'Jan', approved: 4, rejected: 1 },
      { month: 'Feb', approved: 5, rejected: 2 },
      { month: 'Mar', approved: 3, rejected: 1 },
      { month: 'Apr', approved: 6, rejected: 2 },
      { month: 'May', approved: 4, rejected: 1 },
      { month: 'Jun', approved: 5, rejected: 2 }
    ]
  };
};

const buildStatusDistribution = () => {
  const total = mockDb.creditRequests.length || 1;
  return ['Pending', 'Approved', 'Rejected'].map((status) => {
    const count = mockDb.creditRequests.filter((r) => r.status === status).length;
    return { status, count, percentage: Math.round((count / total) * 100) };
  });
};

const getMockStatusText = (status) => {
  if (status === 200) return 'OK';
  if (status === 201) return 'Created';
  return 'Error';
};

const mockResponse = (config, data, status = 200) =>
  Promise.resolve({
    data,
    status,
    statusText: getMockStatusText(status),
    headers: {},
    config,
    request: {}
  });

const normalizePath = (url = '') => {
  if (!url) return '/';
  const clean = url.replace(/^https?:\/\/[^/]+/i, '');
  return clean.startsWith('/') ? clean : `/${clean}`;
};

const attachMockAdapter = (config) => {
  config.adapter = async () => {
    const method = (config.method || 'get').toLowerCase();
    const path = normalizePath(config.url);
    const data = typeof config.data === 'string'
      ? (() => {
        try { return JSON.parse(config.data || '{}'); } catch { return {}; }
      })()
      : (config.data || {});
    const params = config.params || {};

    if (method === 'get' && path === '/dashboard/stats') return mockResponse(config, buildDashboardStats());
    if (method === 'get' && path === '/dashboard/status-distribution') return mockResponse(config, buildStatusDistribution());

    if (method === 'get' && path === '/users') {
      const page = Number(params.page || 1);
      const pageSize = Number(params.pageSize || 10);
      const search = String(params.search || '').toLowerCase().trim();
      const filtered = search
        ? mockDb.users.filter((u) => u.email.toLowerCase().includes(search) || u.fullName.toLowerCase().includes(search))
        : mockDb.users;
      const start = (page - 1) * pageSize;
      return mockResponse(config, {
        users: filtered.slice(start, start + pageSize),
        totalCount: filtered.length,
        page,
        pageSize
      });
    }
    if (method === 'post' && path === '/users') {
      const user = { id: id('u'), ...data, isActive: data.isActive ?? true, createdAt: nowIso(), lastLogin: null };
      mockDb.users.unshift(user);
      return mockResponse(config, user, 201);
    }
    if (method === 'put' && path.startsWith('/users/')) {
      const userId = path.split('/')[2];
      const idx = mockDb.users.findIndex((u) => u.id === userId);
      if (idx >= 0) mockDb.users[idx] = { ...mockDb.users[idx], ...data };
      return mockResponse(config, mockDb.users[idx] || null);
    }
    if (method === 'delete' && path.startsWith('/users/')) {
      const userId = path.split('/')[2];
      mockDb.users = mockDb.users.filter((u) => u.id !== userId);
      return mockResponse(config, true);
    }
    if (method === 'post' && path === '/users/change-password') return mockResponse(config, true);

    if (method === 'get' && path === '/creditrequests') return mockResponse(config, mockDb.creditRequests);
    if (method === 'post' && path === '/creditrequests') {
      const item = { id: id('cr'), ...data, requestDate: nowIso(), status: 'Pending' };
      mockDb.creditRequests.unshift(item);
      return mockResponse(config, item, 201);
    }
    if (method === 'post' && /\/creditrequests\/[^/]+\/approve$/i.test(path)) {
      const reqId = path.split('/')[2];
      mockDb.creditRequests = mockDb.creditRequests.map((r) => (r.id === reqId ? { ...r, status: 'Approved' } : r));
      return mockResponse(config, true);
    }
    if (method === 'post' && /\/creditrequests\/[^/]+\/reject$/i.test(path)) {
      const reqId = path.split('/')[2];
      mockDb.creditRequests = mockDb.creditRequests.map((r) => (r.id === reqId ? { ...r, status: 'Rejected' } : r));
      return mockResponse(config, true);
    }

    if (method === 'get' && path === '/contactmessages') {
      const status = params.status;
      const list = status === undefined || status === null
        ? mockDb.contactMessages
        : mockDb.contactMessages.filter((m) => Number(m.status) === Number(status));
      return mockResponse(config, list);
    }
    if (method === 'post' && path === '/contactmessages') {
      const msg = { id: id('msg'), ...data, status: 0, createdAt: nowIso() };
      mockDb.contactMessages.unshift(msg);
      return mockResponse(config, msg, 201);
    }
    if (method === 'patch' && /\/contactmessages\/[^/]+\/status$/i.test(path)) {
      const msgId = path.split('/')[2];
      mockDb.contactMessages = mockDb.contactMessages.map((m) => (m.id === msgId ? { ...m, status: data.status, adminNotes: data.adminNotes || '' } : m));
      return mockResponse(config, true);
    }
    if (method === 'delete' && path.startsWith('/contactmessages/')) {
      const msgId = path.split('/')[2];
      mockDb.contactMessages = mockDb.contactMessages.filter((m) => m.id !== msgId);
      return mockResponse(config, true);
    }

    if (method === 'get' && path === '/services') return mockResponse(config, mockDb.services);
    if (method === 'post' && path === '/services') {
      const svc = { id: id('svc'), ...data, isActive: data.isActive ?? true };
      mockDb.services.push(svc);
      return mockResponse(config, svc, 201);
    }
    if (method === 'put' && path.startsWith('/services/')) {
      const svcId = path.split('/')[2];
      mockDb.services = mockDb.services.map((s) => (s.id === svcId ? { ...s, ...data } : s));
      return mockResponse(config, true);
    }
    if (method === 'delete' && path.startsWith('/services/')) {
      const svcId = path.split('/')[2];
      mockDb.services = mockDb.services.filter((s) => s.id !== svcId);
      return mockResponse(config, true);
    }

    if (method === 'get' && path === '/credittypes') return mockResponse(config, mockDb.creditTypes);
    if (method === 'post' && path === '/credittypes') {
      const ct = { id: id('ct'), ...data, isActive: data.isActive ?? true };
      mockDb.creditTypes.push(ct);
      return mockResponse(config, ct, 201);
    }
    if (method === 'put' && path.startsWith('/credittypes/')) {
      const ctId = path.split('/')[2];
      mockDb.creditTypes = mockDb.creditTypes.map((c) => (c.id === ctId ? { ...c, ...data } : c));
      return mockResponse(config, true);
    }
    if (method === 'delete' && path.startsWith('/credittypes/')) {
      const ctId = path.split('/')[2];
      mockDb.creditTypes = mockDb.creditTypes.filter((c) => c.id !== ctId);
      return mockResponse(config, true);
    }

    if (method === 'get' && path === '/health') return mockResponse(config, { status: 'Healthy' });
    if (method === 'get' && path === '/backup/status') return mockResponse(config, { isAvailable: false, mode: 'mock' });

    return mockResponse(config, { error: `Mock route not implemented for ${method.toUpperCase()} ${path}` }, 404);
  };
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config) => {
    if (USE_MOCK_AUTH) {
      attachMockAdapter(config);
      return config;
    }

    const token = secureStorage.getAuthToken();
    if (token && !isJWTExpired(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (token && isJWTExpired(token)) {
      secureStorage.clearAuth();
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      secureStorage.clearAuth();
      if (!globalThis.location.pathname.includes('/admin/login')) {
        globalThis.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
