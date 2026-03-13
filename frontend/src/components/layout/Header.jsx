import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

const Header = () => {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-soft sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">TC</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">TuCreditoOnline</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-primary-600 transition font-medium">
              {t('header.home')}
            </Link>
            <Link to="/services" className="text-gray-700 hover:text-primary-600 transition font-medium">
              {t('header.services')}
            </Link>
            <Link to="/calculator" className="text-gray-700 hover:text-primary-600 transition font-medium">
              {t('header.calculator')}
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-primary-600 transition font-medium">
              {t('header.about')}
            </Link>
            <Link to="/faq" className="text-gray-700 hover:text-primary-600 transition font-medium">
              {t('header.faq')}
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-primary-600 transition font-medium">
              {t('header.contact')}
            </Link>
            <Link to="/legal" className="text-gray-700 hover:text-primary-600 transition font-medium">
              {t('header.legal')}
            </Link>
          </div>

          {/* Language Selector & Admin Login */}
          <div className="hidden md:flex items-center space-x-3">
            <LanguageSelector />
            <Link
              to="/admin/login"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>{t('header.adminLogin')}</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
            <div className="flex flex-col space-y-3">
              <div className="mb-2">
                <LanguageSelector />
              </div>
              <Link to="/" className="text-gray-700 hover:text-primary-600 transition font-medium" onClick={() => setMobileMenuOpen(false)}>
                {t('header.home')}
              </Link>
              <Link to="/services" className="text-gray-700 hover:text-primary-600 transition font-medium" onClick={() => setMobileMenuOpen(false)}>
                {t('header.services')}
              </Link>
              <Link to="/calculator" className="text-gray-700 hover:text-primary-600 transition font-medium" onClick={() => setMobileMenuOpen(false)}>
                {t('header.calculator')}
              </Link>
              <Link to="/about" className="text-gray-700 hover:text-primary-600 transition font-medium" onClick={() => setMobileMenuOpen(false)}>
                {t('header.about')}
              </Link>
              <Link to="/faq" className="text-gray-700 hover:text-primary-600 transition font-medium" onClick={() => setMobileMenuOpen(false)}>
                {t('header.faq')}
              </Link>
              <Link to="/contact" className="text-gray-700 hover:text-primary-600 transition font-medium" onClick={() => setMobileMenuOpen(false)}>
                {t('header.contact')}
              </Link>
              <Link to="/legal" className="text-gray-700 hover:text-primary-600 transition font-medium" onClick={() => setMobileMenuOpen(false)}>
                {t('header.legal')}
              </Link>
              <Link
                to="/admin/login"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('header.adminLogin')}
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
