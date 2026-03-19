import { useTranslation } from 'react-i18next';

/**
 * Body sections for terms and conditions (shared by TermsPage and LegalInformationPage).
 */
const TermsLegalSections = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-8" data-testid="legal-panel-terms-inner">
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
  );
};

export default TermsLegalSections;
