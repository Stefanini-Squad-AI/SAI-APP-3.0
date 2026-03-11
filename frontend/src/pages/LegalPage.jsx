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
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Terms and Conditions */}
          <div className="bg-white rounded-xl shadow-soft p-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">{t('legalPage.termsTitle')}</h2>
            <p className="text-gray-600 leading-relaxed">
              {t('legalPage.termsIntro')}
            </p>
            <Link to="/terms" className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium">
              {t('legalPage.viewTerms')} →
            </Link>
          </div>

          {/* Privacy Policy */}
          <div className="bg-white rounded-xl shadow-soft p-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">{t('legalPage.privacyTitle')}</h2>
            <p className="text-gray-600 leading-relaxed">
              {t('legalPage.privacyIntro')}
            </p>
            <Link to="/privacy" className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium">
              {t('legalPage.viewPrivacy')} →
            </Link>
          </div>

          {/* Legal Notice */}
          <div className="bg-white rounded-xl shadow-soft p-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">{t('legalPage.noticeTitle')}</h2>
            <p className="text-gray-600 leading-relaxed">
              {t('legalPage.noticeIntro')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LegalPage;
