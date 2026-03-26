import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const LegalInformationPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">{t('legalInformationPage.title')}</h1>
          <p className="text-primary-100 text-lg">{t('legalInformationPage.lastUpdated')}</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-2xl shadow-soft p-8 md:p-12 space-y-8">

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('legalInformationPage.s1title')}</h2>
              <p className="text-gray-600 leading-relaxed">{t('legalInformationPage.s1body')}</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('legalInformationPage.s2title')}</h2>
              <p className="text-gray-600 leading-relaxed">{t('legalInformationPage.s2body')}</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('legalInformationPage.s3title')}</h2>
              <p className="text-gray-600 leading-relaxed">{t('legalInformationPage.s3body')}</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('legalInformationPage.s4title')}</h2>
              <p className="text-gray-600 leading-relaxed">{t('legalInformationPage.s4body')}</p>
            </div>

            <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row gap-4">
              <Link to="/contact" className="btn-primary text-center">
                {t('legalInformationPage.contactUs')}
              </Link>
              <Link to="/privacy" className="text-primary-600 hover:text-primary-700 font-medium self-center">
                {t('legalInformationPage.privacyPolicy')} →
              </Link>
              <Link to="/terms" className="text-primary-600 hover:text-primary-700 font-medium self-center">
                {t('legalInformationPage.termsConditions')} →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LegalInformationPage;
