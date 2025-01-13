import { useState, useEffect, useRef } from 'react';

const FileUpload = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFileData, setSelectedFileData] = useState(null);
  const [isDeliveryTimeActive, setIsDeliveryTimeActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      fetchFiles();
      fetchDeliveryStatus();
    }
  }, []);

  const getAuthHeaders = () => {
    if (typeof window === 'undefined') return null;

    const token = localStorage.getItem('shopifyToken');
    const shop = localStorage.getItem('shopDomain');

    if (!token || !shop) {
      handleAuthError();
      return null;
    }

    return {
      'Authorization': `Bearer ${token}`,
      'X-Shop-Domain': shop,
      'Content-Type': 'application/json'
    };
  };

  const handleAuthError = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('shopifyToken');
      localStorage.removeItem('shopDomain');
      window.location.href = '/auth';
    }
  };

  const fetchDeliveryStatus = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`${API_URL}/api/delivery-times/status`, {
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError();
          return;
        }
        throw new Error('Failed to fetch delivery status');
      }

      const data = await response.json();
      setIsDeliveryTimeActive(data.isActive);
    } catch (error) {
      console.error('Failed to fetch delivery status:', error);
      setError('Failed to fetch delivery status');
    }
  };

  const fetchFiles = async () => {
    try {
      setError(null);
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`${API_URL}/api/files`, {
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError();
          return;
        }
        throw new Error('Failed to fetch files');
      }

      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Failed to fetch files: ' + error.message);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      if (!file.name.match(/\.(xlsx|xls)$/)) {
        throw new Error('Please upload only Excel files (.xlsx or .xls)');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      const formData = new FormData();
      formData.append('file', file);

      const headers = getAuthHeaders();
      if (!headers) return;

      // Remove Content-Type for FormData
      delete headers['Content-Type'];

      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError();
          return;
        }
        throw new Error('Upload failed');
      }

      const data = await response.json();

      // Reset form
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSelectedFile(null);
      await fetchFiles();
    } catch (error) {
      console.error('Upload error:', error);
      setError('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleViewData = async (fileId) => {
    try {
      setError(null);
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`${API_URL}/api/files/${fileId}`, {
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError();
          return;
        }
        throw new Error('Failed to fetch file data');
      }

      const data = await response.json();
      setSelectedFileData(data);
    } catch (error) {
      console.error('View error:', error);
      setError('Failed to view file: ' + error.message);
    }
  };

  const handleDelete = async (fileId) => {
    try {
      if (!window.confirm('Are you sure you want to delete this file?')) {
        return;
      }

      setError(null);
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`${API_URL}/api/files/${fileId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError();
          return;
        }
        throw new Error('Delete failed');
      }

      if (selectedFileData?.id === fileId) {
        setSelectedFileData(null);
      }

      await fetchFiles();
    } catch (error) {
      console.error('Delete error:', error);
      setError('Failed to delete file: ' + error.message);
    }
  };

  const toggleDeliveryTime = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`${API_URL}/api/delivery-times/toggle`, {
        method: 'POST',
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError();
          return;
        }
        throw new Error('Failed to toggle delivery time');
      }

      const data = await response.json();
      setIsDeliveryTimeActive(data.isActive);
    } catch (error) {
      console.error('Failed to toggle delivery time:', error);
      setError('Failed to toggle delivery time display');
    }
  };

  // Don't render anything during SSR
  if (!mounted) return null;

  // If no auth, show login prompt
  if (!localStorage.getItem('shopifyToken') || !localStorage.getItem('shopDomain')) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Please authenticate</h2>
          <p className="text-gray-600">
            You need to authenticate with Shopify to access this feature.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Excel File Upload</h2>
        <div className="flex items-center space-x-4">
          <span className={`text-sm font-medium ${
            isDeliveryTimeActive ? 'text-green-600' : 'text-gray-500'
          }`}>
            Delivery Time Display: {isDeliveryTimeActive ? 'Active' : 'Inactive'}
          </span>
          <button
            onClick={toggleDeliveryTime}
            className={`px-4 py-2 rounded-lg text-white transition-colors ${
              isDeliveryTimeActive 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
            disabled={uploading}
          >
            {isDeliveryTimeActive ? 'Disable' : 'Enable'} Delivery Time
          </button>
        </div>
      </div>

      {/* Upload Section */}
      <div className="mb-8">
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Upload Excel files (Maximum size: 5MB)
                {files.length > 0 && <span className="ml-2">• {files.length} file(s) uploaded</span>}
              </p>
              
              <div className="flex items-center space-x-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-600 file:text-white
                    hover:file:bg-blue-700
                    cursor-pointer"
                  disabled={uploading}
                />
              </div>
            </div>

            {uploading && (
              <div className="flex items-center bg-blue-50 text-blue-700 p-4 rounded-lg">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span>Uploading file...</span>
              </div>
            )}

            {error && (
              <div className="flex items-center bg-red-50 text-red-700 p-4 rounded-lg">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Files List */}
        <div className="lg:col-span-1">
          <h3 className="text-xl font-semibold mb-4">Uploaded Files</h3>
          <div className="space-y-3">
            {files.map((file) => (
              <div 
                key={file.id} 
                className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{file.fileName}</p>
                    <p className="text-sm text-gray-500">
                      Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Rows: {file.rowCount || 'N/A'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewData(file.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium 
                               px-3 py-1 rounded-md hover:bg-blue-50 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium 
                               px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {files.length === 0 && (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                No files uploaded yet
              </div>
            )}
          </div>
        </div>

        {/* Data Preview */}
        <div className="lg:col-span-1">
          <h3 className="text-xl font-semibold mb-4">Data Preview</h3>
          {selectedFileData ? (
            <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    {selectedFileData.headers.map((header) => (
                      <th
                        key={header}
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedFileData.data.slice(0, 5).map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {selectedFileData.headers.map((header) => (
                        <td
                          key={header}
                          className="px-3 py-2 whitespace-nowrap text-sm text-gray-500"
                        >
                          {row[header]}
                        </td>
                      ))}
                      </tr>
                  ))}
                </tbody>
              </table>
              {selectedFileData.data.length > 5 && (
                <div className="text-sm text-gray-500 p-3 bg-gray-50 border-t">
                  Showing first 5 rows of {selectedFileData.data.length} total rows
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
              Select a file to view its data
            </div>
          )}
        </div>
      </div>

      {/* Success Message */}
      {!error && selectedFile && !uploading && (
        <div className="mt-4 flex items-center bg-green-50 text-green-700 p-4 rounded-lg">
          <svg 
            className="w-5 h-5 mr-3" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
          <span>File uploaded successfully!</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;