import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              {t('legalPage.intro')}
            </p>

            <div className="space-y-8">
              <div className="border-l-4 border-primary-600 pl-6">
                <h2 className="text-2xl font-bold mb-3 text-gray-900">
                  {t('legalPage.privacyTitle')}
                </h2>
                <p className="text-gray-600 mb-4">
                  {t('legalPage.privacyDesc')}
                </p>
                <Link
                  to="/privacy"
                  className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold"
                >
                  {t('legalPage.readMore')}
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              <div className="border-l-4 border-primary-600 pl-6">
                <h2 className="text-2xl font-bold mb-3 text-gray-900">
                  {t('legalPage.termsTitle')}
                </h2>
                <p className="text-gray-600 mb-4">
                  {t('legalPage.termsDesc')}
                </p>
                <Link
                  to="/terms"
                  className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold"
                >
                  {t('legalPage.readMore')}
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              <div className="border-l-4 border-primary-600 pl-6">
                <h2 className="text-2xl font-bold mb-3 text-gray-900">
                  {t('legalPage.noticeTitle')}
                </h2>
                <p className="text-gray-600">
                  {t('legalPage.noticeDesc')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-primary-50 rounded-xl p-8 text-center">
            <p className="text-gray-700 mb-4">
              {t('legalPage.questions')}
            </p>
            <Link
              to="/contact"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
            >
              {t('legalPage.contactUs')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LegalPage;
