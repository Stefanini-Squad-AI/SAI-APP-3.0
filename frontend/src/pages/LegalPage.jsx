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
          <h2 className="text-3xl font-bold mb-8 text-gray-900">{t('legalPage.sectionTitle')}</h2>

          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-soft p-8">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">{t('legalPage.termsTitle')}</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">{t('legalPage.termsIntro')}</p>
              <Link to="/terms" className="text-primary-600 hover:text-primary-700 font-medium">
                {t('legalPage.viewTerms')} →
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-soft p-8">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">{t('legalPage.privacyTitle')}</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">{t('legalPage.privacyIntro')}</p>
              <Link to="/privacy" className="text-primary-600 hover:text-primary-700 font-medium">
                {t('legalPage.viewPrivacy')} →
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-soft p-8">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">{t('legalPage.legalNoticeTitle')}</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">{t('legalPage.legalNoticeIntro')}</p>
              <p className="text-gray-600 text-sm">{t('legalPage.legalNoticeContent')}</p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link to="/contact" className="btn-primary inline-block">
              {t('legalPage.contactUs')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LegalPage;
