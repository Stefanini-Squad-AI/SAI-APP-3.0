import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Smartphone, MapPin, QrCode, X } from 'lucide-react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const MOCK_TERMINALS = [
  {
    id: 1,
    name: 'OXXO Reforma',
    address: 'Av. Reforma 156, Col. Juárez',
    distance: '0.3 km',
  },
  {
    id: 2,
    name: 'Farmacia del Ahorro',
    address: 'Insurgentes Sur 890',
    distance: '0.7 km',
  },
  {
    id: 3,
    name: '7-Eleven Polanco',
    address: 'Presidente Masaryk 88',
    distance: '1.1 km',
  },
  {
    id: 4,
    name: 'Bodega Aurrerá',
    address: 'Periférico Sur 4100',
    distance: '1.4 km',
  },
];

const POSPaymentModal = ({ isOpen, onClose, simulationData }) => {
  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [selectedTerminal, setSelectedTerminal] = useState(null);
  const [referenceNumber, setReferenceNumber] = useState(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setProcessing(false);
      setSelectedTerminal(null);
      setReferenceNumber(null);
    }
  }, [isOpen]);

  const handleTerminalSelect = async (terminal) => {
    setSelectedTerminal(terminal);
    setStep(3);
    setProcessing(true);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const random = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
    setReferenceNumber(`POS-${random}`);
    setProcessing(false);
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Pago por Terminal POS</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Step 1: Summary */}
          {step === 1 && (
            <div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-700">
                  ℹ️ Dirígete a cualquier terminal POS participante
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Monto total:</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {formatCurrency(simulationData.posPaymentEquivalent)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Número de cuotas:</span>
                  <span className="font-semibold text-gray-900">
                    {simulationData.posInstallments} cuota(s)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Cuota por pago:</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(
                      simulationData.posPaymentEquivalent /
                        simulationData.posInstallments
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Producto:</span>
                  <span className="font-semibold text-gray-900">
                    {simulationData.productName}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 border-2 border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-primary-600 text-white font-semibold py-3 rounded-lg hover:bg-primary-700 transition"
                >
                  Buscar Terminal →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Terminal Locator */}
          {step === 2 && !referenceNumber && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-600" />
                Terminales Disponibles Cerca de Ti
              </h3>

              {/* Map Placeholder */}
              <div className="bg-gray-100 rounded-xl h-48 flex items-center justify-center mb-6 border border-gray-300">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">Mapa de terminales (simulado)</p>
                </div>
              </div>

              {/* Terminal List */}
              <div className="space-y-3 mb-6">
                {MOCK_TERMINALS.map((terminal) => (
                  <div
                    key={terminal.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:border-primary-400 cursor-pointer transition"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {terminal.name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {terminal.address}
                      </p>
                      <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">
                        {terminal.distance}
                      </span>
                    </div>
                    <button
                      onClick={() => handleTerminalSelect(terminal)}
                      className="ml-4 bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded hover:bg-primary-700 transition whitespace-nowrap"
                    >
                      Seleccionar
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 border-2 border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 transition"
                >
                  ← Atrás
                </button>
              </div>
              <p className="text-center text-gray-500 italic text-sm mt-4">
                Toca una terminal del mapa para seleccionar
              </p>
            </div>
          )}

          {/* Step 3: Processing */}
          {processing && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary-600 rounded-full animate-spin border-t-transparent"></div>
              </div>
              <p className="text-gray-600 font-medium">Conectando con terminal...</p>
            </div>
          )}

          {/* Step 3: QR Code */}
          {step === 3 && !processing && referenceNumber && selectedTerminal && (
            <div className="text-center">
              {/* QR Placeholder */}
              <div className="w-40 h-40 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center mx-auto mb-6">
                <div className="text-center">
                  <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">QR de pago</p>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Terminal Lista — {selectedTerminal.name}
              </h3>

              {/* Instructions */}
              <ol className="text-left mb-6 space-y-3 bg-gray-50 p-4 rounded-lg">
                <li className="flex gap-3">
                  <span className="text-gray-600 font-semibold flex-shrink-0">1.</span>
                  <span className="text-gray-700">
                    Presenta este código QR en la terminal seleccionada
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-gray-600 font-semibold flex-shrink-0">2.</span>
                  <span className="text-gray-700">
                    El cajero escaneará el código para procesar el pago
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-gray-600 font-semibold flex-shrink-0">3.</span>
                  <span className="text-gray-700">
                    Conserva tu comprobante de pago
                  </span>
                </li>
              </ol>

              {/* Amount Box */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
                <p className="text-sm text-gray-600 mb-2">Monto a pagar</p>
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(simulationData.posPaymentEquivalent)}
                </p>
              </div>

              {/* Reference */}
              <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
                <p className="text-sm text-gray-600 mb-2">Referencia del pago</p>
                <p className="text-2xl font-mono font-bold text-green-600">
                  {referenceNumber}
                </p>
              </div>

              <button
                onClick={handleClose}
                className="w-full bg-primary-600 text-white font-semibold py-3 rounded-lg hover:bg-primary-700 transition"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

POSPaymentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  simulationData: PropTypes.shape({
    productName: PropTypes.string.isRequired,
    posPaymentEquivalent: PropTypes.number.isRequired,
    posInstallments: PropTypes.number.isRequired,
  }).isRequired,
};

export default POSPaymentModal;
