import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const LegalPage = () => {
  const { t } = useTranslation();

  return (
    <div className="py-16">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">{t('legalPage.heroTitle')}</h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            {t('legalPage.heroSubtitle')}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-soft p-8 mb-8">
            <p className="text-gray-600 text-lg leading-relaxed">
              {t('legalPage.intro')}
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-soft flex items-start">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('legalPage.privacyTitle')}</h2>
                <p className="text-gray-600 mb-4">{t('legalPage.privacyDesc')}</p>
                <Link to="/privacy" className="text-primary-600 hover:text-primary-700 font-medium">
                  {t('legalPage.readMore')} →
                </Link>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-soft flex items-start">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('legalPage.termsTitle')}</h2>
                <p className="text-gray-600 mb-4">{t('legalPage.termsDesc')}</p>
                <Link to="/terms" className="text-primary-600 hover:text-primary-700 font-medium">
                  {t('legalPage.readMore')} →
                </Link>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-soft flex items-start">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('legalPage.noticeTitle')}</h2>
                <p className="text-gray-600">{t('legalPage.noticeDesc')}</p>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-gray-200 pt-6">
            <Link to="/contact" className="text-primary-600 hover:text-primary-700 font-medium">
              {t('legalPage.contactUs')} →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LegalPage;
