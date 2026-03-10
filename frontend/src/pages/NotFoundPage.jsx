import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotFoundPage = () => {
  const { t } = useTranslation();
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <div className="text-9xl font-bold text-primary-600 mb-4">404</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {t('notFoundPage.title')}
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          {t('notFoundPage.desc')}
        </p>
        <Link
          to="/"
          className="inline-block px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
        >
          {t('notFoundPage.backHome')}
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
