import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import serviceService from '../../services/serviceService';
import ServiceModal from '../../components/admin/ServiceModal';
import Swal from 'sweetalert2';

const ServicesManagementPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await serviceService.getAll();
      setServices(data);
    } catch {
      Swal.fire('Error', 'Failed to load services', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedService(null);
    setIsModalOpen(true);
  };

  const handleEdit = (service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      if (selectedService) {
        await serviceService.update(selectedService.id, formData);
        Swal.fire('Updated', 'Service updated successfully', 'success');
      } else {
        await serviceService.create(formData);
        Swal.fire('Created', 'Service created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchServices();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.error || 'Failed to save service', 'error');
    }
  };

  const handleDelete = async (id, title) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Service "${title}" will be permanently deleted`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        await serviceService.delete(id);
        Swal.fire('Deleted', 'Service deleted successfully', 'success');
        fetchServices();
      } catch (error) {
        Swal.fire('Error', error.response?.data?.error || 'Failed to delete service', 'error');
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
        <h1 className="text-3xl font-bold text-gray-900">Services Management</h1>
        <button
          onClick={handleCreate}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
        >
          <Plus size={20} className="mr-2" />
          New Service
        </button>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No services registered</p>
          <button onClick={handleCreate} className="mt-4 text-primary-600 hover:text-primary-700 font-medium">
            Create the first service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div key={service.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-4xl mr-3">{service.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{service.title}</h3>
                    <span className="text-xs text-gray-500">Order: {service.displayOrder}</span>
                  </div>
                </div>
                <div>
                  {service.isActive ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle size={12} className="mr-1" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <XCircle size={12} className="mr-1" />
                      Inactive
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">{service.description}</p>

              <div className="flex justify-end space-x-2">
                <button onClick={() => handleEdit(service)} className="p-2 text-primary-600 hover:bg-primary-50 rounded transition" title="Edit">
                  <Edit size={18} />
                </button>
                <button onClick={() => handleDelete(service.id, service.title)} className="p-2 text-red-600 hover:bg-red-50 rounded transition" title="Delete">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        service={selectedService}
      />
    </div>
  );
};

export default ServicesManagementPage;
