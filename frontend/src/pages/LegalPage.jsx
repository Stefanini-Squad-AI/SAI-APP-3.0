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
            <h2 className="text-3xl font-bold mb-6 text-gray-900">{t('legalPage.section1Title')}</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              {t('legalPage.section1Body')}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-soft p-8 mb-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">{t('legalPage.section2Title')}</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              {t('legalPage.section2Body')}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-soft p-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">{t('legalPage.section3Title')}</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              {t('legalPage.section3Body')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LegalPage;
