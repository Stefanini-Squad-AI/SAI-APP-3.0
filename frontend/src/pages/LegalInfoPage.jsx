import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const LegalInfoPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50" data-testid="legal-info-page">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4" data-testid="legal-info-title">
            {t('legalInfoPage.title')}
          </h1>
          <p className="text-primary-100 text-lg">{t('legalInfoPage.lastUpdated')}</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-2xl shadow-soft p-8 md:p-12 space-y-8">

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3" data-testid="legal-info-s1-title">
                {t('legalInfoPage.s1title')}
              </h2>
              <p className="text-gray-600 leading-relaxed">{t('legalInfoPage.s1body')}</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3" data-testid="legal-info-s2-title">
                {t('legalInfoPage.s2title')}
              </h2>
              <p className="text-gray-600 leading-relaxed">{t('legalInfoPage.s2body')}</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3" data-testid="legal-info-s3-title">
                {t('legalInfoPage.s3title')}
              </h2>
              <p className="text-gray-600 leading-relaxed">{t('legalInfoPage.s3body')}</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3" data-testid="legal-info-s4-title">
                {t('legalInfoPage.s4title')}
              </h2>
              <p className="text-gray-600 leading-relaxed">{t('legalInfoPage.s4body')}</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3" data-testid="legal-info-s5-title">
                {t('legalInfoPage.s5title')}
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">{t('legalInfoPage.s5body')}</p>
              <p className="text-gray-600 leading-relaxed flex flex-wrap gap-x-4 gap-y-2">
                <Link to="/privacy" className="text-primary-600 hover:text-primary-700 font-medium underline">
                  {t('legalInfoPage.linkPrivacy')}
                </Link>
                <span className="text-gray-400 hidden sm:inline" aria-hidden="true">|</span>
                <Link to="/terms" className="text-primary-600 hover:text-primary-700 font-medium underline">
                  {t('legalInfoPage.linkTerms')}
                </Link>
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row gap-4">
              <Link
                to="/contact"
                className="btn-primary text-center"
                data-testid="legal-info-contact-link"
              >
                {t('legalInfoPage.contactUs')}
              </Link>
              <Link
                to="/"
                className="text-primary-600 hover:text-primary-700 font-medium self-center"
                data-testid="legal-info-home-link"
              >
                ← {t('legalInfoPage.backHome')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LegalInfoPage;
