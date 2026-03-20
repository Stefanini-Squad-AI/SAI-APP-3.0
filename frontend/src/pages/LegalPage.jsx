import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const TABS = ['legalNotice', 'privacy', 'terms'];

const LegalPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);

  const tabLabels = [
    t('legalPage.tabLegalNotice'),
    t('legalPage.tabPrivacy'),
    t('legalPage.tabTerms'),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">{t('legalPage.title')}</h1>
          <p className="text-primary-100 text-lg">{t('legalPage.subtitle')}</p>
        </div>
      </section>

      {/* Tabs + Content */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Tab list */}
          <div
            role="tablist"
            aria-label={t('legalPage.title')}
            className="flex flex-wrap gap-2 mb-8 border-b border-gray-200"
          >
            {tabLabels.map((label, idx) => (
              <button
                key={TABS[idx]}
                role="tab"
                id={`tab-${TABS[idx]}`}
                aria-selected={activeTab === idx}
                aria-controls={`panel-${TABS[idx]}`}
                onClick={() => setActiveTab(idx)}
                className={`px-5 py-3 font-semibold text-sm rounded-t-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 min-h-[44px] ${
                  activeTab === idx
                    ? 'bg-white text-primary-700 border border-b-white border-gray-200 -mb-px'
                    : 'text-gray-600 hover:text-primary-600 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab panels */}
          <div className="bg-white rounded-2xl shadow-soft p-8 md:p-12">

            {/* Aviso Legal */}
            <div
              role="tabpanel"
              id={`panel-${TABS[0]}`}
              aria-labelledby={`tab-${TABS[0]}`}
              hidden={activeTab !== 0}
            >
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('legalPage.ln.s1title')}</h2>
                  <p className="text-gray-600 leading-relaxed">{t('legalPage.ln.s1body')}</p>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('legalPage.ln.s2title')}</h2>
                  <p className="text-gray-600 leading-relaxed">{t('legalPage.ln.s2body')}</p>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('legalPage.ln.s3title')}</h2>
                  <p className="text-gray-600 leading-relaxed">{t('legalPage.ln.s3body')}</p>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('legalPage.ln.s4title')}</h2>
                  <p className="text-gray-600 leading-relaxed">{t('legalPage.ln.s4body')}</p>
                </div>
              </div>
            </div>

            {/* Política de Privacidad */}
            <div
              role="tabpanel"
              id={`panel-${TABS[1]}`}
              aria-labelledby={`tab-${TABS[1]}`}
              hidden={activeTab !== 1}
            >
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('privacyPage.s1title')}</h2>
                  <p className="text-gray-600 leading-relaxed">{t('privacyPage.s1body')}</p>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('privacyPage.s2title')}</h2>
                  <p className="text-gray-600 leading-relaxed">{t('privacyPage.s2body')}</p>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('privacyPage.s3title')}</h2>
                  <p className="text-gray-600 leading-relaxed">{t('privacyPage.s3body')}</p>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('privacyPage.s4title')}</h2>
                  <p className="text-gray-600 leading-relaxed">{t('privacyPage.s4body')}</p>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('privacyPage.s5title')}</h2>
                  <p className="text-gray-600 leading-relaxed">{t('privacyPage.s5body')}</p>
                </div>
              </div>
            </div>

            {/* Términos y Condiciones */}
            <div
              role="tabpanel"
              id={`panel-${TABS[2]}`}
              aria-labelledby={`tab-${TABS[2]}`}
              hidden={activeTab !== 2}
            >
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('termsPage.s1title')}</h2>
                  <p className="text-gray-600 leading-relaxed">{t('termsPage.s1body')}</p>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('termsPage.s2title')}</h2>
                  <p className="text-gray-600 leading-relaxed">{t('termsPage.s2body')}</p>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('termsPage.s3title')}</h2>
                  <p className="text-gray-600 leading-relaxed">{t('termsPage.s3body')}</p>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('termsPage.s4title')}</h2>
                  <p className="text-gray-600 leading-relaxed">{t('termsPage.s4body')}</p>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('termsPage.s5title')}</h2>
                  <p className="text-gray-600 leading-relaxed">{t('termsPage.s5body')}</p>
                </div>
              </div>
            </div>

            {/* Footer nav */}
            <div className="border-t border-gray-200 pt-6 mt-8 flex flex-col sm:flex-row gap-4">
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
