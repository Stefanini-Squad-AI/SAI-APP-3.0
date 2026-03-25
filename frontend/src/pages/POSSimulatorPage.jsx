import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { ChevronDown } from 'lucide-react';
import creditTypeService from '../services/creditTypeService';

const DEFAULT_RATE_BUSINESS = 0.185;
const DEFAULT_RATE_INDIVIDUAL = 0.218;
const COMMISSION_RATE = 0.01;
const INSURANCE_RATE = 0.005;
const ONLINE_SURCHARGE = 1.025;
const POS_SURCHARGE = 1.035;
const POS_MAX_INSTALLMENTS = 12;

const isValidSimulationResponse = (data) =>
  data !== null &&
  typeof data === 'object' &&
  !Array.isArray(data) &&
  typeof data.monthlyPayment === 'number';

const POSSimulatorPage = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    productId: '',
    amount: '',
    termMonths: '',
    customerType: 'individual',
  });

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Load available products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const data = await creditTypeService.getAll(true);
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(t('posSimulator.errorLoadingProducts'));
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [t]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const validateForm = () => {
    if (!formData.productId) {
      setError(t('posSimulator.errorProductRequired'));
      return false;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError(t('posSimulator.errorAmountInvalid'));
      return false;
    }
    if (!formData.termMonths || Number(formData.termMonths) <= 0) {
      setError(t('posSimulator.errorTermInvalid'));
      return false;
    }
    setError('');
    return true;
  };

  const calculateLocally = () => {
    const amount = parseFloat(formData.amount);
    const termMonths = parseInt(formData.termMonths);
    const product = products.find((p) => String(p.id) === String(formData.productId));
    const annualRate = product
      ? product.baseInterestRate / 100
      : (formData.customerType === 'business' ? DEFAULT_RATE_BUSINESS : DEFAULT_RATE_INDIVIDUAL);
    const monthlyRate = annualRate / 12;
    const monthlyPayment = monthlyRate === 0
      ? amount / termMonths
      : amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths) / (Math.pow(1 + monthlyRate, termMonths) - 1);
    const totalCost = monthlyPayment * termMonths;
    const totalInterest = totalCost - amount;
    const commission = amount * COMMISSION_RATE;
    const insurance = amount * INSURANCE_RATE;
    const posAvailable = formData.customerType === 'individual';
    return {
      amount,
      termMonths,
      interestRate: annualRate * 100,
      monthlyPayment,
      totalCost,
      totalInterest,
      commission,
      insurance,
      onlinePaymentAvailable: true,
      onlinePaymentEquivalent: totalCost * ONLINE_SURCHARGE,
      posPaymentAvailable: posAvailable,
      posPaymentEquivalent: posAvailable ? totalCost * POS_SURCHARGE : null,
      posInstallments: posAvailable ? Math.min(termMonths, POS_MAX_INSTALLMENTS) : null,
    };
  };

  const handleSimulate = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await axios.post('/api/pos-simulator/calculate', {
        productId: formData.productId,
        amount: parseFloat(formData.amount),
        termMonths: parseInt(formData.termMonths),
        customerType: formData.customerType,
      });

      const data = response.data;
      if (!isValidSimulationResponse(data)) {
        setResults(calculateLocally());
      } else {
        setResults(data);
      }
    } catch {
      setResults(calculateLocally());
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError('');
  };

  if (loadingProducts) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="py-16 bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-20 mb-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">{t('posSimulator.heroTitle')}</h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            {t('posSimulator.heroSubtitle')}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-soft p-8 sticky top-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {t('posSimulator.formTitle')}
              </h2>

              <form onSubmit={handleSimulate} className="space-y-6">
                {/* Product Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('posSimulator.productLabel')} *
                  </label>
                  <div className="relative">
                    <select
                      name="productId"
                      value={formData.productId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white cursor-pointer"
                    >
                      <option value="">{t('posSimulator.selectProduct')}</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('posSimulator.amountLabel')} ({t('posSimulator.currencyMXN')}) *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    step="1000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Term Months */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('posSimulator.termLabel')} ({t('posSimulator.months')}) *
                  </label>
                  <input
                    type="number"
                    name="termMonths"
                    value={formData.termMonths}
                    onChange={handleInputChange}
                    placeholder="12"
                    min="1"
                    max="60"
                    step="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Customer Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('posSimulator.customerTypeLabel')}
                  </label>
                  <div className="relative">
                    <select
                      name="customerType"
                      value={formData.customerType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white cursor-pointer"
                    >
                      <option value="individual">{t('posSimulator.individual')}</option>
                      <option value="business">{t('posSimulator.business')}</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-600 text-white font-semibold py-3 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('posSimulator.calculating') : t('posSimulator.simulate')}
                </button>
              </form>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            {results ? (
              <div className="space-y-6">
                {/* Summary Card */}
                <div className="bg-white rounded-lg shadow-soft p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    {t('posSimulator.simulationResults')}
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-gray-600 text-sm font-medium mb-2">
                        {t('posSimulator.monthlyPayment')}
                      </p>
                      <p className="text-3xl font-bold text-primary-600">
                        {formatCurrency(results.monthlyPayment)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600 text-sm font-medium mb-2">
                        {t('posSimulator.totalCost')}
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {formatCurrency(results.totalCost)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600 text-sm font-medium mb-2">
                        {t('posSimulator.totalInterest')}
                      </p>
                      <p className="text-3xl font-bold text-red-600">
                        {formatCurrency(results.totalInterest)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="bg-white rounded-lg shadow-soft p-8">
                  <h4 className="text-lg font-bold text-gray-900 mb-6">
                    {t('posSimulator.breakdown')}
                  </h4>

                  <div className="space-y-4">
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="text-gray-700">{t('posSimulator.loanAmount')}</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(results.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="text-gray-700">{t('posSimulator.interestRate')}</span>
                      <span className="font-semibold text-gray-900">
                        {results.interestRate.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="text-gray-700">{t('posSimulator.term')}</span>
                      <span className="font-semibold text-gray-900">
                        {results.termMonths} {t('posSimulator.months')}
                      </span>
                    </div>
                    {results.commission > 0 && (
                      <div className="flex justify-between py-3 border-b border-gray-200">
                        <span className="text-gray-700">{t('posSimulator.commission')}</span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(results.commission)}
                        </span>
                      </div>
                    )}
                    {results.insurance > 0 && (
                      <div className="flex justify-between py-3 border-b border-gray-200">
                        <span className="text-gray-700">{t('posSimulator.insurance')}</span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(results.insurance)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Online Payment */}
                  <div className="bg-white rounded-lg shadow-soft p-8">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-gray-900">
                        {t('posSimulator.onlinePayment')}
                      </h4>
                      {results.onlinePaymentAvailable && (
                        <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                          {t('posSimulator.available')}
                        </span>
                      )}
                      {!results.onlinePaymentAvailable && (
                        <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-3 py-1 rounded-full">
                          {t('posSimulator.unavailable')}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                      {t('posSimulator.onlinePaymentDesc')}
                    </p>
                    {results.onlinePaymentAvailable && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm font-semibold text-gray-700 mb-1">
                          {t('posSimulator.equivalentAmount')}
                        </p>
                        <p className="text-2xl font-bold text-primary-600">
                          {formatCurrency(results.onlinePaymentEquivalent)}
                        </p>
                      </div>
                    )}
                    {!results.onlinePaymentAvailable && (
                      <p className="text-gray-500 text-sm italic">
                        {t('posSimulator.notCompatible')}
                      </p>
                    )}
                  </div>

                  {/* POS Payment */}
                  <div className="bg-white rounded-lg shadow-soft p-8">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-gray-900">
                        {t('posSimulator.posPayment')}
                      </h4>
                      {results.posPaymentAvailable && (
                        <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                          {t('posSimulator.available')}
                        </span>
                      )}
                      {!results.posPaymentAvailable && (
                        <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-3 py-1 rounded-full">
                          {t('posSimulator.unavailable')}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                      {t('posSimulator.posPaymentDesc')}
                    </p>
                    {results.posPaymentAvailable && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm font-semibold text-gray-700 mb-1">
                          {t('posSimulator.equivalentAmount')}
                        </p>
                        <p className="text-2xl font-bold text-primary-600">
                          {formatCurrency(results.posPaymentEquivalent)}
                        </p>
                        <p className="text-xs text-gray-600 mt-2">
                          {t('posSimulator.posInstallments', {
                            installments: results.posInstallments || 1,
                          })}
                        </p>
                      </div>
                    )}
                    {!results.posPaymentAvailable && (
                      <p className="text-gray-500 text-sm italic">
                        {t('posSimulator.notCompatible')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 mt-8">
                  <button className="flex-1 bg-primary-600 text-white font-semibold py-3 rounded-lg hover:bg-primary-700 transition">
                    {t('posSimulator.continueOnline')}
                  </button>
                  <button className="flex-1 border-2 border-primary-600 text-primary-600 font-semibold py-3 rounded-lg hover:bg-primary-50 transition">
                    {t('posSimulator.continuePOS')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-soft p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <p className="text-gray-600 text-lg">
                  {t('posSimulator.noResults')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSSimulatorPage;
