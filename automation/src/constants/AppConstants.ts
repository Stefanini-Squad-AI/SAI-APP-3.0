/**
 * Global application constants for TuCreditoOnline automation.
 * BASE_URL defaults to the GitHub Pages deployment but can be
 * overridden with the BASE_URL environment variable — useful for
 * PR preview URLs (Surge.sh) or local Docker dev runs.
 */

const DEFAULT_BASE_URL = 'https://stefanini-squad-ai.github.io/SAI-APP-3.0';

export const AppConstants = {
  BASE_URL: process.env.BASE_URL || DEFAULT_BASE_URL,

  // Public routes
  ROUTES: {
    HOME:       '/',
    SERVICES:   '/services',
    ABOUT:      '/about',
    FAQ:        '/faq',
    CONTACT:    '/contact',
    CALCULATOR: '/calculator',
    PRIVACY:    '/privacy',
    TERMS:      '/terms',
    ADMIN_LOGIN: '/admin/login',
  },

  // Expected section titles per language (used in assertions)
  SECTION_TITLES: {
    en: {
      about:    'about us',
      services: 'our services',
      visit:    'visit us',
    },
    es: {
      about:    'sobre nosotros',
      services: 'nuestros servicios',
      visit:    'visítanos',
    },
    pt: {
      about:    'sobre nós',
      services: 'nossos serviços',
      visit:    'visite-nos',
    },
  },

  // Services page expected titles
  SERVICES_TITLES: {
    en: { hero: 'our services', cta: 'not sure which one to choose' },
    es: { hero: 'nuestros servicios', cta: '¿no estás seguro cuál elegir?' },
    pt: { hero: 'nossos serviços', cta: 'não tem certeza qual escolher?' },
  },
} as const;
