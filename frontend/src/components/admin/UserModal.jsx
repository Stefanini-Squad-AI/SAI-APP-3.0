import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const UserModal = ({ isOpen, onClose, onSave, user, mode }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'User',
    isActive: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user && mode === 'edit') {
      setFormData({
        email: user.email || '',
        password: '', // Never populate password on edit
        fullName: user.fullName || '',
        role: user.role || 'User',
        isActive: user.isActive === undefined ? true : user.isActive,
      });
    } else {
      setFormData({ email: '', password: '', fullName: '', role: 'User', isActive: true });
    }
    setErrors({});
  }, [user, mode, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (mode === 'create') {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email';
      }

      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            {mode === 'create' ? 'Create User' : 'Edit User'}
          </h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900 text-2xl font-bold">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {mode === 'create' && (
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email *</label>
              <input
                type="email" id="email" name="email" value={formData.email} onChange={handleChange}
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.email ? 'border-red-500' : ''}`}
                placeholder="user@example.com"
              />
              {errors.email && <p className="text-red-500 text-xs italic mt-1">{errors.email}</p>}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="fullName" className="block text-gray-700 text-sm font-bold mb-2">Full Name *</label>
            <input
              type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.fullName ? 'border-red-500' : ''}`}
              placeholder="John Doe"
            />
            {errors.fullName && <p className="text-red-500 text-xs italic mt-1">{errors.fullName}</p>}
          </div>

          {mode === 'create' && (
            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Password *</label>
              <input
                type="password" id="password" name="password" value={formData.password} onChange={handleChange}
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.password ? 'border-red-500' : ''}`}
                placeholder="••••••••"
              />
              {errors.password && <p className="text-red-500 text-xs italic mt-1">{errors.password}</p>}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="role" className="block text-gray-700 text-sm font-bold mb-2">Role *</label>
            <select
              id="role" name="role" value={formData.role} onChange={handleChange}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="User">User</option>
              <option value="Analista">Analyst</option>
              <option value="Admin">Administrator</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange}
                className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-gray-700 text-sm font-bold">Active User</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold rounded focus:outline-none focus:shadow-outline">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded focus:outline-none focus:shadow-outline">
              {mode === 'create' ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

UserModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  user: PropTypes.object,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
};

export default UserModal;
