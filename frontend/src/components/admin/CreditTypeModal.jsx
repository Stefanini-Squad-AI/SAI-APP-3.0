import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';

const CreditTypeModal = ({ isOpen, onClose, onSave, creditType }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    baseInterestRate: 0,
    maxAmount: 0,
    maxTermMonths: 12,
    minTermMonths: 1,
    isActive: true,
  });

  useEffect(() => {
    if (creditType) {
      setFormData({
        name: creditType.name || '',
        description: creditType.description || '',
        baseInterestRate: creditType.baseInterestRate || 0,
        maxAmount: creditType.maxAmount || 0,
        maxTermMonths: creditType.maxTermMonths || 12,
        minTermMonths: creditType.minTermMonths || 1,
        isActive: creditType.isActive ?? true,
      });
    } else {
      setFormData({ name: '', description: '', baseInterestRate: 0, maxAmount: 0, maxTermMonths: 12, minTermMonths: 1, isActive: true });
    }
  }, [creditType, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: (() => {
        if (type === 'checkbox') return checked;
        if (type === 'number') return Number.parseFloat(value) || 0;
        return value;
      })(),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {creditType ? 'Edit Credit Type' : 'New Credit Type'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text" id="name" name="name" value={formData.name} onChange={handleChange} required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              id="description" name="description" value={formData.description} onChange={handleChange} rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="baseInterestRate" className="block text-sm font-medium text-gray-700 mb-1">Base Interest Rate (%) *</label>
              <input
                type="number" id="baseInterestRate" name="baseInterestRate" value={formData.baseInterestRate}
                onChange={handleChange} step="0.01" min="0" required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label htmlFor="maxAmount" className="block text-sm font-medium text-gray-700 mb-1">Maximum Amount ($) *</label>
              <input
                type="number" id="maxAmount" name="maxAmount" value={formData.maxAmount}
                onChange={handleChange} step="1000" min="0" required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="minTermMonths" className="block text-sm font-medium text-gray-700 mb-1">Minimum Term (months) *</label>
              <input
                type="number" id="minTermMonths" name="minTermMonths" value={formData.minTermMonths}
                onChange={handleChange} min="1" required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label htmlFor="maxTermMonths" className="block text-sm font-medium text-gray-700 mb-1">Maximum Term (months) *</label>
              <input
                type="number" id="maxTermMonths" name="maxTermMonths" value={formData.maxTermMonths}
                onChange={handleChange} min="1" required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Active</label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition">
              {creditType ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

CreditTypeModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  creditType: PropTypes.object,
};

export default CreditTypeModal;
