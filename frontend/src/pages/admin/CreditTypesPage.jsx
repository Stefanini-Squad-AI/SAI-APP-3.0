import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import creditTypeService from '../../services/creditTypeService';
import CreditTypeModal from '../../components/admin/CreditTypeModal';
import Swal from 'sweetalert2';

const CreditTypesPage = () => {
  const [creditTypes, setCreditTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCreditType, setSelectedCreditType] = useState(null);

  useEffect(() => {
    fetchCreditTypes();
  }, []);

  const fetchCreditTypes = async () => {
    try {
      setLoading(true);
      const data = await creditTypeService.getAll();
      setCreditTypes(data);
    } catch {
      Swal.fire('Error', 'Failed to load credit types', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedCreditType(null);
    setIsModalOpen(true);
  };

  const handleEdit = (creditType) => {
    setSelectedCreditType(creditType);
    setIsModalOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      if (selectedCreditType) {
        await creditTypeService.update(selectedCreditType.id, formData);
        Swal.fire('Updated', 'Credit type updated successfully', 'success');
      } else {
        await creditTypeService.create(formData);
        Swal.fire('Created', 'Credit type created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchCreditTypes();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.error || 'Failed to save credit type', 'error');
    }
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Credit type "${name}" will be permanently deleted`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        await creditTypeService.delete(id);
        Swal.fire('Deleted', 'Credit type deleted successfully', 'success');
        fetchCreditTypes();
      } catch (error) {
        Swal.fire('Error', error.response?.data?.error || 'Failed to delete credit type', 'error');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Credit Types</h1>
        <button
          onClick={handleCreate}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
        >
          <Plus size={20} className="mr-2" />
          New Credit Type
        </button>
      </div>

      {creditTypes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No credit types registered</p>
          <button
            onClick={handleCreate}
            className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
          >
            Create the first credit type
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Rate (%)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term (months)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {creditTypes.map((creditType) => (
                <tr key={creditType.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{creditType.name}</div>
                      <div className="text-sm text-gray-500">{creditType.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {creditType.baseInterestRate}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${creditType.maxAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {creditType.minTermMonths} - {creditType.maxTermMonths}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {creditType.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle size={14} className="mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle size={14} className="mr-1" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(creditType)} className="text-primary-600 hover:text-primary-900 mr-4">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(creditType.id, creditType.name)} className="text-red-600 hover:text-red-900">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreditTypeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        creditType={selectedCreditType}
      />
    </div>
  );
};

export default CreditTypesPage;
