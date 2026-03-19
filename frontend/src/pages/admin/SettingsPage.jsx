import { useState } from 'react';
import { Database, Download, Clock, HardDrive } from 'lucide-react';
import backupService from '../../services/backupService';
import Swal from 'sweetalert2';

const SettingsPage = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateBackup = async () => {
    const result = await Swal.fire({
      title: 'Generate Backup?',
      text: 'A full backup of the database will be created and downloaded',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3B82F6',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, generate backup',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      setIsGenerating(true);

      Swal.fire({
        title: 'Generating Backup...',
        html: 'Please wait while the backup file is being generated.<br/><br/>This may take a moment.',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => { Swal.showLoading(); }
      });

      try {
        const response = await backupService.generateBackup();
        setIsGenerating(false);

        if (response.success) {
          Swal.fire({
            title: 'Backup Generated!',
            text: 'The backup file has been downloaded successfully',
            icon: 'success',
            timer: 3000,
            showConfirmButton: true,
          });
        } else {
          Swal.fire({ title: 'Error', text: response.error || 'Failed to generate backup', icon: 'error' });
        }
      } catch {
        setIsGenerating(false);
        Swal.fire({ title: 'Error', text: 'Unexpected error generating backup', icon: 'error' });
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">System Settings</h1>
        <p className="text-gray-600">Manage system configuration and tools</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <Database size={24} className="text-blue-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-800">Database Backup</h2>
        </div>

        <p className="text-gray-600 mb-6">
          Generate a full backup of the MongoDB database. The file will be downloaded
          automatically as a ZIP archive containing all system data.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <HardDrive size={20} className="text-blue-600 mr-2" />
              <h3 className="font-semibold text-gray-800">Format</h3>
            </div>
            <p className="text-sm text-gray-600">Compressed ZIP file</p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Database size={20} className="text-green-600 mr-2" />
              <h3 className="font-semibold text-gray-800">Contents</h3>
            </div>
            <p className="text-sm text-gray-600">All collections</p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Clock size={20} className="text-purple-600 mr-2" />
              <h3 className="font-semibold text-gray-800">Retention</h3>
            </div>
            <p className="text-sm text-gray-600">7-day automatic</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <button
            onClick={handleGenerateBackup}
            disabled={isGenerating}
            className={`flex items-center justify-center px-6 py-3 rounded-md text-white font-medium transition ${
              isGenerating ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }`}
          >
            <Download size={20} className="mr-2" />
            {isGenerating ? 'Generating Backup...' : 'Generate Backup'}
          </button>

          <p className="text-xs text-gray-500 mt-2">
            The file will be downloaded automatically once generated
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">System Information</h2>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600 font-medium">Database</span>
            <span className="text-gray-900">MongoDB</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600 font-medium">Backend</span>
            <span className="text-gray-900">.NET 8</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600 font-medium">Frontend</span>
            <span className="text-gray-900">React + Vite</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600 font-medium">Version</span>
            <span className="text-gray-900">1.0.0</span>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-semibold text-amber-900 mb-2">📋 Backup Recommendations</h3>
        <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
          <li>Generate backups regularly (daily recommended)</li>
          <li>Store backups in a secure location external to the server</li>
          <li>Periodically verify that backups can be restored correctly</li>
          <li>Maintain multiple backup versions in different locations</li>
        </ul>
      </div>
    </div>
  );
};

export default SettingsPage;
