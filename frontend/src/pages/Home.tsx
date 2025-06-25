import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BrainIcon } from '../icons/BrainIcon';

export function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-beige-200">
      <div className="w-24 mb-4">
        <BrainIcon />
      </div>
      <h1 className="text-4xl font-bold text-black-600 mb-4">Second Brain</h1>
      <p className="text-xl text-black-600">Loading...</p>
    </div>
  );
} 