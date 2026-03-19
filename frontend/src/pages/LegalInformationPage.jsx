import { useId, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import PrivacyLegalSections from '../components/legal/PrivacyLegalSections';
import TermsLegalSections from '../components/legal/TermsLegalSections';

const TABS = [
  { id: 'privacy', testId: 'legal-tab-privacy', panelTestId: 'legal-panel-privacy' },
  { id: 'terms', testId: 'legal-tab-terms', panelTestId: 'legal-panel-terms' },
];

const LegalInformationPage = () => {
  const { t } = useTranslation();
  const baseId = useId();
  const [active, setActive] = useState('privacy');

  const tabId = useCallback((suffix) => `${baseId}-${suffix}`, [baseId]);
  const panelId = useCallback((suffix) => `${baseId}-panel-${suffix}`, [baseId]);

  const onKeyDown = (e, index) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = e.key === 'ArrowRight' ? (index + 1) % TABS.length : (index - 1 + TABS.length) % TABS.length;
    setActive(TABS[next].id);
    document.getElementById(tabId(TABS[next].id))?.focus();
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="legal-information-page">
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">{t('legalPage.title')}</h1>
          <p className="text-primary-100 text-lg max-w-2xl mx-auto">{t('legalPage.subtitle')}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div
            className="bg-white rounded-2xl shadow-soft p-6 md:p-10"
            role="region"
            aria-label={t('legalPage.title')}
          >
            <div
              role="tablist"
              aria-label={t('legalPage.tabsLabel')}
              className="flex flex-wrap gap-2 border-b border-gray-200 pb-4 mb-8"
            >
              {TABS.map((tab, index) => {
                const selected = active === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={tabId(tab.id)}
                    data-testid={tab.testId}
                    aria-selected={selected}
                    aria-controls={panelId(tab.id)}
                    tabIndex={selected ? 0 : -1}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm md:text-base transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                      selected
                        ? 'bg-primary-600 text-white shadow'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setActive(tab.id)}
                    onKeyDown={(e) => onKeyDown(e, index)}
                  >
                    {tab.id === 'privacy' ? t('legalPage.tabPrivacy') : t('legalPage.tabTerms')}
                  </button>
                );
              })}
            </div>

            {TABS.map((tab) => {
              const selected = active === tab.id;
              return (
                <div
                  key={tab.id}
                  id={panelId(tab.id)}
                  role="tabpanel"
                  data-testid={tab.panelTestId}
                  aria-labelledby={tabId(tab.id)}
                  hidden={!selected}
                >
                  {tab.id === 'privacy' ? <PrivacyLegalSections /> : <TermsLegalSections />}
                </div>
              );
            })}

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

export default LegalInformationPage;
