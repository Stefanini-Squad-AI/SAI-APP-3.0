import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', labelKey: 'language.en' },
  { code: 'es', labelKey: 'language.es' },
  { code: 'pt', labelKey: 'language.pt' },
];

const LanguageSelector = () => {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  const currentCode = LANGUAGES.some((l) => l.code === i18n.language) ? i18n.language : 'en';

  return (
    <div className="relative flex items-center space-x-2 px-4 py-2 rounded-lg border-2 border-primary-600 text-primary-600 hover:bg-primary-50 transition font-medium">
      <Globe className="w-5 h-5 pointer-events-none" />
      <label htmlFor="language-select" className="sr-only">{t('language.select')}</label>
      <select
        id="language-select"
        value={currentCode}
        onChange={handleLanguageChange}
        className="appearance-none bg-transparent cursor-pointer focus:outline-none text-primary-600 font-medium pr-5"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {t(lang.labelKey)}
          </option>
        ))}
      </select>
      <svg
        className="w-4 h-4 pointer-events-none absolute right-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
};

export default LanguageSelector;
