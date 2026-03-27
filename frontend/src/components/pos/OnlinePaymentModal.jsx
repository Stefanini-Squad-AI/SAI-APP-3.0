import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { CreditCard, CheckCircle, X } from 'lucide-react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const OnlinePaymentModal = ({ isOpen, onClose, simulationData }) => {
  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState(null);
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
  });
  const [errors, setErrors] = useState({});

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
      setReferenceNumber(null);
      setCardData({
        cardNumber: '',
        cardHolder: '',
        expiryDate: '',
        cvv: '',
      });
      setErrors({});
    }
  }, [isOpen]);

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
    }
    return v;
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    setCardData({ ...cardData, cardNumber: formatted });
    if (errors.cardNumber) {
      setErrors({ ...errors, cardNumber: '' });
    }
  };

  const handleCardHolderChange = (e) => {
    setCardData({ ...cardData, cardHolder: e.target.value });
    if (errors.cardHolder) {
      setErrors({ ...errors, cardHolder: '' });
    }
  };

  const handleExpiryChange = (e) => {
    const formatted = formatExpiryDate(e.target.value);
    setCardData({ ...cardData, expiryDate: formatted });
    if (errors.expiryDate) {
      setErrors({ ...errors, expiryDate: '' });
    }
  };

  const handleCVVChange = (e) => {
    const v = e.target.value.replace(/[^0-9]/gi, '').slice(0, 4);
    setCardData({ ...cardData, cvv: v });
    if (errors.cvv) {
      setErrors({ ...errors, cvv: '' });
    }
  };

  const validateCardForm = () => {
    const newErrors = {};
    if (!cardData.cardNumber || cardData.cardNumber.replace(/\s/g, '').length !== 16) {
      newErrors.cardNumber = 'Número de tarjeta inválido (16 dígitos)';
    }
    if (!cardData.cardHolder.trim()) {
      newErrors.cardHolder = 'El nombre del titular es requerido';
    }
    if (!cardData.expiryDate || cardData.expiryDate.length !== 5) {
      newErrors.expiryDate = 'Fecha de vencimiento inválida (MM/AA)';
    }
    if (!cardData.cvv || cardData.cvv.length < 3) {
      newErrors.cvv = 'CVV inválido (3-4 dígitos)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProcessPayment = async () => {
    if (!validateCardForm()) return;

    setProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const random = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
    setReferenceNumber(`ONL-${random}`);
    setStep(3);
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
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Pago en Línea</h2>
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
          {step === 1 && !processing && !referenceNumber && (
            <div>
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-700">
                    🔒 Pago 100% seguro y encriptado
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Monto a pagar:</span>
                    <span className="text-2xl font-bold text-primary-600">
                      {formatCurrency(simulationData.onlinePaymentEquivalent)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Producto:</span>
                    <span className="font-semibold text-gray-900">
                      {simulationData.productName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Plazo:</span>
                    <span className="font-semibold text-gray-900">
                      {simulationData.termMonths} meses
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Cuota mensual:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(simulationData.monthlyPayment)}
                    </span>
                  </div>
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
                  Continuar con tarjeta →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Card Form */}
          {step === 2 && !processing && !referenceNumber && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Datos de tu tarjeta
              </h3>

              {/* Card Preview */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 text-white mb-8 h-48 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="text-2xl font-bold">VISA</div>
                  <div className="text-xs opacity-75">Bank</div>
                </div>
                <div className="font-mono text-lg tracking-wider">
                  {cardData.cardNumber || '•••• •••• •••• ••••'}
                </div>
                <div className="flex justify-between items-end">
                  <div className="flex-1">
                    <div className="text-xs opacity-75 mb-1">Titular</div>
                    <div className="font-semibold text-sm">
                      {cardData.cardHolder.toUpperCase() || 'NOMBRE APELLIDO'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs opacity-75 mb-1">Válido hasta</div>
                    <div className="font-mono text-sm">
                      {cardData.expiryDate || 'MM/AA'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4 mb-6">
                {/* Card Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Número de tarjeta
                  </label>
                  <input
                    type="text"
                    maxLength="19"
                    placeholder="0000 0000 0000 0000"
                    value={cardData.cardNumber}
                    onChange={handleCardNumberChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg font-mono ${
                      errors.cardNumber
                        ? 'border-red-500'
                        : 'border-gray-200 focus:border-primary-600'
                    } focus:outline-none transition`}
                  />
                  {errors.cardNumber && (
                    <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>
                  )}
                </div>

                {/* Cardholder Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Nombre del titular
                  </label>
                  <input
                    type="text"
                    placeholder="Juan Pérez"
                    value={cardData.cardHolder}
                    onChange={handleCardHolderChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg ${
                      errors.cardHolder
                        ? 'border-red-500'
                        : 'border-gray-200 focus:border-primary-600'
                    } focus:outline-none transition`}
                  />
                  {errors.cardHolder && (
                    <p className="text-red-500 text-sm mt-1">{errors.cardHolder}</p>
                  )}
                </div>

                {/* Expiry & CVV */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Fecha de vencimiento
                    </label>
                    <input
                      type="text"
                      maxLength="5"
                      placeholder="MM/AA"
                      value={cardData.expiryDate}
                      onChange={handleExpiryChange}
                      className={`w-full px-4 py-3 border-2 rounded-lg font-mono ${
                        errors.expiryDate
                          ? 'border-red-500'
                          : 'border-gray-200 focus:border-primary-600'
                      } focus:outline-none transition`}
                    />
                    {errors.expiryDate && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.expiryDate}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      CVV
                    </label>
                    <input
                      type="password"
                      maxLength="4"
                      placeholder="000"
                      value={cardData.cvv}
                      onChange={handleCVVChange}
                      className={`w-full px-4 py-3 border-2 rounded-lg font-mono ${
                        errors.cvv
                          ? 'border-red-500'
                          : 'border-gray-200 focus:border-primary-600'
                      } focus:outline-none transition`}
                    />
                    {errors.cvv && (
                      <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 border-2 border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 transition"
                >
                  ← Atrás
                </button>
                <button
                  onClick={handleProcessPayment}
                  className="flex-1 bg-primary-600 text-white font-semibold py-3 rounded-lg hover:bg-primary-700 transition"
                >
                  Procesar Pago
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Processing */}
          {processing && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary-600 rounded-full animate-spin border-t-transparent"></div>
              </div>
              <p className="text-gray-600 font-medium">Procesando tu pago...</p>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && !processing && referenceNumber && (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <CheckCircle className="w-20 h-20 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Pago Procesado Exitosamente!
              </h3>
              <p className="text-gray-600 mb-6">
                Tu pago en línea ha sido confirmado
              </p>

              <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
                <p className="text-sm text-gray-600 mb-2">Referencia del pago</p>
                <p className="text-2xl font-mono font-bold text-green-600">
                  {referenceNumber}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Monto:</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(simulationData.onlinePaymentEquivalent)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Fecha y hora:</span>
                  <span className="font-semibold text-gray-900">
                    {new Date().toLocaleString('es-MX')}
                  </span>
                </div>
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

OnlinePaymentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  simulationData: PropTypes.shape({
    productName: PropTypes.string.isRequired,
    onlinePaymentEquivalent: PropTypes.number.isRequired,
    termMonths: PropTypes.number.isRequired,
    monthlyPayment: PropTypes.number.isRequired,
  }).isRequired,
};

export default OnlinePaymentModal;
