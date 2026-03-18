import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const LegalPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">{t('legalPage.title')}</h1>
          <p className="text-primary-100 text-lg">{t('legalPage.lastUpdated')}</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-2xl shadow-soft p-8 md:p-12 space-y-8">

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('legalPage.s1title')}</h2>
              <p className="text-gray-600 leading-relaxed">{t('legalPage.s1body')}</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('legalPage.s2title')}</h2>
              <p className="text-gray-600 leading-relaxed">{t('legalPage.s2body')}</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('legalPage.s3title')}</h2>
              <p className="text-gray-600 leading-relaxed">{t('legalPage.s3body')}</p>
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

export default LegalPage;
