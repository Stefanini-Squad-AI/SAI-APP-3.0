import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const LegalInfoPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">{t('legalInfoPage.title')}</h1>
          <p className="text-primary-100 text-lg">{t('legalInfoPage.subtitle')}</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-2xl shadow-soft p-8 md:p-12 space-y-8">
            <p className="text-gray-600 leading-relaxed">{t('legalInfoPage.intro')}</p>

            <div className="grid gap-4 sm:grid-cols-1">
              <Link
                to="/privacy"
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition"
              >
                <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{t('legalInfoPage.privacyTitle')}</h2>
                  <p className="text-sm text-gray-500">{t('legalInfoPage.privacyDesc')}</p>
                </div>
                <span className="ml-auto text-primary-600">→</span>
              </Link>

              <Link
                to="/terms"
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition"
              >
                <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{t('legalInfoPage.termsTitle')}</h2>
                  <p className="text-sm text-gray-500">{t('legalInfoPage.termsDesc')}</p>
                </div>
                <span className="ml-auto text-primary-600">→</span>
              </Link>

              <Link
                to="/terms"
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition"
              >
                <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{t('legalInfoPage.legalNoticeTitle')}</h2>
                  <p className="text-sm text-gray-500">{t('legalInfoPage.legalNoticeDesc')}</p>
                </div>
                <span className="ml-auto text-primary-600">→</span>
              </Link>
            </div>

            <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row gap-4">
              <Link to="/contact" className="btn-primary text-center">
                {t('privacyPage.contactUs')}
              </Link>
              <Link to="/" className="text-primary-600 hover:text-primary-700 font-medium self-center">
                ← {t('notFoundPage.backHome')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LegalInfoPage;
