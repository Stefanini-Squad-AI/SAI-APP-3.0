import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import creditTypeService from '../services/creditTypeService';

const HomePage = () => {
  const { t } = useTranslation();
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoadingServices(true);
        const data = await creditTypeService.getAll(true);
        setServices(data);
      } catch (error) {
        console.error('Error loading services:', error);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  let servicesSectionContent;
  if (loadingServices) {
    servicesSectionContent = (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary-500"></div>
      </div>
    );
  } else if (services.length > 0) {
    servicesSectionContent = (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {services.map((service) => (
          <div key={service.id} className="bg-white p-8 rounded-xl shadow-soft hover:shadow-medium transition">
            <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold mb-4">{service.name}</h3>
            <p className="text-gray-600 mb-6">
              {service.description}
            </p>
            <Link to="/services" className="text-primary-600 font-semibold hover:text-primary-700">
              {t('home.services.moreInfo')}
            </Link>
          </div>
        ))}
      </div>
    );
  } else {
    servicesSectionContent = (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">{t('home.services.noServices')}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="container mx-auto px-4 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                {t('home.hero.title')}
                <span className="block text-primary-200">{t('home.hero.subtitle')}</span>
              </h1>
              <p className="text-xl text-primary-100 mb-8">
                {t('home.hero.description')}
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  to="/calculator"
                  className="px-8 py-4 bg-white text-primary-600 rounded-lg hover:bg-primary-50 transition font-semibold text-lg shadow-lg text-center"
                >
                  {t('home.hero.applyCredit')}
                </Link>
                <Link
                  to="/services"
                  className="px-8 py-4 bg-primary-500 text-white border-2 border-white rounded-lg hover:bg-primary-400 transition font-semibold text-lg text-center"
                >
                  {t('home.hero.viewServices')}
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <div className="w-full h-96 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <svg className="w-64 h-64 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('home.about.title')}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('home.about.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Mission */}
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-8 rounded-xl">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-center mb-4 text-gray-900">{t('home.about.mission')}</h3>
              <p className="text-gray-700 text-center">
                {t('home.about.missionText')}
              </p>
            </div>

            {/* Vision */}
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-8 rounded-xl">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-center mb-4 text-gray-900">{t('home.about.vision')}</h3>
              <p className="text-gray-700 text-center">
                {t('home.about.visionText')}
              </p>
            </div>

            {/* Values */}
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-8 rounded-xl">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-center mb-4 text-gray-900">{t('home.about.values')}</h3>
              <ul className="text-gray-700 space-y-2">
                <li className="flex items-center">
                  <span className="text-primary-600 mr-2">✓</span>
                  {t('home.about.value1')}
                </li>
                <li className="flex items-center">
                  <span className="text-primary-600 mr-2">✓</span>
                  {t('home.about.value2')}
                </li>
                <li className="flex items-center">
                  <span className="text-primary-600 mr-2">✓</span>
                  {t('home.about.value3')}
                </li>
                <li className="flex items-center">
                  <span className="text-primary-600 mr-2">✓</span>
                  {t('home.about.value4')}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('home.services.title')}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('home.services.description')}
            </p>
          </div>

          {servicesSectionContent}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">10,000+</div>
              <div className="text-primary-100 text-lg">{t('home.stats.clients')}</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">$50M+</div>
              <div className="text-primary-100 text-lg">{t('home.stats.credits')}</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">98%</div>
              <div className="text-primary-100 text-lg">{t('home.stats.approval')}</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">24/7</div>
              <div className="text-primary-100 text-lg">{t('home.stats.support')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('home.location.title')}</h2>
              <p className="text-xl text-gray-600">
                {t('home.location.description')}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Map */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-soft overflow-hidden h-96">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.6752373858615!2d-99.16573492475768!3d19.426426981863397!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d1ff35f5bd1563%3A0x6c366f0e2de02ff7!2sReforma%20222%2C%20Ju%C3%A1rez%2C%20Cuauht%C3%A9moc%2C%2006600%20Ciudad%20de%20M%C3%A9xico%2C%20CDMX!5e0!3m2!1ses!2smx!4v1705948800000!5m2!1ses!2smx"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="TuCreditoOnline Location"
                />
              </div>

              {/* Location Info */}
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-xl shadow-soft">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold">{t('home.location.address')}</h3>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm whitespace-pre-line">
                    {t('home.location.addressText')}
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-soft">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold">{t('home.location.hours')}</h3>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm whitespace-pre-line">
                    {t('home.location.hoursText')}<br />
                    <strong className="text-primary-600">{t('home.location.hoursOnline')}</strong>
                  </p>
                </div>

                <Link
                  to="/contact"
                  className="block w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold text-center"
                >
                  {t('home.location.viewDetails')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
