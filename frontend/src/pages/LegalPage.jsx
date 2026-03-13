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
          <p className="text-lg text-gray-600 mb-12 leading-relaxed">
            {t('legalPage.intro')}
          </p>

          <div className="space-y-8">
            {/* Privacy Policy */}
            <div className="bg-white rounded-xl shadow-soft p-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">
                {t('legalPage.privacyTitle')}
              </h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
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

            {/* Terms and Conditions */}
            <div className="bg-white rounded-xl shadow-soft p-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">
                {t('legalPage.termsTitle')}
              </h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
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

            {/* Legal Notice */}
            <div className="bg-white rounded-xl shadow-soft p-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">
                {t('legalPage.noticeTitle')}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('legalPage.noticeDesc')}
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
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
