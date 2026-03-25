import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { CreditCard, CheckCircle, X } from 'lucide-react';

const POSPaymentModal = ({ isOpen, onClose, simulationData }) => {
  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [reference, setReference] = useState('');
  const [selectedTerminal, setSelectedTerminal] = useState(null);

  const fmt = (n) => new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(n);

  const terminals = [
    { id: 1, name: 'Terminal POS 001', location: 'Sucursal Centro' },
    { id: 2, name: 'Terminal POS 002', location: 'Sucursal Reforma' },
    { id: 3, name: 'Terminal POS 003', location: 'Sucursal Polanco' },
    { id: 4, name: 'Terminal POS 004', location: 'Sucursal Santa Fe' },
  ];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setStep(1);
      setSelectedTerminal(null);
      setProcessing(false);
      setReference('');
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSelectTerminal = async () => {
    if (!selectedTerminal) return;

    setProcessing(true);
    const ref = 'POS-' + Math.floor(100000 + Math.random() * 900000);
    setReference(ref);

    setTimeout(() => {
      setProcessing(false);
      setStep(3);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900">
              {step === 1 ? 'Pago con POS' : step === 2 ? 'Selecciona Terminal' : 'Código QR'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1 - Payment Summary */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-xl p-5 space-y-3">
                <div className="text-sm text-blue-600 font-semibold">Monto a pagar (POS)</div>
                <div className="text-3xl font-bold text-primary-600">
                  {fmt(simulationData.posPaymentEquivalent)}
                </div>
                <div className="space-y-2 text-sm text-gray-700 pt-2 border-t border-blue-100">
                  <div className="flex justify-between">
                    <span>Producto:</span>
                    <span className="font-semibold">{simulationData.productName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Plazo:</span>
                    <span className="font-semibold">
                      {simulationData.posInstallments} {simulationData.posInstallments === 1 ? 'mes' : 'meses'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monto equivalente en línea:</span>
                    <span className="font-semibold text-orange-600">
                      +{fmt(simulationData.posPaymentEquivalent - simulationData.amount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-100 text-blue-800 text-sm rounded-lg px-4 py-2 text-center">
                🔒 Pago seguro por terminal POS
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
                >
                  Continuar con POS →
                </button>
              </div>
            </div>
          )}

          {/* Step 2 - Terminal Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Selecciona una terminal disponible:
                </label>
                <div className="space-y-3">
                  {terminals.map((terminal) => (
                    <div
                      key={terminal.id}
                      onClick={() => setSelectedTerminal(terminal.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                        selectedTerminal === terminal.id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{terminal.name}</h4>
                          <p className="text-xs text-gray-600">{terminal.location}</p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                            selectedTerminal === terminal.id
                              ? 'bg-primary-600 border-primary-600'
                              : 'border-gray-300'
                          }`}
                        >
                          {selectedTerminal === terminal.id && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  ← Atrás
                </button>
                <button
                  onClick={handleSelectTerminal}
                  disabled={!selectedTerminal}
                  className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Procesar con Terminal
                </button>
              </div>
            </div>
          )}

          {/* Step 3 - Processing / QR Code */}
          {step === 3 && (
            <div className="space-y-6 text-center py-6">
              {processing ? (
                <>
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary-500"></div>
                  </div>
                  <p className="text-gray-700">Procesando transacción...</p>
                </>
              ) : (
                <>
                  <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      ¡Transacción POS Iniciada!
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Código QR para terminal de pago
                    </p>
                  </div>

                  {/* QR Code Placeholder */}
                  <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-6 mx-auto w-48 h-48 flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-16 h-16 text-gray-400 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 11h8V3H3v8zm0 8h8v-8H3v8zm8-8h8V3h-8v8zm0 8h8v-8h-8v8z" />
                      </svg>
                      <p className="text-xs text-gray-600">QR Code</p>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Terminal:</span>
                      <span className="font-bold text-green-700">
                        {terminals.find(t => t.id === selectedTerminal)?.name}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Referencia:</span>
                      <span className="font-bold text-green-700">{reference}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Monto:</span>
                      <span className="font-bold text-green-700">
                        {fmt(simulationData.posPaymentEquivalent)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Fecha:</span>
                      <span className="font-bold text-green-700">
                        {new Date().toLocaleString('es-MX')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
                  >
                    Cerrar
                  </button>
                </>
              )}
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
    amount: PropTypes.number,
    posPaymentEquivalent: PropTypes.number,
    productName: PropTypes.string,
    posInstallments: PropTypes.number,
  }).isRequired,
};

export default POSPaymentModal;
