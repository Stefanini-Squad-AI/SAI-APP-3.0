import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import contactMessageService from '../services/contactMessageService';

const ContactPage = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsSubmitting(true);

    try {
      await contactMessageService.create(formData);
      
      Swal.fire({
        icon: 'success',
        title: t('contactPage.messageSent'),
        text: t('contactPage.thanksContact'),
        confirmButtonColor: '#2563eb'
      });

      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error('Error sending contact message:', error);
      Swal.fire({
        icon: 'error',
        title: t('contactPage.errorTitle'),
        text: t('contactPage.sendError'),
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-16">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">{t('contactPage.heroTitle')}</h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            {t('contactPage.heroSubtitle')}
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">{t('contactPage.sendMessage')}</h2>
            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow-soft">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('contactPage.fullName')}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('contactPage.email')}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('contactPage.subject')}
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('contactPage.message')}
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? t('contactPage.sending') : t('contactPage.sendMessageBtn')}
              </button>
            </form>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-900">{t('contactPage.contactInfo')}</h2>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-soft">
              <h3 className="font-semibold text-xl mb-6">{t('contactPage.contactDirect')}</h3>
              <div className="space-y-4 text-gray-600">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-primary-600 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <div className="font-medium">{t('contactPage.email')}</div>
                    <div>contacto@tucreditoonline.com</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg className="w-6 h-6 text-primary-600 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <div className="font-medium">{t('contactPage.phone')}</div>
                    <div>+52 55 1234 5678</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg className="w-6 h-6 text-primary-600 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="font-medium">{t('contactPage.schedule')}</div>
                    <div>{t('contactPage.scheduleValue')}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-8 rounded-xl text-white">
              <h3 className="font-semibold text-xl mb-4">{t('contactPage.needHelp')}</h3>
              <p className="text-primary-100 mb-6 text-lg">
                {t('contactPage.supportDesc')}
              </p>
              <div className="space-y-3">
                <a
                  href="tel:+525512345678"
                  className="block px-6 py-3 bg-white text-primary-600 rounded-lg hover:bg-primary-50 transition text-center font-semibold"
                >
                  {t('contactPage.callNow')}
                </a>
                <a
                  href="https://wa.me/525512345678"
                  className="block px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-center font-semibold"
                >
                  {t('contactPage.whatsapp')}
                </a>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-gray-900">{t('contactPage.ourLocation')}</h2>
              <p className="text-xl text-gray-600">
                {t('contactPage.locationDesc')}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Map */}
              <div className="bg-white rounded-xl shadow-soft overflow-hidden h-96">
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

              {/* Location Details */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-soft">
                  <div className="flex items-start mb-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{t('contactPage.mainOffice')}</h3>
                      <p className="text-gray-600">
                        Reforma 222, Piso 8<br />
                        Juárez, Cuauhtémoc<br />
                        06600 Ciudad de México, CDMX
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-soft">
                  <div className="flex items-start mb-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{t('contactPage.officeHours')}</h3>
                      <p className="text-gray-600 whitespace-pre-line">
                        <strong>{t('contactPage.office')}</strong><br />
                        {t('contactPage.officeHoursValue')}<br />
                        <br />
                        <strong>{t('contactPage.onlineSupport')}</strong> 24/7
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-primary-50 p-6 rounded-xl border-2 border-primary-200">
                  <h3 className="font-semibold text-lg mb-3">{t('contactPage.howToGet')}</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-primary-600 mr-2">🚇</span>
                      <span><strong>{t('contactPage.metro')}</strong> {t('contactPage.metroValue')}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-600 mr-2">🚌</span>
                      <span><strong>{t('contactPage.metrobus')}</strong> {t('contactPage.metrobusValue')}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-600 mr-2">🚗</span>
                      <span><strong>{t('contactPage.car')}</strong> {t('contactPage.carValue')}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">{t('contactPage.hereForYou')}</h2>
            <p className="text-xl text-gray-600 mb-8">
              {t('contactPage.hereDesc')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-soft">
                <div className="text-4xl mb-3">⚡</div>
                <h3 className="font-semibold text-lg mb-2">{t('contactPage.quickResponse')}</h3>
                <p className="text-gray-600">{t('contactPage.quickResponseDesc')}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-soft">
                <div className="text-4xl mb-3">🔒</div>
                <h3 className="font-semibold text-lg mb-2">{t('contactPage.confidential')}</h3>
                <p className="text-gray-600">{t('contactPage.confidentialDesc')}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-soft">
                <div className="text-4xl mb-3">💼</div>
                <h3 className="font-semibold text-lg mb-2">{t('contactPage.expertAdvice')}</h3>
                <p className="text-gray-600">{t('contactPage.expertAdviceDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
