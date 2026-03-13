import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';
import Swal from 'sweetalert2';
import LanguageSelector from '../../components/layout/LanguageSelector';

const DEFAULT_ADMIN_EMAIL = import.meta.env.VITE_DEFAULT_ADMIN_EMAIL || 'admin@tucreditoonline.local';
const DEFAULT_ADMIN_PASSWORD = import.meta.env.VITE_DEFAULT_ADMIN_PASSWORD || 'Admin123!';

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const fillAdminCredentials = () => {
    setFormData({
      email: DEFAULT_ADMIN_EMAIL,
      password: DEFAULT_ADMIN_PASSWORD
    });
    setErrors({});
  };

  const copyToClipboard = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      await Swal.fire({
        icon: 'success',
        title: `${label} copied`,
        text: value,
        timer: 1600,
        showConfirmButton: false
      });
    } catch {
      await Swal.fire({
        icon: 'error',
        title: 'Copy failed',
        text: `Could not copy ${label.toLowerCase()}.`
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear field error on change
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = t('loginPage.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('loginPage.emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('loginPage.passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('loginPage.passwordMin');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const result = await authService.login(formData.email, formData.password);

    setIsLoading(false);

    if (result.success) {
      login(
        {
          email: result.data.email,
          fullName: result.data.fullName,
          role: result.data.role
        },
        result.data.token,
        result.data.expiresAt
      );

      await Swal.fire({
        icon: 'success',
        title: t('loginPage.welcome'),
        text: `${t('loginPage.hello')} ${result.data.fullName}`,
        timer: 2000,
        showConfirmButton: false
      });

      navigate('/admin/dashboard');
    } else {
      Swal.fire({
        icon: 'error',
        title: t('loginPage.loginError'),
        text: result.error,
        confirmButtonText: t('loginPage.close'),
        confirmButtonColor: '#dc2626'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4 relative">
      <div className="max-w-md w-full">
        {/* Language Selector */}
        <div className="absolute top-4 right-4">
          <LanguageSelector />
        </div>
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 text-3xl font-bold text-primary-600 mb-4">
            <div className="w-12 h-12 bg-primary-600 text-white rounded-lg flex items-center justify-center text-2xl">
              TC
            </div>
            <span>TuCreditoOnline</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-4">{t('loginPage.title')}</h1>
          <p className="text-gray-600 mt-2">{t('loginPage.subtitle')}</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <p className="text-sm font-semibold text-blue-900">Default admin credentials</p>
          <p className="text-xs text-blue-700 mt-1">Use these credentials for quick access in local/dev and preview environments.</p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={DEFAULT_ADMIN_EMAIL}
                readOnly
                className="w-full px-3 py-2 border border-blue-200 bg-white rounded-lg text-sm"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(DEFAULT_ADMIN_EMAIL, 'Email')}
                className="px-3 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Copy
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={DEFAULT_ADMIN_PASSWORD}
                readOnly
                className="w-full px-3 py-2 border border-blue-200 bg-white rounded-lg text-sm"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(DEFAULT_ADMIN_PASSWORD, 'Password')}
                className="px-3 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Copy
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={fillAdminCredentials}
            className="mt-3 w-full px-4 py-2 text-sm font-medium bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200"
          >
            Use these credentials
          </button>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('loginPage.email')}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="admin@tucreditoonline.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('loginPage.password')}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{t('loginPage.loggingIn')}</span>
                </>
              ) : (
                <span>{t('loginPage.login')}</span>
              )}
            </button>
          </form>

          {/* Back link */}
          <div className="mt-6 text-center">
            <Link to="/" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              {t('loginPage.backHome')}
            </Link>
          </div>
        </div>

        {/* Info footer */}
        <p className="text-center text-gray-600 text-sm mt-6">
          {t('loginPage.jwtInfo')}
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
