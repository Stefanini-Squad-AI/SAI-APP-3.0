import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const LegalInfoPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">{t('legalInfoPage.title')}</h1>
          <p className="text-primary-100 text-lg">{t('legalInfoPage.subtitle')}</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-2xl shadow-soft p-8 md:p-12 space-y-8">

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('legalInfoPage.s1title')}</h2>
              <p className="text-gray-600 leading-relaxed">{t('legalInfoPage.s1body')}</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('legalInfoPage.s2title')}</h2>
              <p className="text-gray-600 leading-relaxed">{t('legalInfoPage.s2body')}</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('legalInfoPage.s3title')}</h2>
              <p className="text-gray-600 leading-relaxed">{t('legalInfoPage.s3body')}</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('legalInfoPage.s4title')}</h2>
              <p className="text-gray-600 leading-relaxed">{t('legalInfoPage.s4body')}</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('legalInfoPage.s5title')}</h2>
              <p className="text-gray-600 leading-relaxed">{t('legalInfoPage.s5body')}</p>
            </div>

            {/* Internal links to Privacy and Terms */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('legalInfoPage.referencesTitle')}</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/privacy"
                  className="btn-primary text-center"
                >
                  {t('legalInfoPage.privacyLink')}
                </Link>
                <Link
                  to="/terms"
                  className="px-6 py-2 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition font-semibold text-center"
                >
                  {t('legalInfoPage.termsLink')}
                </Link>
                <Link to="/" className="text-primary-600 hover:text-primary-700 font-medium self-center">
                  ← {t('notFoundPage.backHome')}
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default LegalInfoPage;
