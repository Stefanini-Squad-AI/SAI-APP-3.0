import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const FAQPage = () => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    { categoryKey: 'catGeneral', items: ['g1', 'g2', 'g3'] },
    { categoryKey: 'catRequirements', items: ['r1', 'r2', 'r3'] },
    { categoryKey: 'catAmounts', items: ['m1', 'm2', 'm3', 'm4'] },
    { categoryKey: 'catProcess', items: ['p1', 'p2', 'p3'] }
  ];

  const toggleFAQ = (categoryIndex, questionIndex) => {
    const index = `${categoryIndex}-${questionIndex}`;
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="py-16">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">{t('faqPage.heroTitle')}</h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            {t('faqPage.heroSubtitle')}
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-12">
              <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b-2 border-primary-600 pb-2">
                {t(`faqPage.${category.categoryKey}`)}
              </h2>
              <div className="space-y-4">
                {category.items.map((item, questionIndex) => {
                  const isOpen = openIndex === `${categoryIndex}-${questionIndex}`;
                  return (
                    <div
                      key={questionIndex}
                      className="bg-white rounded-lg shadow-soft overflow-hidden"
                    >
                      <button
                        onClick={() => toggleFAQ(categoryIndex, questionIndex)}
                        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition"
                      >
                        <span className="font-semibold text-lg text-gray-900 pr-8">
                          {t(`faqPage.${item}q`)}
                        </span>
                        <svg
                          className={`w-6 h-6 text-primary-600 flex-shrink-0 transition-transform ${
                            isOpen ? 'transform rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-4 text-gray-600">
                          <p className="leading-relaxed">{t(`faqPage.${item}a`)}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-primary-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{t('faqPage.noAnswer')}</h2>
          <p className="text-xl text-gray-600 mb-8">
            {t('faqPage.supportDesc')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <a
              href="/contact"
              className="inline-block px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
            >
              {t('faqPage.contactSupport')}
            </a>
            <a
              href="tel:+525512345678"
              className="inline-block px-8 py-3 bg-white text-primary-600 border-2 border-primary-600 rounded-lg hover:bg-primary-50 transition font-semibold"
            >
              {t('faqPage.callNow')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQPage;
