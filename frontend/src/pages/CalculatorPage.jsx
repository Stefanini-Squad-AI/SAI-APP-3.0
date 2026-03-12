import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useCreditCalculator from '../hooks/useCreditCalculator';
import CreditRequestWizard from '../components/wizard/CreditRequestWizard';

const CalculatorPage = () => {
  const { t } = useTranslation();
  const [wizardOpen, setWizardOpen] = useState(false);
  
  const {
    creditTypes,
    loading,
    selectedCreditTypeId,
    selectedCreditType,
    useOfMoney,
    monthlyIncome,
    requestedAmount,
    termYears,
    interestRate,
    results,
    setSelectedCreditTypeId,
    setUseOfMoney,
    setMonthlyIncome,
    setRequestedAmount,
    setTermYears
  } = useCreditCalculator();

  const handleOpenWizard = () => {
    setWizardOpen(true);
  };

  const handleCloseWizard = () => {
    setWizardOpen(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (value) => {
    return `${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary-500"></div>
      </div>
    );
  }

  if (creditTypes.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('calculatorPage.noCreditTypes')}</h2>
          <p className="text-gray-600">{t('calculatorPage.contactAdmin')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">{t('calculatorPage.heroTitle')}</h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            {t('calculatorPage.heroSubtitle')}
          </p>
        </div>
      </section>

      {/* Calculator */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Inputs */}
            <div className="bg-white rounded-xl shadow-soft p-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">{t('calculatorPage.creditData')}</h2>
              
              <div className="space-y-6">
                {/* Credit type */}
                <div>
                  <label htmlFor="creditType" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('calculatorPage.creditType')}
                  </label>
                  <select
                    id="creditType"
                    value={selectedCreditTypeId || ''}
                    onChange={(e) => setSelectedCreditTypeId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {creditTypes.map((ct) => (
                      <option key={ct.id} value={ct.id}>
                        {ct.name}
                      </option>
                    ))}
                  </select>
                  {selectedCreditType && selectedCreditType.description && (
                    <p className="text-xs text-gray-500 mt-1">{selectedCreditType.description}</p>
                  )}
                </div>

                {/* Purpose of funds */}
                <div>
                  <label htmlFor="useOfMoney" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('calculatorPage.useOfMoney')}
                  </label>
                  <select
                    id="useOfMoney"
                    value={useOfMoney}
                    onChange={(e) => setUseOfMoney(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="consolidation">{t('calculatorPage.consolidation')}</option>
                    <option value="expenses">{t('calculatorPage.expenses')}</option>
                    <option value="remodeling">{t('calculatorPage.remodeling')}</option>
                    <option value="education">{t('calculatorPage.education')}</option>
                    <option value="health">{t('calculatorPage.health')}</option>
                    <option value="other">{t('calculatorPage.other')}</option>
                  </select>
                </div>

                {/* Monthly income */}
                <div>
                  <label htmlFor="monthlyIncome" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('calculatorPage.monthlyIncome')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      id="monthlyIncome"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                      min="0"
                      step="1000"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('calculatorPage.monthlyIncomeHint')}
                  </p>
                </div>

                {/* Requested amount */}
                <div>
                  <label htmlFor="requestedAmount" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('calculatorPage.requestedAmount')}: {formatCurrency(requestedAmount)}
                  </label>
                  <input
                    type="range"
                    id="requestedAmount"
                    value={requestedAmount}
                    onChange={(e) => setRequestedAmount(Number(e.target.value))}
                    min="5000"
                    max="500000"
                    step="5000"
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>$5,000</span>
                    <span>$500,000</span>
                  </div>
                </div>

                {/* Loan term */}
                <div>
                  <label htmlFor="termYears" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('calculatorPage.term')}: {termYears} {termYears === 1 ? t('calculatorPage.year') : t('calculatorPage.years')} ({termYears * 12} {t('calculatorPage.months')})
                  </label>
                  <input
                    type="range"
                    id="termYears"
                    value={termYears}
                    onChange={(e) => setTermYears(Number(e.target.value))}
                    min={Math.ceil((selectedCreditType?.minTermMonths || 1) / 12)}
                    max={Math.floor((selectedCreditType?.maxTermMonths || 120) / 12)}
                    step="1"
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{Math.ceil((selectedCreditType?.minTermMonths || 1) / 12)} yr</span>
                    <span>{Math.floor((selectedCreditType?.maxTermMonths || 120) / 12)} yrs</span>
                  </div>
                </div>

                {/* Interest rate */}
                <div>
                  <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('calculatorPage.interestRate')}
                  </label>
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                    <p className="text-gray-700 font-medium text-lg">{formatPercent(selectedCreditType?.baseInterestRate ?? interestRate)}</p>
                    <p className="text-xs text-gray-500 mt-1">{t('calculatorPage.fixedRate')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Results */}
            <div className="space-y-6">
              {/* Primary results */}
              <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl shadow-soft p-8 text-white">
                <h2 className="text-2xl font-bold mb-6">{t('calculatorPage.resultsTitle')}</h2>
                
                <div className="space-y-6">
                  {/* Monthly installment */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                    <div className="text-sm text-primary-100 mb-2">{t('calculatorPage.monthlyPayment')}</div>
                    <div className="text-4xl font-bold">
                      {formatCurrency(results.monthlyPayment)}
                    </div>
                    <div className="text-xs text-primary-200 mt-2">
                      {t('calculatorPage.duringMonths', { n: termYears * 12 })}
                    </div>
                  </div>

                  {/* Maximum financing */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-primary-100">{t('calculatorPage.maxFinancing')}</span>
                      <span className="text-xl font-bold">{formatCurrency(results.maxFinancing)}</span>
                    </div>
                    {requestedAmount > results.maxFinancing && (
                      <div className="mt-2 text-xs text-yellow-300">
                        {t('calculatorPage.exceedsWarning')}
                      </div>
                    )}
                  </div>

                  {/* Applied rate */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-primary-100">{t('calculatorPage.appliedRate')}</span>
                      <span className="text-xl font-bold">{formatPercent(results.appliedRate)}</span>
                    </div>
                    <div className="text-xs text-primary-200 mt-1">{t('calculatorPage.annual')}</div>
                  </div>
                </div>

              {/* Apply button */}
              <button 
                onClick={handleOpenWizard}
                className="w-full mt-8 px-6 py-4 bg-white text-primary-600 rounded-lg hover:bg-primary-50 transition font-bold text-lg shadow-lg"
              >
                {t('calculatorPage.applyNow')}
              </button>
              </div>

              {/* Detailed breakdown */}
              <div className="bg-white rounded-xl shadow-soft p-6">
                <h3 className="text-lg font-bold mb-4 text-gray-900">{t('calculatorPage.breakdown')}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">{t('calculatorPage.requestedAmount')}</span>
                    <span className="font-semibold">{formatCurrency(requestedAmount)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">{t('calculatorPage.term')}</span>
                    <span className="font-semibold">{termYears * 12} {t('calculatorPage.months')}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">{t('calculatorPage.totalPayment')}</span>
                    <span className="font-semibold">{formatCurrency(results.totalPayment)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">{t('calculatorPage.totalInterest')}</span>
                    <span className="font-semibold text-orange-600">{formatCurrency(results.totalInterest)}</span>
                  </div>
                  <div className="flex justify-between py-3 bg-primary-50 px-3 rounded-lg">
                    <span className="text-gray-900 font-semibold">{t('calculatorPage.monthlyPayment')}</span>
                    <span className="font-bold text-primary-600 text-lg">{formatCurrency(results.monthlyPayment)}</span>
                  </div>
                </div>
              </div>

              {/* Additional info */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      {t('calculatorPage.simNote')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info Section */}
          <div className="mt-12 bg-gray-50 rounded-xl p-8">
            <h3 className="text-2xl font-bold mb-6 text-gray-900">{t('calculatorPage.howItWorks')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mr-4">
                  <span className="text-primary-600 font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">{t('calculatorPage.step1Title')}</h4>
                  <p className="text-sm text-gray-600">{t('calculatorPage.step1Desc')}</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mr-4">
                  <span className="text-primary-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">{t('calculatorPage.step2Title')}</h4>
                  <p className="text-sm text-gray-600">{t('calculatorPage.step2Desc')}</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mr-4">
                  <span className="text-primary-600 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">{t('calculatorPage.step3Title')}</h4>
                  <p className="text-sm text-gray-600">{t('calculatorPage.step3Desc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">{t('calculatorPage.haveQuestions')}</h2>
          <p className="text-xl text-primary-100 mb-8">
            {t('calculatorPage.advisorsReady')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              to="/contact"
              className="inline-block px-8 py-3 bg-white text-primary-600 rounded-lg hover:bg-primary-50 transition font-semibold"
            >
              {t('calculatorPage.contactAdvisor')}
            </Link>
            <Link
              to="/faq"
              className="inline-block px-8 py-3 bg-primary-500 text-white border-2 border-white rounded-lg hover:bg-primary-400 transition font-semibold"
            >
              {t('calculatorPage.viewFaq')}
            </Link>
          </div>
        </div>
      </section>

      {/* Wizard Modal */}
      <CreditRequestWizard
        isOpen={wizardOpen}
        onClose={handleCloseWizard}
        calculatorData={{
          creditType: selectedCreditType?.name || 'Credit',
          useOfMoney,
          monthlyIncome,
          requestedAmount,
          termYears,
          interestRate,
          results
        }}
      />
    </div>
  );
};

export default CalculatorPage;
