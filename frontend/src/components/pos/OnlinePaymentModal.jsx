import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { CreditCard, CheckCircle, X } from 'lucide-react';

const OnlinePaymentModal = ({ isOpen, onClose, simulationData }) => {
  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [reference, setReference] = useState('');
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  });
  const [errors, setErrors] = useState({});

  const fmt = (n) => new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(n);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setStep(1);
      setCardData({
        cardNumber: '',
        cardHolder: '',
        expiryDate: '',
        cvv: ''
      });
      setErrors({});
      setProcessing(false);
      setReference('');
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    let formatted = '';
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      formatted += value[i];
    }
    setCardData(prev => ({ ...prev, cardNumber: formatted }));
    if (errors.cardNumber) setErrors(prev => ({ ...prev, cardNumber: '' }));
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    setCardData(prev => ({ ...prev, expiryDate: value }));
    if (errors.expiryDate) setErrors(prev => ({ ...prev, expiryDate: '' }));
  };

  const handleCVVChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardData(prev => ({ ...prev, cvv: value }));
    if (errors.cvv) setErrors(prev => ({ ...prev, cvv: '' }));
  };

  const handleCardHolderChange = (e) => {
    setCardData(prev => ({ ...prev, cardHolder: e.target.value }));
    if (errors.cardHolder) setErrors(prev => ({ ...prev, cardHolder: '' }));
  };

  const validateCardForm = () => {
    const newErrors = {};

    if (!cardData.cardNumber.trim()) {
      newErrors.cardNumber = 'Número de tarjeta requerido';
    } else if (cardData.cardNumber.replace(/\s/g, '').length !== 16) {
      newErrors.cardNumber = 'El número debe tener 16 dígitos';
    }

    if (!cardData.cardHolder.trim()) {
      newErrors.cardHolder = 'Nombre del titular requerido';
    }

    if (!cardData.expiryDate.trim()) {
      newErrors.expiryDate = 'Fecha requerida';
    } else if (!/^\d{2}\/\d{2}$/.test(cardData.expiryDate)) {
      newErrors.expiryDate = 'Formato debe ser MM/AA';
    }

    if (!cardData.cvv.trim()) {
      newErrors.cvv = 'CVV requerido';
    } else if (!/^\d{3,4}$/.test(cardData.cvv)) {
      newErrors.cvv = 'CVV debe tener 3-4 dígitos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProcessPayment = async () => {
    if (!validateCardForm()) return;

    setProcessing(true);
    const ref = 'ONL-' + Math.floor(100000 + Math.random() * 900000);
    setReference(ref);

    setTimeout(() => {
      setProcessing(false);
      setStep(3);
    }, 2500);
  };

  const getMaskedCardNumber = () => {
    if (!cardData.cardNumber) return '•••• •••• •••• ••••';
    const digits = cardData.cardNumber.replace(/\s/g, '');
    if (digits.length < 4) return cardData.cardNumber || '•••• •••• •••• ••••';
    const lastFour = digits.slice(-4);
    return `•••• •••• •••• ${lastFour}`;
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
              {step === 1 ? 'Pago en Línea' : step === 2 ? 'Datos de tu tarjeta' : ''}
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
                <div className="text-sm text-blue-600 font-semibold">Monto a pagar</div>
                <div className="text-3xl font-bold text-primary-600">
                  {fmt(simulationData.onlinePaymentEquivalent)}
                </div>
                <div className="space-y-2 text-sm text-gray-700 pt-2 border-t border-blue-100">
                  <div className="flex justify-between">
                    <span>Producto:</span>
                    <span className="font-semibold">{simulationData.productName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Plazo:</span>
                    <span className="font-semibold">{simulationData.termMonths} meses</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cuota mensual:</span>
                    <span className="font-semibold">{fmt(simulationData.monthlyPayment)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-100 text-blue-800 text-sm rounded-lg px-4 py-2 text-center">
                🔒 Pago 100% seguro y encriptado
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
                  Continuar con tarjeta →
                </button>
              </div>
            </div>
          )}

          {/* Step 2 - Card Form */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Card Preview */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 text-white h-44 relative">
                <div className="flex justify-between mb-8">
                  <div className="text-xs tracking-wider opacity-75">BANCO</div>
                  <div className="text-sm font-bold">VISA</div>
                </div>
                <div className="text-lg font-mono tracking-wider mb-8">
                  {getMaskedCardNumber()}
                </div>
                <div className="flex justify-between text-xs">
                  <div className="uppercase">{cardData.cardHolder || 'CARDHOLDER'}</div>
                  <div className="font-mono">{cardData.expiryDate || 'MM/AA'}</div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Número de tarjeta
                  </label>
                  <input
                    type="text"
                    maxLength="19"
                    value={cardData.cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="1234 5678 9012 3456"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.cardNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.cardNumber && (
                    <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre del titular
                  </label>
                  <input
                    type="text"
                    value={cardData.cardHolder}
                    onChange={handleCardHolderChange}
                    placeholder="JUAN PÉREZ"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.cardHolder ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.cardHolder && (
                    <p className="text-red-500 text-xs mt-1">{errors.cardHolder}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Fecha de vencimiento
                    </label>
                    <input
                      type="text"
                      maxLength="5"
                      value={cardData.expiryDate}
                      onChange={handleExpiryChange}
                      placeholder="MM/AA"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.expiryDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.expiryDate && (
                      <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      CVV
                    </label>
                    <input
                      type="password"
                      maxLength="4"
                      value={cardData.cvv}
                      onChange={handleCVVChange}
                      placeholder="123"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.cvv ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.cvv && (
                      <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>
                    )}
                  </div>
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
                  onClick={handleProcessPayment}
                  className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
                >
                  Procesar Pago
                </button>
              </div>
            </div>
          )}

          {/* Step 3 - Processing / Success */}
          {step === 3 && (
            <div className="space-y-6 text-center py-6">
              {processing ? (
                <>
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary-500"></div>
                  </div>
                  <p className="text-gray-700">Procesando tu pago...</p>
                </>
              ) : (
                <>
                  <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      ¡Pago Procesado Exitosamente!
                    </h3>
                    <p className="text-gray-600">
                      Tu pago en línea ha sido confirmado
                    </p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Referencia:</span>
                      <span className="font-bold text-green-700">{reference}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Monto:</span>
                      <span className="font-bold text-green-700">
                        {fmt(simulationData.onlinePaymentEquivalent)}
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

OnlinePaymentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  simulationData: PropTypes.shape({
    onlinePaymentEquivalent: PropTypes.number,
    productName: PropTypes.string,
    termMonths: PropTypes.number,
    monthlyPayment: PropTypes.number,
  }).isRequired,
};

export default OnlinePaymentModal;
