import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { XCircle, Eye, Trash2, RefreshCw } from 'lucide-react';
import contactMessageService from '../../services/contactMessageService';
import Swal from 'sweetalert2';

const MessagesPage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const data = await contactMessageService.getAll(filterStatus);
      setMessages(data);
    } catch (error) {
      console.error('Failed to fetch contact messages', error);
      Swal.fire('Error', 'Failed to load messages', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleViewMessage = (message) => {
    setSelectedMessage(message);
    setIsDetailModalOpen(true);
  };

  const handleUpdateStatus = async (messageId, newStatus, adminNotes = null) => {
    try {
      await contactMessageService.updateStatus(messageId, newStatus, adminNotes);
      Swal.fire('Updated', 'Message status updated successfully', 'success');
      fetchMessages();
      setIsDetailModalOpen(false);
    } catch (error) {
      console.error(`Failed to update message status ${messageId}`, error);
      Swal.fire('Error', error.response?.data?.error || 'Failed to update status', 'error');
    }
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `The message from "${name}" will be permanently deleted`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        await contactMessageService.delete(id);
        Swal.fire('Deleted', 'Message deleted successfully', 'success');
        fetchMessages();
      } catch (error) {
        console.error(`Failed to delete message ${id}`, error);
        Swal.fire('Error', error.response?.data?.error || 'Failed to delete message', 'error');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const colorClass = contactMessageService.getStatusColor(status);
    const text = contactMessageService.getStatusText(status);
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
        {text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contact Messages</h1>
          <p className="text-gray-600 mt-1">Manage incoming messages from customers</p>
        </div>
        <button
          onClick={fetchMessages}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-soft">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
          {[
            { value: null, label: 'All', activeColor: 'bg-primary-600' },
            { value: 0, label: 'New', activeColor: 'bg-blue-600' },
            { value: 1, label: 'In Progress', activeColor: 'bg-yellow-600' },
            { value: 2, label: 'Replied', activeColor: 'bg-green-600' },
            { value: 3, label: 'Closed', activeColor: 'bg-gray-600' },
          ].map(({ value, label, activeColor }) => (
            <button
              key={String(value)}
              onClick={() => setFilterStatus(value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filterStatus === value
                  ? `${activeColor} text-white`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {messages.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No messages to display
                  </td>
                </tr>
              ) : (
                messages.map((message) => (
                  <tr key={message.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{message.name}</div>
                      <div className="text-sm text-gray-500">{message.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{message.subject}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{message.message}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(message.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(message.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button onClick={() => handleViewMessage(message)} className="text-primary-600 hover:text-primary-900" title="View details">
                          <Eye className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(message.id, message.name)} className="text-red-600 hover:text-red-900" title="Delete">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isDetailModalOpen && selectedMessage && (
        <MessageDetailModal
          message={selectedMessage}
          onClose={() => setIsDetailModalOpen(false)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
};

const MessageDetailModal = ({ message, onClose, onUpdateStatus }) => {
  const [adminNotes, setAdminNotes] = useState(message.adminNotes || '');
  const [selectedStatus, setSelectedStatus] = useState(message.status);

  const nextStatusOptions = contactMessageService.getNextStatusOptions(message.status);

  const handleSubmit = () => {
    if (selectedStatus !== message.status) {
      onUpdateStatus(message.id, selectedStatus, adminNotes);
    } else {
      onClose();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Message Detail</h2>
              <p className="text-sm text-gray-500 mt-1">ID: {message.id}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{message.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{message.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Sent on</p>
                <p className="font-medium">{formatDate(message.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Current status</p>
                <p className="font-medium">{contactMessageService.getStatusText(message.status)}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Subject</h3>
            <p className="text-gray-700">{message.subject}</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Message</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{message.message}</p>
            </div>
          </div>

          {(message.respondedAt || message.closedAt) && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Follow-up</h3>
              <div className="space-y-2">
                {message.respondedAt && (
                  <div>
                    <p className="text-sm text-gray-600">Replied on:</p>
                    <p className="font-medium">{formatDate(message.respondedAt)}</p>
                    {message.respondedBy && <p className="text-sm text-gray-600">By: {message.respondedBy}</p>}
                  </div>
                )}
                {message.closedAt && (
                  <div>
                    <p className="text-sm text-gray-600">Closed on:</p>
                    <p className="font-medium">{formatDate(message.closedAt)}</p>
                    {message.closedBy && <p className="text-sm text-gray-600">By: {message.closedBy}</p>}
                  </div>
                )}
              </div>
            </div>
          )}

          {nextStatusOptions.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Update Status</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="newStatus" className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                  <select
                    id="newStatus"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(Number.parseInt(e.target.value, 10))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value={message.status}>
                      {contactMessageService.getStatusText(message.status)} (current)
                    </option>
                    {nextStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="adminNotes" className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                  <textarea
                    id="adminNotes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Add notes about the follow-up for this message..."
                  />
                </div>
              </div>
            </div>
          )}

          {message.adminNotes && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Previous Notes</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{message.adminNotes}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
            Cancel
          </button>
          {nextStatusOptions.length > 0 && (
            <button onClick={handleSubmit} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
              Update Status
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

MessageDetailModal.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    status: PropTypes.number.isRequired,
    adminNotes: PropTypes.string,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    subject: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    respondedAt: PropTypes.string,
    respondedBy: PropTypes.string,
    closedAt: PropTypes.string,
    closedBy: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdateStatus: PropTypes.func.isRequired,
};

export default MessagesPage;
