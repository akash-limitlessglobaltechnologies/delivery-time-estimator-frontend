import { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import Navbar from './components/Navbar';
import DeliveryTimeManager from './components/DeliveryTimeManager';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentStore, setCurrentStore] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const shop = params.get('shop');
    
    if (token && shop) {
      // Store token and shop domain in localStorage
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

    // Check token expiration
    const checkTokenExpiration = () => {
      const token = localStorage.getItem('shopifyToken');
      if (token) {
        try {
          // Get payload from JWT token
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.exp * 1000 < Date.now()) {
            // Token has expired
            handleLogout();
          }
        } catch (error) {
          console.error('Token validation error:', error);
          handleLogout();
        }
      }
    };

    // Check token expiration every minute
    const expirationTimer = setInterval(checkTokenExpiration, 60000);

    // Cleanup function
    return () => {
      clearInterval(expirationTimer);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('shopifyToken');
      if (token) {
        const response = await fetch('/api/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          localStorage.removeItem('shopifyToken');
          localStorage.removeItem('shopDomain');
          setIsAuthenticated(false);
          setCurrentStore(null);
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('shopifyToken');
      localStorage.removeItem('shopDomain');
      setIsAuthenticated(false);
      setCurrentStore(null);
    }
  };

  // Don't render anything during SSR
  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar onLogout={handleLogout} isAuthenticated={isAuthenticated} />
      
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