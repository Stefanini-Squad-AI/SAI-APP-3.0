import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const LegalPage = () => {
  const { t } = useTranslation();

  const sections = [
    {
      id: 1,
      title: t('legalPage.section1Title'),
      body: t('legalPage.section1Body'),
    },
    {
      id: 2,
      title: t('legalPage.section2Title'),
      body: t('legalPage.section2Body'),
    },
    {
      id: 3,
      title: t('legalPage.section3Title'),
      body: t('legalPage.section3Body'),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-primary-100 mb-3">
            {t('legalPage.heroLabel')}
          </p>
          <h1 data-testid="legal-hero-title" className="text-4xl font-bold mb-4">
            {t('legalPage.heroTitle')}
          </h1>
          <p data-testid="legal-hero-subtitle" className="text-primary-100 text-lg max-w-3xl mx-auto">
            {t('legalPage.heroSubtitle')}
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3">
            {sections.map((section) => (
              <article
                key={section.id}
                data-testid={`legal-section-${section.id}`}
                className="bg-white rounded-2xl shadow-soft p-6 md:p-8 border border-gray-200"
              >
                <h2
                  data-testid={`legal-section-${section.id}-title`}
                  className="text-2xl font-semibold text-gray-900 mb-3"
                >
                  {section.title}
                </h2>
                <p
                  data-testid={`legal-section-${section.id}-body`}
                  className="text-gray-600 leading-relaxed"
                >
                  {section.body}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <Link
              to="/privacy"
              className="btn-primary text-center"
            >
              {t('footer.privacyPolicy')}
            </Link>
            <Link
              to="/terms"
              className="btn-primary text-center"
            >
              {t('footer.termsConditions')}
            </Link>
            <Link
              to="/contact"
              className="btn-primary text-center"
            >
              {t('legalPage.contactCta')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LegalPage;
