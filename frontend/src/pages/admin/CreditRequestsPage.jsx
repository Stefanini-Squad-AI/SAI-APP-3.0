import { useEffect, useState } from 'react';
import { Eye, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import creditRequestService from '../../services/creditRequestService';
import CreditRequestDetailModal from '../../components/admin/CreditRequestDetailModal';
import Swal from 'sweetalert2';

const CreditRequestsPage = () => {
  const [creditRequests, setCreditRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchCreditRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [statusFilter, creditRequests]);

  const fetchCreditRequests = async () => {
    try {
      setLoading(true);
      const result = await creditRequestService.getAllCreditRequests();
      if (result.success) {
        const sorted = result.data.sort((a, b) =>
          new Date(b.requestDate) - new Date(a.requestDate)
        );
        setCreditRequests(sorted);
      } else {
        Swal.fire('Error', result.error, 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to load credit requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    if (statusFilter === 'all') {
      setFilteredRequests(creditRequests);
    } else {
      setFilteredRequests(creditRequests.filter(req => req.status === statusFilter));
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setIsDetailModalOpen(true);
  };

  const handleApprove = async (request) => {
    const result = await Swal.fire({
      title: 'Approve Request?',
      text: `You are about to approve the request from ${request.fullName}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, approve',
      cancelButtonText: 'Cancel',
      input: 'textarea',
      inputLabel: 'Remarks (optional)',
      inputPlaceholder: 'Enter any remarks about this approval...',
    });

    if (result.isConfirmed) {
      try {
        const approvalData = {
          remarks: result.value || '',
          approvedAmount: request.requestedAmount,
          approvedTermMonths: request.termYears * 12,
        };
        const response = await creditRequestService.approveCreditRequest(request.id, approvalData);
        if (response.success) {
          Swal.fire({
            title: 'Approved!',
            text: 'The request has been approved successfully',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
          });
          fetchCreditRequests();
        } else {
          Swal.fire('Error', response.error, 'error');
        }
      } catch (error) {
        Swal.fire('Error', 'Failed to approve request', 'error');
      }
    }
  };

  const handleReject = async (request) => {
    const result = await Swal.fire({
      title: 'Reject Request?',
      text: `You are about to reject the request from ${request.fullName}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, reject',
      cancelButtonText: 'Cancel',
      input: 'textarea',
      inputLabel: 'Reason for rejection (optional)',
      inputPlaceholder: 'Enter the reason for rejection...',
    });

    if (result.isConfirmed) {
      try {
        const rejectionData = { remarks: result.value || '' };
        const response = await creditRequestService.rejectCreditRequest(request.id, rejectionData);
        if (response.success) {
          Swal.fire({
            title: 'Rejected',
            text: 'The request has been rejected',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
          });
          fetchCreditRequests();
        } else {
          Swal.fire('Error', response.error, 'error');
        }
      } catch (error) {
        Swal.fire('Error', 'Failed to reject request', 'error');
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      Pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending', icon: Clock },
      Approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved', icon: CheckCircle },
      Rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected', icon: XCircle },
    };
    return styles[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status, icon: Clock };
  };

  const getStatsCount = () => ({
    all: creditRequests.length,
    Pending: creditRequests.filter(r => r.status === 'Pending').length,
    Approved: creditRequests.filter(r => r.status === 'Approved').length,
    Rejected: creditRequests.filter(r => r.status === 'Rejected').length,
  });

  const stats = getStatsCount();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Credit Requests</h1>
        <p className="text-gray-600">Manage incoming credit applications</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.all}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow">
          <p className="text-sm text-yellow-700">Pending</p>
          <p className="text-2xl font-bold text-yellow-800">{stats.Pending}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow">
          <p className="text-sm text-green-700">Approved</p>
          <p className="text-2xl font-bold text-green-800">{stats.Approved}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow">
          <p className="text-sm text-red-700">Rejected</p>
          <p className="text-2xl font-bold text-red-800">{stats.Rejected}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center space-x-2">
          <Filter size={20} className="text-gray-500" />
          <span className="font-medium text-gray-700">Filter by status:</span>
          <div className="flex space-x-2">
            {[
              { value: 'all', label: 'All' },
              { value: 'Pending', label: 'Pending' },
              { value: 'Approved', label: 'Approved' },
              { value: 'Rejected', label: 'Rejected' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-4 py-2 rounded-md transition ${
                  statusFilter === filter.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">
            No requests {statusFilter !== 'all' ? `with status "${statusFilter}"` : ''}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount / Term</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => {
                  const statusInfo = getStatusBadge(request.status);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{request.fullName}</div>
                          <div className="text-sm text-gray-500">{request.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(request.requestedAmount)}</div>
                        <div className="text-sm text-gray-500">{request.termYears} yr{request.termYears !== 1 ? 's' : ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(request.monthlyPayment)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(request.requestDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                          <StatusIcon size={14} className="mr-1" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleViewDetails(request)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="View details"
                          >
                            <Eye size={18} />
                          </button>
                          {request.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(request)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded transition"
                                title="Approve"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() => handleReject(request)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                                title="Reject"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CreditRequestDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        creditRequest={selectedRequest}
      />
    </div>
  );
};

export default CreditRequestsPage;
