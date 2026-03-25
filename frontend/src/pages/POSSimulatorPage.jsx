import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { ChevronDown } from 'lucide-react';
import creditTypeService from '../services/creditTypeService';

// Module-level constants
const DEFAULT_RATE_BUSINESS = 0.185;   // 18.5% annual
const DEFAULT_RATE_INDIVIDUAL = 0.218; // 21.8% annual
const COMMISSION_RATE = 0.01;          // 1%
const INSURANCE_RATE = 0.005;          // 0.5%
const ONLINE_SURCHARGE = 1.025;        // 2.5% premium
const POS_SURCHARGE = 1.035;           // 3.5% premium
const POS_MAX_INSTALLMENTS = 12;

// Module-level helper
const isValidSimulationResponse = (data) =>
  data !== null &&
  typeof data === 'object' &&
  !Array.isArray(data) &&
  typeof data.monthlyPayment === 'number';

export default function POSSimulatorPage() {
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

  // Load products on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await creditTypeService.getAll(true);
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error loading products:', err);
        setError(t('posSimulator.errorLoadingProducts'));
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, [t]);

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
    const amount = Number(formData.amount);
    const termMonths = Number(formData.termMonths);
    const customerType = formData.customerType;

    // Find selected product
    const product = products.find((p) => String(p.id) === String(formData.productId));
    
    // Determine interest rate
    let annualRate;
    if (product && product.baseInterestRate) {
      annualRate = product.baseInterestRate / 100;
    } else {
      annualRate = customerType === 'business' ? DEFAULT_RATE_BUSINESS : DEFAULT_RATE_INDIVIDUAL;
    }

    const monthlyRate = annualRate / 12;

    // Calculate monthly payment using standard amortization
    let monthlyPayment;
    if (monthlyRate === 0) {
      monthlyPayment = amount / termMonths;
    } else {
      const numerator = monthlyRate * Math.pow(1 + monthlyRate, termMonths);
      const denominator = Math.pow(1 + monthlyRate, termMonths) - 1;
      monthlyPayment = amount * (numerator / denominator);
    }

    const totalPayment = monthlyPayment * termMonths;
    const totalInterest = totalPayment - amount;
    const commission = amount * COMMISSION_RATE;
    const insurance = amount * INSURANCE_RATE;

    // POS available only for individual
    const posAvailable = customerType === 'individual';
    const posInstallments = posAvailable ? Math.min(termMonths, POS_MAX_INSTALLMENTS) : null;

    return {
      amount,
      termMonths,
      interestRate: annualRate * 100,
      monthlyPayment,
      totalCost: totalPayment,
      totalInterest,
      commission,
      insurance,
      onlinePaymentAvailable: true,
      onlinePaymentEquivalent: totalPayment * ONLINE_SURCHARGE,
      posPaymentAvailable: posAvailable,
      posPaymentEquivalent: posAvailable ? totalPayment * POS_SURCHARGE : null,
      posInstallments,
    };
  };

  const handleSimulate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const payload = {
        productId: formData.productId,
        amount: Number(formData.amount),
        termMonths: Number(formData.termMonths),
        customerType: formData.customerType,
      };

      try {
        const response = await axios.post('/api/pos-simulator/calculate', payload);
        
        if (isValidSimulationResponse(response.data)) {
          setResults(response.data);
          setLoading(false);
          return;
        }
      } catch (apiErr) {
        // Backend error, fall through to local calculation
      }

      // Local fallback
      const localResults = calculateLocally();
      setResults(localResults);
    } catch (err) {
      console.error('Simulation error:', err);
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
    setError('');
  };

  if (loadingProducts) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('posSimulator.calculating')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">{t('posSimulator.heroTitle')}</h1>
          <p className="text-lg text-primary-100">{t('posSimulator.heroSubtitle')}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">
                {t('posSimulator.formTitle')}
              </h2>

              {/* Product Select */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('posSimulator.productLabel')}
                </label>
                <div className="relative">
                  <select
                    name="productId"
                    value={formData.productId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">{t('posSimulator.selectProduct')}</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Amount Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('posSimulator.amountLabel')} ({t('posSimulator.currencyMXN')})
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="50000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Term Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('posSimulator.termLabel')} ({t('posSimulator.months')})
                </label>
                <input
                  type="number"
                  name="termMonths"
                  value={formData.termMonths}
                  onChange={handleInputChange}
                  placeholder="12"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Customer Type Select */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('posSimulator.customerTypeLabel')}
                </label>
                <div className="relative">
                  <select
                    name="customerType"
                    value={formData.customerType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="individual">{t('posSimulator.individual')}</option>
                    <option value="business">{t('posSimulator.business')}</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSimulate}
                disabled={loading}
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('posSimulator.calculating') : t('posSimulator.simulate')}
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            {results === null ? (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-gray-500 py-12">
                  <p className="text-lg">{t('posSimulator.noResults')}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Results Title */}
                <h2 className="text-2xl font-bold text-gray-900">
                  {t('posSimulator.simulationResults')}
                </h2>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-gray-600 text-sm mb-1">
                      {t('posSimulator.monthlyPayment')}
                    </p>
                    <p className="text-2xl font-bold text-primary-600">
                      ${results.monthlyPayment.toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-gray-600 text-sm mb-1">
                      {t('posSimulator.totalCost')}
                    </p>
                    <p className="text-2xl font-bold text-primary-600">
                      ${results.totalCost.toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-gray-600 text-sm mb-1">
                      {t('posSimulator.totalInterest')}
                    </p>
                    <p className="text-2xl font-bold text-primary-600">
                      ${results.totalInterest.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Breakdown Table */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {t('posSimulator.breakdown')}
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-600">{t('posSimulator.loanAmount')}</span>
                      <span className="font-semibold">${results.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-600">{t('posSimulator.interestRate')}</span>
                      <span className="font-semibold">{results.interestRate.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-600">{t('posSimulator.term')}</span>
                      <span className="font-semibold">{results.termMonths} {t('posSimulator.months')}</span>
                    </div>
                    {results.commission > 0 && (
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">{t('posSimulator.commission')}</span>
                        <span className="font-semibold">${results.commission.toFixed(2)}</span>
                      </div>
                    )}
                    {results.insurance > 0 && (
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">{t('posSimulator.insurance')}</span>
                        <span className="font-semibold">${results.insurance.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Method Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Online Payment */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {t('posSimulator.onlinePayment')}
                      </h3>
                      {results.onlinePaymentAvailable && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          {t('posSimulator.available')}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                      {t('posSimulator.onlinePaymentDesc')}
                    </p>
                    <div className="mb-4">
                      <p className="text-gray-600 text-xs mb-1">
                        {t('posSimulator.equivalentAmount')}
                      </p>
                      <p className="text-2xl font-bold text-primary-600">
                        ${results.onlinePaymentEquivalent.toFixed(2)}
                      </p>
                    </div>
                    {results.onlinePaymentAvailable && (
                      <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition">
                        {t('posSimulator.continueOnline')}
                      </button>
                    )}
                  </div>

                  {/* POS Payment */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {t('posSimulator.posPayment')}
                      </h3>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          results.posPaymentAvailable
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {results.posPaymentAvailable
                          ? t('posSimulator.available')
                          : t('posSimulator.unavailable')}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                      {results.posPaymentAvailable
                        ? t('posSimulator.posPaymentDesc')
                        : t('posSimulator.notCompatible')}
                    </p>
                    {results.posPaymentAvailable && (
                      <>
                        <div className="mb-2">
                          <p className="text-gray-600 text-xs mb-1">
                            {t('posSimulator.equivalentAmount')}
                          </p>
                          <p className="text-2xl font-bold text-primary-600 mb-2">
                            ${results.posPaymentEquivalent.toFixed(2)}
                          </p>
                          <p className="text-gray-600 text-xs mb-4">
                            {t('posSimulator.posInstallments', {
                              installments: results.posInstallments,
                            })}
                          </p>
                        </div>
                        <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition">
                          {t('posSimulator.continuePOS')}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
