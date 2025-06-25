import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const NotFound = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-beige-200">
      <h1 className="text-6xl font-bold text-black-600 mb-4">404</h1>
      <p className="text-2xl text-black-600 mb-8">Page not found</p>
      <Link 
        to={isAuthenticated ? "/dashboard" : "/login"} 
        className="px-6 py-3 bg-black-600 text-white rounded-lg hover:bg-opacity-80 transition-colors"
      >
        {isAuthenticated ? "Go to Dashboard" : "Go to Login"}
      </Link>
    </div>
  );
};

export default NotFound; 