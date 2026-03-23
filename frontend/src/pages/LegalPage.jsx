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

      {/* Legal Content */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-12">

          {/* Términos y Condiciones */}
          <div className="bg-white rounded-xl shadow-soft p-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              {t('legalPage.termsTitle')}
            </h2>
            <p className="text-sm text-gray-500 mb-4">{t('legalPage.lastUpdated')}</p>
            <p className="text-gray-600 leading-relaxed">
              {t('legalPage.termsBody')}
            </p>
          </div>

          {/* Política de Privacidad */}
          <div className="bg-white rounded-xl shadow-soft p-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              {t('legalPage.privacyTitle')}
            </h2>
            <p className="text-sm text-gray-500 mb-4">{t('legalPage.lastUpdated')}</p>
            <p className="text-gray-600 leading-relaxed">
              {t('legalPage.privacyBody')}
            </p>
          </div>

          {/* Aviso Legal */}
          <div className="bg-white rounded-xl shadow-soft p-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              {t('legalPage.legalNoticeTitle')}
            </h2>
            <p className="text-sm text-gray-500 mb-4">{t('legalPage.lastUpdated')}</p>
            <p className="text-gray-600 leading-relaxed">
              {t('legalPage.legalNoticeBody')}
            </p>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
            >
              {t('legalPage.contactUs')}
            </Link>
            <Link
              to="/"
              className="px-8 py-3 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition font-semibold"
            >
              {t('legalPage.backHome')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LegalPage;
