import { useTranslation } from 'react-i18next';

/**
 * Body sections for the privacy policy (shared by PrivacyPage and LegalInformationPage).
 */
const PrivacyLegalSections = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-8" data-testid="legal-panel-privacy-inner">
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
  );
};

export default PrivacyLegalSections;
