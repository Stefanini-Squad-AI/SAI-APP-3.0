import { useTranslation } from 'react-i18next';

const AboutPage = () => {
  const { t } = useTranslation();
  return (
    <div className="py-16">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">{t('aboutPage.heroTitle')}</h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            {t('aboutPage.heroSubtitle')}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-soft p-8 mb-12">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">{t('aboutPage.ourStory')}</h2>
            <p className="text-gray-600 mb-4 text-lg leading-relaxed">
              {t('aboutPage.storyP1')}
            </p>
            <p className="text-gray-600 text-lg leading-relaxed">
              {t('aboutPage.storyP2')}
            </p>
          </div>

          <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">{t('aboutPage.whyUs')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-soft flex items-start">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">{t('aboutPage.online100')}</h3>
                <p className="text-gray-600">{t('aboutPage.online100Desc')}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-soft flex items-start">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">{t('aboutPage.fastResponse')}</h3>
                <p className="text-gray-600">{t('aboutPage.fastResponseDesc')}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-soft flex items-start">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">{t('aboutPage.competitiveRates')}</h3>
                <p className="text-gray-600">{t('aboutPage.competitiveRatesDesc')}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-soft flex items-start">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">{t('aboutPage.totalSecurity')}</h3>
                <p className="text-gray-600">{t('aboutPage.totalSecurityDesc')}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-soft flex items-start">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">{t('aboutPage.support247')}</h3>
                <p className="text-gray-600">{t('aboutPage.support247Desc')}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-soft flex items-start">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">{t('aboutPage.transparency')}</h3>
                <p className="text-gray-600">{t('aboutPage.transparencyDesc')}</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-primary-600 rounded-xl p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">{t('aboutPage.readyCTA')}</h2>
            <p className="text-xl text-primary-100 mb-8">
              {t('aboutPage.joinCTA')}
            </p>
            <a
              href="/calculator"
              className="inline-block px-8 py-3 bg-white text-primary-600 rounded-lg hover:bg-primary-50 transition font-semibold text-lg"
            >
              {t('aboutPage.applyNow')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
