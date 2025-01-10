import { useState, useEffect } from 'react';

const DeliveryTimeManager = () => {
  const [isActive, setIsActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('shopifyToken');
    const shop = localStorage.getItem('shopDomain');

    if (!token || !shop) {
      throw new Error('Authentication credentials missing');
    }

    return {
      'Authorization': `Bearer ${token}`,
      'X-Shop-Domain': shop
    };
  };

  const fetchStatus = async () => {
    try {
      const response = await fetch('http://localhost:5005/api/delivery-times/status', {
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }

      const data = await response.json();
      setIsActive(data.isActive);
    } catch (error) {
      console.error('Status fetch error:', error);
      setError('Failed to fetch status');
    }
  };

  const handleToggle = async () => {
    try {
      const response = await fetch('http://localhost:5005/api/delivery-times/toggle', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to toggle status');
      }

      const data = await response.json();
      setIsActive(data.isActive);
    } catch (error) {
      console.error('Toggle error:', error);
      setError('Failed to toggle status');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      setError('Please upload only Excel files (.xlsx or .xls)');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const headers = getAuthHeaders();
      delete headers['Content-Type'];

      const response = await fetch('http://localhost:5005/api/delivery-times/upload', {
        method: 'POST',
        headers: headers,
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      console.log('Upload successful:', data);
      event.target.value = '';

    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Delivery Time Settings</h2>
          <div className="flex items-center space-x-2">
            <span className={isActive ? 'text-green-600' : 'text-red-600'}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
            <button
              onClick={handleToggle}
              className={`px-4 py-2 rounded-lg text-white transition-colors ${
                isActive 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Upload Delivery Times</h3>
        <p className="text-gray-600 mb-4">
          Upload an Excel file with pincode and estimated delivery time.
          First column should be "pincode" and second column "estimatedTime".
        </p>
        
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            cursor-pointer"
          disabled={uploading}
        />

        {uploading && (
          <div className="mt-2 text-blue-600">
            Uploading delivery times...
          </div>
        )}

        {error && (
          <div className="mt-2 text-red-600">
            {error}
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Information</h3>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>Delivery time tile will appear on all product pages</li>
          <li>Times can be updated by uploading a new file</li>
          <li>Toggle the feature on/off using the button above</li>
          <li>Delivery times are based on customer's pincode</li>
        </ul>
      </div>
    </div>
  );
};

export default DeliveryTimeManager;