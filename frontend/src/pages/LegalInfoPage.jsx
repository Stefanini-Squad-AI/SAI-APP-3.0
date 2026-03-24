import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const LegalInfoPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4" data-testid="legal-info-main-heading">
            {t('legalInfoPage.title')}
          </h1>
          <p className="text-primary-100 text-lg">{t('legalInfoPage.lastUpdated')}</p>
        </div>
      </section>

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
              <p className="text-gray-600 leading-relaxed mb-4">{t('legalInfoPage.s3body')}</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>
                  <Link to="/privacy" className="text-primary-600 hover:text-primary-700 font-medium">
                    {t('legalInfoPage.relatedPrivacy')}
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-primary-600 hover:text-primary-700 font-medium">
                    {t('legalInfoPage.relatedTerms')}
                  </Link>
                </li>
              </ul>
            </div>

            <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row gap-4">
              <Link to="/contact" className="btn-primary text-center">
                {t('legalInfoPage.contactUs')}
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
