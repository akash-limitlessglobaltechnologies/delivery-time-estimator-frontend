import { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import Navbar from './components/Navbar';
import DeliveryTimeManager from './components/DeliveryTimeManager';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentStore, setCurrentStore] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const shop = params.get('shop');
    
    if (token && shop) {
      localStorage.setItem('shopifyToken', token);
      localStorage.setItem('shopDomain', shop);
      setCurrentStore(shop);
      setIsAuthenticated(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const existingToken = localStorage.getItem('shopifyToken');
      const existingShop = localStorage.getItem('shopDomain');
      if (existingToken && existingShop) {
        setCurrentStore(existingShop);
        setIsAuthenticated(true);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isAuthenticated ? (
          <FileUpload />
        
        ) : (
          <div className="text-center p-8 bg-white rounded-lg shadow mt-8">
            <h2 className="text-xl font-bold mb-4">Please authenticate first</h2>
            <p className="text-gray-600">
              You need to authenticate with Shopify to access this feature.
            </p>
          </div>
        )}
        
      </div>
    </div>
  );
}

export default App;