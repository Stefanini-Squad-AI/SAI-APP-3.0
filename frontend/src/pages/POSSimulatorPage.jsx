import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import creditTypeService from '../services/creditTypeService';
import OnlinePaymentModal from '../components/pos/OnlinePaymentModal';
import POSPaymentModal from '../components/pos/POSPaymentModal';

const POSSimulatorPage = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onlineModalOpen, setOnlineModalOpen] = useState(false);
  const [posModalOpen, setPosModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    productId: '',
    amount: 50000,
    termMonths: 12,
    customerType: 'individual',
  });

  const [results, setResults] = useState(null);
  const [simulationData, setSimulationData] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await creditTypeService.getAll(true);
        setProducts(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, productId: data[0].id }));
        }
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const calculateLocally = () => {
    const product = products.find(p => String(p.id) === String(formData.productId));
    if (!product) return null;

    const amount = formData.amount;
    const termMonths = formData.termMonths;
    const interestRate = product.baseInterestRate || 15;
    const monthlyRate = interestRate / 100 / 12;

    const monthlyPayment = amount * 
      (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
      (Math.pow(1 + monthlyRate, termMonths) - 1);

    const totalCost = monthlyPayment * termMonths;
    const totalInterest = totalCost - amount;
    const commission = totalCost * 0.01;
    const insurance = totalCost * 0.005;

    const posAvailable = formData.customerType === 'individual';

    return {
      amount,
      termMonths,
      interestRate,
      monthlyPayment,
      totalCost,
      totalInterest,
      commission,
      insurance,
      onlinePaymentAvailable: true,
      onlinePaymentEquivalent: totalCost * 1.025,
      posPaymentAvailable: posAvailable,
      posPaymentEquivalent: posAvailable ? totalCost * 1.035 : null,
      posInstallments: posAvailable ? Math.min(termMonths, 12) : null,
    };
  };

  const handleCalculate = () => {
    const calc = calculateLocally();
    if (calc) {
      setResults(calc);
      const product = products.find(p => String(p.id) === String(formData.productId));
      setSimulationData({
        ...calc,
        productName: product?.name || '',
      });
    }
  };

  const handleContinueOnline = () => {
    if (results && simulationData) {
      setOnlineModalOpen(true);
    }
  };

  const handleContinuePOS = () => {
    if (results && simulationData && results.posPaymentAvailable) {
      setPosModalOpen(true);
    }
  };

  const fmt = (n) => new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(n);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary-500"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No hay productos disponibles</h2>
          <p className="text-gray-600">Por favor, contacte al administrador</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">Simulador de Pago POS</h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            Simula productos bancarios especiales, calcula equivalentes de pago en línea y explora opciones por terminal POS
          </p>
        </div>
      </section>

      {/* Simulator Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="bg-white rounded-xl shadow-soft p-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Datos de la Simulación</h2>

              <div className="space-y-6">
                {/* Product Selection */}
                <div>
                  <label htmlFor="productId" className="block text-sm font-medium text-gray-700 mb-2">
                    Producto
                  </label>
                  <select
                    id="productId"
                    value={formData.productId}
                    onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                    Monto: {fmt(formData.amount)}
                  </label>
                  <input
                    type="range"
                    id="amount"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    min="10000"
                    max="500000"
                    step="5000"
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>$10,000</span>
                    <span>$500,000</span>
                  </div>
                </div>

                {/* Term Months */}
                <div>
                  <label htmlFor="termMonths" className="block text-sm font-medium text-gray-700 mb-2">
                    Plazo: {formData.termMonths} meses
                  </label>
                  <input
                    type="range"
                    id="termMonths"
                    value={formData.termMonths}
                    onChange={(e) => setFormData(prev => ({ ...prev, termMonths: Number(e.target.value) }))}
                    min="3"
                    max="60"
                    step="1"
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>3 meses</span>
                    <span>60 meses</span>
                  </div>
                </div>

                {/* Customer Type */}
                <div>
                  <label htmlFor="customerType" className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de cliente
                  </label>
                  <select
                    id="customerType"
                    value={formData.customerType}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerType: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="individual">Persona Física</option>
                    <option value="business">Persona Moral</option>
                  </select>
                </div>

                <button
                  onClick={handleCalculate}
                  className="w-full px-6 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-bold text-lg"
                >
                  Calcular
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-6">
              {!results ? (
                <div className="bg-gray-50 rounded-xl p-8 text-center py-16">
                  <p className="text-gray-600 text-lg">Completa el formulario y haz clic en "Calcular" para ver los resultados</p>
                </div>
              ) : (
                <>
                  {/* Summary Card */}
                  <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl shadow-soft p-8 text-white">
                    <h3 className="text-xl font-bold mb-4">Resumen de Cálculo</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-primary-100">Monto solicitado</div>
                        <div className="text-3xl font-bold">{fmt(results.amount)}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-primary-100">Plazo</div>
                          <div className="font-semibold text-lg">{results.termMonths} meses</div>
                        </div>
                        <div>
                          <div className="text-primary-100">Tasa anual</div>
                          <div className="font-semibold text-lg">{results.interestRate.toFixed(2)}%</div>
                        </div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                        <div className="text-sm text-primary-100">Cuota mensual</div>
                        <div className="text-2xl font-bold">{fmt(results.monthlyPayment)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Breakdown */}
                  <div className="bg-white rounded-xl shadow-soft p-6">
                    <h3 className="text-lg font-bold mb-4 text-gray-900">Desglose</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">Total a pagar</span>
                        <span className="font-semibold">{fmt(results.totalCost)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">Intereses</span>
                        <span className="font-semibold text-orange-600">{fmt(results.totalInterest)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">Comisión</span>
                        <span className="font-semibold">{fmt(results.commission)}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Seguro</span>
                        <span className="font-semibold">{fmt(results.insurance)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Options */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900">Opciones de Pago</h3>

                    {/* Online Payment Card */}
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
                      <h4 className="font-bold text-blue-900 mb-2">Pago en Línea</h4>
                      <div className="text-2xl font-bold text-blue-700 mb-3">
                        {fmt(results.onlinePaymentEquivalent)}
                      </div>
                      <p className="text-sm text-blue-800 mb-4">
                        Incluye comisión de procesamiento (2.5%)
                      </p>
                      <button
                        onClick={handleContinueOnline}
                        className="w-full bg-primary-600 text-white font-semibold py-3 rounded-lg hover:bg-primary-700 transition"
                      >
                        Continuar con Pago en Línea
                      </button>
                    </div>

                    {/* POS Payment Card */}
                    <div className={`border-2 rounded-xl p-5 transition ${
                      results.posPaymentAvailable
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <h4 className={`font-bold mb-2 ${
                        results.posPaymentAvailable ? 'text-green-900' : 'text-gray-600'
                      }`}>
                        Pago por Terminal POS
                      </h4>
                      {results.posPaymentAvailable ? (
                        <>
                          <div className="text-2xl font-bold text-green-700 mb-3">
                            {fmt(results.posPaymentEquivalent)}
                          </div>
                          <p className="text-sm text-green-800 mb-4">
                            Plazo: {results.posInstallments} {results.posInstallments === 1 ? 'mes' : 'meses'}. Incluye comisión de procesamiento (3.5%)
                          </p>
                          <button
                            onClick={handleContinuePOS}
                            className="w-full bg-primary-600 text-white font-semibold py-3 rounded-lg hover:bg-primary-700 transition"
                          >
                            Continuar con POS
                          </button>
                        </>
                      ) : (
                        <p className="text-sm text-gray-600">
                          Disponible solo para personas físicas
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Modals */}
      {simulationData && (
        <OnlinePaymentModal
          isOpen={onlineModalOpen}
          onClose={() => setOnlineModalOpen(false)}
          simulationData={simulationData}
        />
      )}
      {simulationData && results?.posPaymentAvailable && (
        <POSPaymentModal
          isOpen={posModalOpen}
          onClose={() => setPosModalOpen(false)}
          simulationData={simulationData}
        />
      )}
    </div>
  );
};

export default POSSimulatorPage;
