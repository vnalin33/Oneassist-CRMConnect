

export const APP_NAME = 'CRMConnect';
export const COMPANY_NAME = 'One Assist Technologies';

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  LEADS: '/leads',
  CONTACTS: '/contacts',
  INVOICES: '/invoices',
  PAYOUTS: '/payouts',
  PROFILE: '/profile',
  SETTINGS: '/settings',
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VALIDATE: '/auth/validate',
    LOGOUT: '/auth/logout',
  },
  LEADS: {
    LIST: '/leads',
    CREATE: '/leads',
    UPDATE: '/leads/:id',
    DELETE: '/leads/:id',
    DETAILS: '/leads/:id',
  },
  USERS: {
    PROFILE: '/users/profile',
    UPDATE: '/users/profile',
  },
};

export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
};

export const STORAGE_KEYS = {
  TOKEN: 'crm-token',
  THEME: 'crm-theme',
  USER: 'crm-user',
};
