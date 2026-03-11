import { useState } from 'react';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import creditRequestService from '../../services/creditRequestService';

const CreditRequestWizard = ({ isOpen, onClose, calculatorData }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    identificationNumber: '',
    email: '',
    phone: '',
    address: '',
    employmentStatus: 'Employed',
    monthlySalary: calculatorData?.monthlyIncome || 0,
    yearsOfEmployment: 1,
    creditType: calculatorData?.creditType || 'personal',
    useOfMoney: calculatorData?.useOfMoney || 'consolidation',
    requestedAmount: calculatorData?.requestedAmount || 0,
    termYears: calculatorData?.termYears || 1,
    interestRate: calculatorData?.interestRate || 18,
    monthlyPayment: calculatorData?.results?.monthlyPayment || 0,
    totalPayment: calculatorData?.results?.totalPayment || 0,
    totalInterest: calculatorData?.results?.totalInterest || 0
  });

  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.identificationNumber.trim()) newErrors.identificationNumber = 'ID number is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (formData.monthlySalary <= 0) newErrors.monthlySalary = 'Monthly salary must be greater than 0';
    if (formData.yearsOfEmployment < 0) newErrors.yearsOfEmployment = 'Years of employment cannot be negative';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleCancel = async () => {
    const result = await Swal.fire({
      title: 'Cancel application?',
      text: 'All entered data will be lost',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, cancel',
      cancelButtonText: 'Continue filling'
    });
    if (result.isConfirmed) onClose();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const result = await creditRequestService.createCreditRequest(formData);
    setIsSubmitting(false);

    if (result.success) {
      await Swal.fire({
        icon: 'success',
        title: 'Application Submitted!',
        html: `
          <p>Your credit application has been submitted successfully.</p>
          <p><strong>Application ID:</strong> ${result.data.id}</p>
          <p>You will receive a response at: <strong>${result.data.email}</strong></p>
        `,
        confirmButtonText: 'Got it',
        confirmButtonColor: '#dc2626'
      });
      onClose();
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: result.error,
        confirmButtonText: 'Close',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const steps = ['Personal Info', 'Financial Info', 'Review'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-primary-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Credit Application</h2>
            <button onClick={onClose} className="text-white hover:text-gray-200 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex justify-between mt-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${currentStep >= step ? 'bg-white text-primary-600' : 'bg-primary-500 text-white'}`}>
                  {step}
                </div>
                <div className="ml-2 text-sm">{steps[step - 1]}</div>
                {step < 3 && (
                  <div className={`w-20 h-1 mx-4 ${currentStep > step ? 'bg-white' : 'bg-primary-500'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold mb-4">Personal Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text" name="fullName" value={formData.fullName} onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="John Doe"
                />
                {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Number *</label>
                <input
                  type="text" name="identificationNumber" value={formData.identificationNumber} onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.identificationNumber ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="National ID / Passport"
                />
                {errors.identificationNumber && <p className="text-red-500 text-sm mt-1">{errors.identificationNumber}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email" name="email" value={formData.email} onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="you@example.com"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="+1 555 0100"
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Address *</label>
                <textarea
                  name="address" value={formData.address} onChange={handleInputChange} rows={3}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Street, Number, City, State, ZIP"
                />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold mb-4">Financial Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status *</label>
                <select
                  name="employmentStatus" value={formData.employmentStatus} onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="Employed">Employed</option>
                  <option value="Self-Employed">Self-Employed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Net Salary *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number" name="monthlySalary" value={formData.monthlySalary} onChange={handleInputChange}
                    min="0" step="100"
                    className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.monthlySalary ? 'border-red-500' : 'border-gray-300'}`}
                  />
                </div>
                {errors.monthlySalary && <p className="text-red-500 text-sm mt-1">{errors.monthlySalary}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years of Employment *</label>
                <input
                  type="number" name="yearsOfEmployment" value={formData.yearsOfEmployment} onChange={handleInputChange}
                  min="0" step="0.5"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.yearsOfEmployment ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.yearsOfEmployment && <p className="text-red-500 text-sm mt-1">{errors.yearsOfEmployment}</p>}
                <p className="text-sm text-gray-500 mt-1">
                  Enter how long you have been in your current job or working independently
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-4">Review & Confirm</h3>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Personal Information</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-600">Name:</span><p className="font-medium">{formData.fullName}</p></div>
                    <div><span className="text-gray-600">ID:</span><p className="font-medium">{formData.identificationNumber}</p></div>
                    <div><span className="text-gray-600">Email:</span><p className="font-medium">{formData.email}</p></div>
                    <div><span className="text-gray-600">Phone:</span><p className="font-medium">{formData.phone}</p></div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Financial Information</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-600">Employment:</span><p className="font-medium">{formData.employmentStatus}</p></div>
                    <div><span className="text-gray-600">Monthly Salary:</span><p className="font-medium">{formatCurrency(formData.monthlySalary)}</p></div>
                    <div>
                      <span className="text-gray-600">Years of Employment:</span>
                      <p className="font-medium">{formData.yearsOfEmployment} yr{formData.yearsOfEmployment !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Credit Details</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-600">Amount Requested:</span><p className="font-medium text-primary-600">{formatCurrency(formData.requestedAmount)}</p></div>
                    <div>
                      <span className="text-gray-600">Term:</span>
                      <p className="font-medium">{formData.termYears} yr{formData.termYears !== 1 ? 's' : ''} ({formData.termYears * 12} months)</p>
                    </div>
                    <div><span className="text-gray-600">Interest Rate:</span><p className="font-medium">{formData.interestRate.toFixed(2)}% annual</p></div>
                    <div className="col-span-2 bg-primary-50 p-3 rounded-lg">
                      <span className="text-gray-700 font-semibold">Monthly Payment:</span>
                      <p className="text-2xl font-bold text-primary-600">{formatCurrency(formData.monthlyPayment)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <p className="text-sm text-blue-700">
                  By confirming, you agree that the information provided is accurate.
                  You will receive a response within 48 business hours.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-6 flex justify-between">
          <button
            onClick={currentStep === 1 ? handleCancel : handlePrevious}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          {currentStep < 3 ? (
            <button onClick={handleNext} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit} disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Confirm & Submit</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

CreditRequestWizard.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  calculatorData: PropTypes.shape({
    creditType: PropTypes.string,
    useOfMoney: PropTypes.string,
    monthlyIncome: PropTypes.number,
    requestedAmount: PropTypes.number,
    termYears: PropTypes.number,
    interestRate: PropTypes.number,
    results: PropTypes.shape({
      monthlyPayment: PropTypes.number,
      totalPayment: PropTypes.number,
      totalInterest: PropTypes.number
    })
  }).isRequired
};

export default CreditRequestWizard;
