import { X } from 'lucide-react';
import PropTypes from 'prop-types';

const CreditRequestDetailModal = ({ isOpen, onClose, creditRequest }) => {
  if (!isOpen || !creditRequest) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Approved: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8">
        <div className="sticky top-0 bg-white border-b flex items-center justify-between p-6 z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Request Detail</h2>
            <p className="text-sm text-gray-500 mt-1">ID: {creditRequest.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(creditRequest.status)}`}>
                  {creditRequest.status}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-500">Request Date</p>
                <p className="text-sm text-gray-900 mt-1">{formatDate(creditRequest.requestDate)}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Full Name</p>
                <p className="text-sm text-gray-900 mt-1">{creditRequest.fullName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">ID Number</p>
                <p className="text-sm text-gray-900 mt-1">{creditRequest.identificationNumber ?? 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-sm text-gray-900 mt-1">{creditRequest.email ?? 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="text-sm text-gray-900 mt-1">{creditRequest.phone ?? 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p className="text-sm text-gray-900 mt-1">{creditRequest.address ?? 'N/A'}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Employment Status</p>
                <p className="text-sm text-gray-900 mt-1">{creditRequest.employmentStatus ?? 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Monthly Salary</p>
                <p className="text-sm text-gray-900 mt-1">{creditRequest.monthlySalary != null ? formatCurrency(creditRequest.monthlySalary) : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Years of Employment</p>
                <p className="text-sm text-gray-900 mt-1">
                  {creditRequest.yearsOfEmployment != null
                    ? `${creditRequest.yearsOfEmployment} yr${creditRequest.yearsOfEmployment === 1 ? '' : 's'}`
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Requested Credit Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Credit Type</p>
                <p className="text-sm text-gray-900 mt-1">{creditRequest.creditType ?? 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Purpose</p>
                <p className="text-sm text-gray-900 mt-1">{creditRequest.useOfMoney ?? 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Requested Amount</p>
                <p className="text-lg font-bold text-primary-600 mt-1">{creditRequest.requestedAmount != null ? formatCurrency(creditRequest.requestedAmount) : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Term</p>
                <p className="text-sm text-gray-900 mt-1">
                  {creditRequest.termYears != null
                    ? `${creditRequest.termYears} yr${creditRequest.termYears === 1 ? '' : 's'} (${creditRequest.termYears * 12} months)`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Interest Rate</p>
                <p className="text-sm text-gray-900 mt-1">{creditRequest.interestRate != null ? `${creditRequest.interestRate}%` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Monthly Payment</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(creditRequest.monthlyPayment)}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Simulation Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Payment</p>
                <p className="text-lg font-bold text-gray-900">{creditRequest.totalPayment != null ? formatCurrency(creditRequest.totalPayment) : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Interest</p>
                <p className="text-lg font-bold text-orange-600">{creditRequest.totalInterest != null ? formatCurrency(creditRequest.totalInterest) : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Payment</p>
                <p className="text-lg font-bold text-primary-600">{formatCurrency(creditRequest.monthlyPayment)}</p>
              </div>
            </div>
          </div>

          {(creditRequest.status === 'Approved' || creditRequest.status === 'Rejected') && (
            <div className={`p-4 rounded-lg ${creditRequest.status === 'Approved' ? 'bg-green-50' : 'bg-red-50'}`}>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {creditRequest.status === 'Approved' ? 'Approval Information' : 'Rejection Information'}
              </h3>
              <div className="space-y-2">
                {creditRequest.status === 'Approved' && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Approval Date</p>
                      <p className="text-sm text-gray-900">{formatDate(creditRequest.approvedDate)}</p>
                    </div>
                    {creditRequest.approvedAmount && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Approved Amount</p>
                        <p className="text-sm text-gray-900">{formatCurrency(creditRequest.approvedAmount)}</p>
                      </div>
                    )}
                    {creditRequest.approvedTermMonths && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Approved Term</p>
                        <p className="text-sm text-gray-900">{creditRequest.approvedTermMonths} months</p>
                      </div>
                    )}
                  </>
                )}
                {creditRequest.status === 'Rejected' && creditRequest.rejectedDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rejection Date</p>
                    <p className="text-sm text-gray-900">{formatDate(creditRequest.rejectedDate)}</p>
                  </div>
                )}
                {creditRequest.remarks && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Remarks</p>
                    <p className="text-sm text-gray-900">{creditRequest.remarks}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t p-6">
          <button onClick={onClose} className="w-full py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

CreditRequestDetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  creditRequest: PropTypes.object,
};

export default CreditRequestDetailModal;
