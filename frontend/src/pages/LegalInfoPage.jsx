import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const LegalInfoPage = () => {
  const { t } = useTranslation();

  const legalLinks = [
    { to: '/privacy', labelKey: 'footer.privacyPolicy', descKey: 'legalInfoPage.privacyDesc' },
    { to: '/terms', labelKey: 'footer.termsConditions', descKey: 'legalInfoPage.termsDesc' },
    { to: '/terms', labelKey: 'footer.legalNotice', descKey: 'legalInfoPage.legalNoticeDesc' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">{t('legalInfoPage.title')}</h1>
          <p className="text-primary-100 text-lg max-w-2xl mx-auto">{t('legalInfoPage.subtitle')}</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-2xl shadow-soft p-8 md:p-12 space-y-8">
            <p className="text-gray-600 leading-relaxed">{t('legalInfoPage.intro')}</p>

            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-3">
              {legalLinks.map(({ to, labelKey, descKey }) => (
                <Link
                  key={labelKey}
                  to={to}
                  className="block p-6 rounded-xl border border-gray-200 hover:border-primary-500 hover:shadow-soft transition bg-gray-50 hover:bg-primary-50/30"
                >
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{t(labelKey)}</h2>
                  <p className="text-gray-600 text-sm">{t(descKey)}</p>
                  <span className="inline-flex items-center mt-3 text-primary-600 font-medium">
                    {t('legalInfoPage.readMore')} →
                  </span>
                </Link>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row gap-4">
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

export default LegalInfoPage;
