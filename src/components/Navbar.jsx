import React from 'react';

const Navbar = () => {
  const shopDomain = localStorage.getItem('shopDomain');

  return (
    <nav className="bg-gray-800 text-white py-4 px-6 mb-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <span className="text-xl font-bold">Excel Manager</span>
          {shopDomain && (
            <span className="bg-blue-600 px-3 py-1 rounded-full text-sm">
              Store: {shopDomain}
            </span>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;