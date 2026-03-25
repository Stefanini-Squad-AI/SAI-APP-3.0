import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import OnlinePaymentModal from '../components/pos/OnlinePaymentModal';
import POSPaymentModal from '../components/pos/POSPaymentModal';

const POSSimulatorPage = () => {
  const { t } = useTranslation();
  const [onlineModalOpen, setOnlineModalOpen] = useState(false);
  const [posModalOpen, setPosModalOpen] = useState(false);
  
  // Mocked simulation data
  const [simulationData] = useState({
    productName: 'Crédito Personal',
    onlinePaymentEquivalent: 5000,
    posPaymentEquivalent: 5150,
    posInstallments: 5,
    termMonths: 12,
    monthlyPayment: 417,
  });

  const [results] = useState({
    posPaymentAvailable: true,
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {t('posSimulator.title', 'Simulador de Punto de Venta')}
          </h1>
          <p className="text-lg text-gray-600">
            {t('posSimulator.subtitle', 'Prueba nuestras opciones de pago')}
          </p>
        </div>

        {/* Simulation Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Resumen de Simulación
          </h2>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-gray-600 text-sm mb-1">Producto</p>
              <p className="text-xl font-semibold text-gray-900">
                {simulationData.productName}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Plazo</p>
              <p className="text-xl font-semibold text-gray-900">
                {simulationData.termMonths} meses
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Monto a Pagar</p>
              <p className="text-2xl font-bold text-primary-600">
                {formatCurrency(simulationData.onlinePaymentEquivalent)}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Cuota Mensual</p>
              <p className="text-xl font-semibold text-gray-900">
                {formatCurrency(simulationData.monthlyPayment)}
              </p>
            </div>
          </div>

          {/* Payment Options */}
          <div className="border-t pt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Selecciona tu método de pago
            </h3>

            {/* Payment Method Cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Online Payment Card */}
              <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-primary-400 transition">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <svg
                      className="w-6 h-6 text-primary-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h10M7 19h10M7 11h10M11 7h6M11 3h6"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      Pago en Línea
                    </h4>
                    <p className="text-sm text-gray-600">Con tarjeta de crédito</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-primary-600 mb-4">
                  {formatCurrency(simulationData.onlinePaymentEquivalent)}
                </p>
                <button
                  onClick={() => setOnlineModalOpen(true)}
                  className="w-full bg-primary-600 text-white font-semibold py-3 rounded-lg hover:bg-primary-700 transition"
                >
                  {t('posSimulator.continueOnline', 'Continuar con Pago en Línea')}
                </button>
              </div>

              {/* POS Payment Card */}
              <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-primary-400 transition">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 18h.01M8 20h8a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      Pago por POS
                    </h4>
                    <p className="text-sm text-gray-600">En terminal participante</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-green-600 mb-4">
                  {formatCurrency(simulationData.posPaymentEquivalent)}
                </p>
                <button
                  onClick={() => setPosModalOpen(true)}
                  disabled={!results?.posPaymentAvailable}
                  className="w-full border-2 border-primary-600 text-primary-600 font-semibold py-3 rounded-lg hover:bg-primary-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {t('posSimulator.continuePOS', 'Continuar con Pago por POS')}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
              <button className="flex-1 bg-primary-600 text-white font-semibold py-3 rounded-lg hover:bg-primary-700 transition">
                {t('posSimulator.continueOnline', 'Continuar con Pago en Línea')}
              </button>
              <button
                disabled={!results?.posPaymentAvailable}
                className="flex-1 border-2 border-primary-600 text-primary-600 font-semibold py-3 rounded-lg hover:bg-primary-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('posSimulator.continuePOS', 'Continuar con Pago por POS')}
              </button>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Información Importante</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Este es un simulador de flujo de pago</li>
            <li>• Los datos mostrados son solo para demostración</li>
            <li>• Los pagos no serán procesados realmente</li>
          </ul>
        </div>
      </div>

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
