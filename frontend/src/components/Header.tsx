import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-black-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">SecondBrain</Link>
        
        <nav className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="hover:text-beige-100">Dashboard</Link>
              <Link to="/chat" className="hover:text-beige-100">Chat</Link>
              <div className="flex items-center ml-4">
                <span className="mr-2">{user?.name || user?.email}</span>
                <button 
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-beige-100">Login</Link>
              <Link to="/register" className="bg-black-600 hover:bg-opacity-80 text-white px-3 py-1 rounded border border-white">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header; 