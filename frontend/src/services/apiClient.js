import axios from 'axios';
import secureStorage from '../utils/secureStorage';
import { isJWTExpired } from '../utils/jwtDecoder';

const normalizeApiBaseUrl = (rawBaseUrl) => {
  const fallback = 'http://localhost:5000/api';
  const base = (rawBaseUrl || fallback).trim().replace(/\/+$/, '');
  return /\/api$/i.test(base) ? base : `${base}/api`;
};

const RAW_API_URL = String(import.meta.env.VITE_API_URL || '').trim();
const ENABLE_MOCK_AUTH = String(import.meta.env.VITE_ENABLE_MOCK_AUTH || 'false').toLowerCase() === 'true';
const ENABLE_MOCK_BACKEND = String(import.meta.env.VITE_ENABLE_MOCK_BACKEND || 'false').toLowerCase() === 'true';
const USE_MOCK_API = ENABLE_MOCK_BACKEND || (ENABLE_MOCK_AUTH && RAW_API_URL.length === 0);
export const API_BASE_URL = normalizeApiBaseUrl(RAW_API_URL);

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
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      lastLogin: nowIso()
    },
    {
      id: 'u-analyst-1',
      email: 'analyst.garcia@tucreditoonline.local',
      fullName: 'Laura García',
      role: 'Analista',
      isActive: true,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'u-analyst-2',
      email: 'analyst.morales@tucreditoonline.local',
      fullName: 'Diego Morales',
      role: 'Analista',
      isActive: true,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'u-analyst-3',
      email: 'analyst.torres@tucreditoonline.local',
      fullName: 'Sofía Torres',
      role: 'Analista',
      isActive: false,
      createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
      lastLogin: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  creditRequests: [
    {
      id: 'cr-1',
      fullName: 'Ana Gomez',
      email: 'ana@example.com',
      phone: '+52 55 9876 0001',
      identificationNumber: 'MX-0001234',
      address: 'Av. Reforma 222, Piso 3, Juárez, CDMX',
      employmentStatus: 'Employed',
      monthlySalary: 28000,
      yearsOfEmployment: 4,
      creditType: 'Personal Credit',
      useOfMoney: 'Home renovations and furniture',
      requestedAmount: 15000,
      termYears: 2,
      interestRate: 18,
      monthlyPayment: 760,
      totalPayment: 18240,
      totalInterest: 3240,
      requestDate: nowIso(),
      status: 'Pending'
    },
    {
      id: 'cr-2',
      fullName: 'Luis Perez',
      email: 'luis@example.com',
      phone: '+52 55 9876 0002',
      identificationNumber: 'MX-0002345',
      address: 'Calle Insurgentes 450, Narvarte, CDMX',
      employmentStatus: 'Self-Employed',
      monthlySalary: 62000,
      yearsOfEmployment: 8,
      creditType: 'Business Credit',
      useOfMoney: 'Equipment acquisition for workshop',
      requestedAmount: 50000,
      termYears: 3,
      interestRate: 16,
      monthlyPayment: 1850,
      totalPayment: 66600,
      totalInterest: 16600,
      requestDate: nowIso(),
      status: 'Approved',
      approvedDate: nowIso(),
      approvedAmount: 50000,
      approvedTermMonths: 36,
      remarks: 'Excellent credit history. Approved at requested amount.'
    },
    {
      id: 'cr-3',
      fullName: 'Maria Diaz',
      email: 'maria@example.com',
      phone: '+52 55 9876 0003',
      identificationNumber: 'MX-0003456',
      address: 'Blvd. Adolfo López Mateos 1001, Álvaro Obregón, CDMX',
      employmentStatus: 'Employed',
      monthlySalary: 14500,
      yearsOfEmployment: 1,
      creditType: 'Express Credit',
      useOfMoney: 'Medical expenses',
      requestedAmount: 8000,
      termYears: 1,
      interestRate: 24,
      monthlyPayment: 740,
      totalPayment: 8880,
      totalInterest: 880,
      requestDate: nowIso(),
      status: 'Rejected',
      rejectedDate: nowIso(),
      remarks: 'Insufficient income for requested amount. Please reapply with a lower amount.'
    },
    {
      id: 'cr-4',
      fullName: 'Carlos Ramos',
      email: 'carlos@example.com',
      phone: '+52 55 9876 0004',
      identificationNumber: 'MX-0004567',
      address: 'Av. Universidad 1200, Coyoacán, CDMX',
      employmentStatus: 'Employed',
      monthlySalary: 45000,
      yearsOfEmployment: 6,
      creditType: 'Consolidation Credit',
      useOfMoney: 'Debt consolidation — 3 credit cards',
      requestedAmount: 120000,
      termYears: 5,
      interestRate: 15,
      monthlyPayment: 2852,
      totalPayment: 171120,
      totalInterest: 51120,
      requestDate: nowIso(),
      status: 'Pending'
    }
  ],
  contactMessages: [
    {
      id: 'msg-1',
      name: 'John Smith',
      email: 'john@example.com',
      subject: 'Early payment — any penalties?',
      message: 'Hello, I have a personal credit and I would like to know if I can pay it off early without any penalties. Thank you.',
      status: 0,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'msg-2',
      name: 'Patricia Herrera',
      email: 'patricia.h@example.com',
      subject: 'Documentation required for credit application',
      message: 'Good afternoon, I would like to know which documents I need to provide to apply for the Express Credit. I am self-employed.',
      status: 1,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      adminNotes: 'Sent list of required documents via email.'
    },
    {
      id: 'msg-3',
      name: 'Roberto Fuentes',
      email: 'r.fuentes@example.com',
      subject: 'Issue accessing my account',
      message: 'I cannot log in to my account. I have tried resetting my password but never receive the email. Please help.',
      status: 2,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      respondedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      respondedBy: 'Laura García'
    },
    {
      id: 'msg-4',
      name: 'Elena Castillo',
      email: 'elena.c@example.com',
      subject: 'Thank you for the fast service',
      message: 'I just wanted to say thank you. The credit was approved in less than 24 hours and the process was very simple. I will definitely recommend you.',
      status: 3,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      closedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      closedBy: 'System Administrator'
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
      description: 'For personal expenses: travel, home improvements, emergencies and more.',
      baseInterestRate: 18,
      minAmount: 5000,
      maxAmount: 200000,
      minTermMonths: 12,
      maxTermMonths: 60,
      isActive: true
    },
    {
      id: 'ct-2',
      name: 'Express Credit',
      description: 'Same-day approval for small amounts. No collateral required.',
      baseInterestRate: 24,
      minAmount: 1000,
      maxAmount: 50000,
      minTermMonths: 6,
      maxTermMonths: 24,
      isActive: true
    },
    {
      id: 'ct-3',
      name: 'Consolidation Credit',
      description: 'Combine all your existing debts into one manageable monthly payment.',
      baseInterestRate: 15,
      minAmount: 10000,
      maxAmount: 300000,
      minTermMonths: 24,
      maxTermMonths: 120,
      isActive: true
    },
    {
      id: 'ct-4',
      name: 'Business Credit',
      description: 'Flexible financing to grow your business or cover operating costs.',
      baseInterestRate: 16,
      minAmount: 20000,
      maxAmount: 500000,
      minTermMonths: 12,
      maxTermMonths: 84,
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

const mockResponse = (config, data, status = 200, headers = {}) =>
  Promise.resolve({
    data,
    status,
    statusText: getMockStatusText(status),
    headers,
    config,
    request: {}
  });

const normalizePath = (url = '') => {
  if (!url) return '/';
  const clean = url.replace(/^https?:\/\/[^/]+/i, '');
  return clean.startsWith('/') ? clean : `/${clean}`;
};

const getUserList = (config, params) => {
  const page = Number(params.page || 1);
  const pageSize = Number(params.pageSize || 10);
  const search = String(params.search || '').toLowerCase().trim();
  const filtered = search
    ? mockDb.users.filter((u) => u.email.toLowerCase().includes(search) || u.fullName.toLowerCase().includes(search))
    : mockDb.users;
  const start = (page - 1) * pageSize;
  return mockResponse(config, { users: filtered.slice(start, start + pageSize), totalCount: filtered.length, page, pageSize });
};

const handleUserRoutes = (config, method, path, data, params) => {
  if (method === 'get' && path === '/users') return getUserList(config, params);
  if (method === 'get' && path.startsWith('/users/')) {
    const userId = path.split('/')[2];
    const user = mockDb.users.find((u) => u.id === userId) ?? null;
    return mockResponse(config, user, user ? 200 : 404);
  }
  if (method === 'post' && path === '/users/change-password') return mockResponse(config, true);
  if (method === 'post' && path === '/users') {
    const user = { id: id('u'), ...data, isActive: data.isActive ?? true, createdAt: nowIso(), lastLogin: null };
    mockDb.users.unshift(user);
    return mockResponse(config, user, 201);
  }
  if (method === 'put' && path.startsWith('/users/')) {
    const userId = path.split('/')[2];
    const idx = mockDb.users.findIndex((u) => u.id === userId);
    const updated = idx >= 0 ? { ...mockDb.users[idx], ...data } : null;
    if (idx >= 0) mockDb.users.splice(idx, 1, updated);
    return mockResponse(config, updated);
  }
  if (method === 'delete' && path.startsWith('/users/')) {
    const userId = path.split('/')[2];
    mockDb.users = mockDb.users.filter((u) => u.id !== userId);
    return mockResponse(config, true);
  }
  return null;
};

const handleDashboardRoutes = (config, method, path) => {
  if (method === 'get' && path === '/dashboard/stats') return mockResponse(config, buildDashboardStats());
  if (method === 'get' && path === '/dashboard/status-distribution') return mockResponse(config, buildStatusDistribution());
  return null;
};

const handleCreditRequestRoutes = (config, method, path, data) => {
  if (method === 'get' && path === '/creditrequests') return mockResponse(config, mockDb.creditRequests);
  if (method === 'get' && path.startsWith('/creditrequests/')) {
    const reqId = path.split('/')[2];
    const req = mockDb.creditRequests.find((r) => r.id === reqId) || null;
    return mockResponse(config, req, req ? 200 : 404);
  }
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
  return null;
};

const handleContactMessageRoutes = (config, method, path, data, params) => {
  if (method === 'get' && path === '/contactmessages') {
    const status = params.status;
    const list = status === undefined || status === null
      ? mockDb.contactMessages
      : mockDb.contactMessages.filter((m) => Number(m.status) === Number(status));
    return mockResponse(config, list);
  }
  if (method === 'get' && path.startsWith('/contactmessages/')) {
    const msgId = path.split('/')[2];
    const msg = mockDb.contactMessages.find((m) => m.id === msgId) || null;
    return mockResponse(config, msg, msg ? 200 : 404);
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
  return null;
};

const handleServiceRoutes = (config, method, path, data) => {
  if (method === 'get' && path === '/services') return mockResponse(config, mockDb.services);
  if (method === 'get' && path.startsWith('/services/')) {
    const svcId = path.split('/')[2];
    const svc = mockDb.services.find((s) => s.id === svcId) || null;
    return mockResponse(config, svc, svc ? 200 : 404);
  }
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
  return null;
};

const handleCreditTypeRoutes = (config, method, path, data) => {
  if (method === 'get' && path === '/credittypes') return mockResponse(config, mockDb.creditTypes);
  if (method === 'get' && path.startsWith('/credittypes/')) {
    const ctId = path.split('/')[2];
    const ct = mockDb.creditTypes.find((c) => c.id === ctId) || null;
    return mockResponse(config, ct, ct ? 200 : 404);
  }
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
  return null;
};

const attachMockAdapter = (config) => {
  config.adapter = async () => {
    const method = (config.method || 'get').toLowerCase();
    const path = normalizePath(config.url);
    const data = typeof config.data === 'string'
      ? (() => { try { return JSON.parse(config.data || '{}'); } catch { return {}; } })()
      : (config.data || {});
    const params = config.params || {};

    const dashResult = await handleDashboardRoutes(config, method, path);
    if (dashResult !== null) return dashResult;

    const userResult = await handleUserRoutes(config, method, path, data, params);
    if (userResult !== null) return userResult;

    const crResult = await handleCreditRequestRoutes(config, method, path, data);
    if (crResult !== null) return crResult;

    const msgResult = await handleContactMessageRoutes(config, method, path, data, params);
    if (msgResult !== null) return msgResult;

    const svcResult = await handleServiceRoutes(config, method, path, data);
    if (svcResult !== null) return svcResult;

    const ctResult = await handleCreditTypeRoutes(config, method, path, data);
    if (ctResult !== null) return ctResult;

    if (method === 'get' && path === '/health') return mockResponse(config, { status: 'Healthy' });
    if (method === 'get' && path === '/backup/generate') {
      const filename = `backup-mock-${new Date().toISOString().slice(0, 10)}.zip`;
      const payload = `Mock backup generated at ${new Date().toISOString()}`;
      return mockResponse(config, payload, 200, { 'content-disposition': `attachment; filename="${filename}"` });
    }
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
    if (USE_MOCK_API) {
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
