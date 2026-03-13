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

            {/* Aviso Legal */}
            <div id="aviso-legal">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('legalInfoPage.legalNoticeTitle')}</h2>
              <p className="text-gray-600 leading-relaxed mb-4">{t('legalInfoPage.legalNoticeIntro')}</p>
              <div className="space-y-3 text-gray-600 leading-relaxed">
                <p>{t('legalInfoPage.legalNoticeCompany')}</p>
                <p>{t('legalInfoPage.legalNoticeAddress')}</p>
                <p>{t('legalInfoPage.legalNoticeContact')}</p>
              </div>
            </div>

            {/* Links to other legal documents */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('legalInfoPage.linksTitle')}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Link
                  to="/terms"
                  className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">{t('footer.termsConditions')}</span>
                    <p className="text-sm text-gray-500">{t('legalInfoPage.termsDesc')}</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  to="/privacy"
                  className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">{t('footer.privacyPolicy')}</span>
                    <p className="text-sm text-gray-500">{t('legalInfoPage.privacyDesc')}</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
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
