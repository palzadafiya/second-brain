import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';
import { Link } from '../types';
import { Button } from '../components/ui/Button';
import { BrainIcon } from '../icons/BrainIcon';

export function LinkDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [link, setLink] = useState<Link | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    async function fetchLinkDetails() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        if (!id) {
          setError('Link ID not provided');
          setLoading(false);
          return;
        }

        const linkData = await api.getLink(token, id);
        setLink(linkData);
      } catch (error) {
        console.error('Failed to fetch link details:', error);
        setError('Failed to load link details');
      } finally {
        setLoading(false);
      }
    }

    fetchLinkDetails();
  }, [id, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-beige-200">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (error || !link) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-beige-200">
        <p className="text-xl text-red-500 mb-4">{error || 'Link not found'}</p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-black-600 text-white px-4 py-2 rounded-md hover:bg-opacity-80"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Default placeholder image if no image is provided
  const placeholderImage = "https://placehold.co/800x400?text=No+Image";

  return (
    <div className="min-h-screen bg-beige-200">
      {/* Header */}
      <header className="bg-black-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 fill-slate-100">
              <BrainIcon />
            </div>
            <h1 className="text-xl font-bold">Second Brain</h1>
          </div>
          <Button
            variant="secondary"
            text="Logout"
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
          />
        </div>
      </header>

      {/* Back button below header */}
      <div className="container mx-auto px-4 mt-6">
        <Button
          variant="secondary"
          text="← Back to Dashboard"
          onClick={() => navigate('/dashboard')}
        />
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden mt-4">
        {/* Image header */}
        <div className="w-full h-64 relative">
          <img 
            src={link.image || placeholderImage} 
            alt={link.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = placeholderImage;
            }}
          />
          {link.domain && (
            <div className="absolute bottom-0 left-0 bg-black-600 bg-opacity-70 text-white px-4 py-2">
              {link.domain}
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-4 text-black-600">{link.title}</h1>
          
          <div className="mb-6">
            <a 
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              {link.url}
            </a>
          </div>
          
          {/* Tags */}
          {link.tags && link.tags.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {link.tags.map(tag => (
                  <span 
                    key={tag.id} 
                    className="bg-beige-100 text-black-600 px-3 py-1 rounded-full"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Summary/Description */}
          {link.description && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2 text-black-600">AI Summary</h2>
              <div className="bg-beige-100 p-4 rounded-md">
                <p className="text-gray-800 whitespace-pre-line">{link.description}</p>
              </div>
            </div>
          )}
          
          {/* Metadata */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Added on {new Date(link.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 