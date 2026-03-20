import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const LegalPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">{t('legalPage.title')}</h1>
          <p className="text-primary-100 text-lg">{t('legalPage.subtitle')}</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-2xl shadow-soft p-8 md:p-12 space-y-8">

            {/* Introduction */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('legalPage.s1title')}</h2>
              <p className="text-gray-600 leading-relaxed">{t('legalPage.s1body')}</p>
            </div>

            {/* Cross-links */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legalPage.s2title')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  to="/privacy"
                  className="block p-6 border-2 border-primary-100 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition group"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-gray-900 group-hover:text-primary-700 transition">{t('legalPage.privacyCardTitle')}</h3>
                  </div>
                  <p className="text-gray-600 text-sm">{t('legalPage.privacyCardBody')}</p>
                </Link>

                <Link
                  to="/terms"
                  className="block p-6 border-2 border-primary-100 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition group"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-gray-900 group-hover:text-primary-700 transition">{t('legalPage.termsCardTitle')}</h3>
                  </div>
                  <p className="text-gray-600 text-sm">{t('legalPage.termsCardBody')}</p>
                </Link>
              </div>
            </div>

            {/* Regulatory section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('legalPage.s3title')}</h2>
              <p className="text-gray-600 leading-relaxed">{t('legalPage.s3body')}</p>
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

export default LegalPage;
