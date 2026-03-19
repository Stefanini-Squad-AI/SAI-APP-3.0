import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import creditTypeService from '../services/creditTypeService';

const ServicesPage = () => {
  const { t } = useTranslation();
  const [creditTypes, setCreditTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchCreditTypes = async () => {
      try {
        setLoading(true);
        setError(false);
        const data = await creditTypeService.getAll(true);
        setCreditTypes(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCreditTypes();
  }, []);

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Selects an icon based on keywords in the credit type name
  const getIcon = (name) => {
    const nameLower = (name ?? '').toLowerCase();

    if (nameLower.includes('express') || nameLower.includes('rápido') || nameLower.includes('quick') || nameLower.includes('fast')) {
      return (
        <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    } else if (nameLower.includes('personal')) {
      return (
        <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else if (nameLower.includes('refinanciamiento') || nameLower.includes('consolidación') || nameLower.includes('refinanc') || nameLower.includes('consolidat')) {
      return (
        <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    } else if (nameLower.includes('hipotecario') || nameLower.includes('vivienda') || nameLower.includes('mortgage') || nameLower.includes('home') || nameLower.includes('housing')) {
      return (
        <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    } else if (nameLower.includes('auto') || nameLower.includes('vehículo') || nameLower.includes('vehicle') || nameLower.includes('car')) {
      return (
        <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      );
    } else {
      return (
        <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    }
  };

  const getFeatures = (creditType) => {
    return [
      ...(creditType.minTermMonths <= 3 ? [t('servicesPage.feature1')] : []),
      ...(creditType.baseInterestRate <= 15 ? [t('servicesPage.feature2')] : []),
      ...(creditType.maxAmount >= 100000 ? [t('servicesPage.feature3')] : []),
      t('servicesPage.feature4'),
      t('servicesPage.feature5'),
    ];
  };

  const getRequirements = () => {
    return [
      t('servicesPage.req1'),
      t('servicesPage.req2'),
      t('servicesPage.req3'),
      t('servicesPage.req4'),
    ];
  };

  return (
    <div className="py-16">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">{t('servicesPage.heroTitle')}</h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            {t('servicesPage.heroSubtitle')}
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="container mx-auto px-4 py-16">
        {error ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-600">{t('servicesPage.noServicesDesc')}</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary-500"></div>
          </div>
        ) : creditTypes.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {creditTypes.map((creditType) => (
              <div key={creditType.id} className="bg-white rounded-xl shadow-soft hover:shadow-medium transition">
                <div className="p-8">
                  <div className="w-20 h-20 bg-primary-100 rounded-xl flex items-center justify-center mb-6">
                    {getIcon(creditType.name)}
                  </div>
                  <h2 className="text-3xl font-bold mb-4 text-gray-900">{creditType.name}</h2>
                  
                  <p className="text-gray-600 mb-6">{creditType.description}</p>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">{t('servicesPage.amount')}</span>
                      <span className="font-semibold text-primary-600">
                        {t('servicesPage.upTo')} {formatAmount(creditType.maxAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">{t('servicesPage.term')}</span>
                      <span className="font-semibold">
                        {t('servicesPage.termRange', {
                          min: Math.floor(creditType.minTermMonths / 12),
                          max: Math.floor(creditType.maxTermMonths / 12),
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">{t('servicesPage.rate')}</span>
                      <span className="font-semibold text-green-600">
                        {t('servicesPage.rateFrom', { rate: creditType.baseInterestRate })}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-semibold text-lg mb-3">{t('servicesPage.characteristics')}</h3>
                  <ul className="space-y-2 mb-6">
                    {getFeatures(creditType).map((feature) => (
                      <li key={feature} className="flex items-start text-gray-600">
                        <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <h3 className="font-semibold text-lg mb-3">{t('servicesPage.requirements')}</h3>
                  <ul className="space-y-2 mb-6">
                    {getRequirements().map((req) => (
                      <li key={req} className="flex items-start text-gray-600 text-sm">
                        <span className="text-primary-600 mr-2">•</span>
                        {req}
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/calculator"
                    className="block w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold text-center"
                  >
                    {t('servicesPage.calculateCredit')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">{t('servicesPage.noServices')}</h3>
            <p className="text-gray-600">
              {t('servicesPage.noServicesDesc')}
            </p>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{t('servicesPage.ctaTitle')}</h2>
          <p className="text-xl text-gray-600 mb-8">
            {t('servicesPage.ctaDesc')}
          </p>
          <Link
            to="/contact"
            className="inline-block px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
          >
            {t('servicesPage.contactAdvisor')}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;
