import { User, Link, Tag, ChatMessage } from '../types';

// Get API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function for handling API errors
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'An error occurred');
  }
  return response.json();
};

// Auth API calls
export const login = async (email: string, password: string): Promise<{ user: User; token: string }> => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(response);
};

export const register = async (email: string, password: string, name?: string): Promise<{ user: User; token: string }> => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, name }),
  });
  return handleResponse(response);
};

// Link API calls
export const getLinks = async (token: string): Promise<Link[]> => {
  const response = await fetch(`${API_URL}/links`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await handleResponse(response);
  
  // The backend returns { links: [...] } but we want to return just the array
  return data.links.map((link: any) => ({
    id: link.id,
    url: link.url,
    title: link.title || 'Untitled',
    description: link.summary || '',
    image: link.image,
    domain: link.domain,
    embedding: link.embedding,
    tags: link.tags.map((tag: string) => ({ id: '', name: tag })),
    userId: '', // This field isn't returned by the backend
    createdAt: link.createdAt,
    updatedAt: link.updatedAt || link.createdAt
  }));
};

export const createLink = async (token: string, url: string): Promise<Link> => {
  const response = await fetch(`${API_URL}/links`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ url }),
  });
  const data = await handleResponse(response);
  
  // The backend returns { message: '...', link: {...} }
  const link = data.link;
  return {
    id: link.id,
    url: link.url,
    title: link.title || 'Untitled',
    description: link.summary || '',
    image: link.image,
    domain: link.domain,
    embedding: link.embedding,
    tags: link.tags.map((tag: string) => ({ id: '', name: tag })),
    userId: '', // This field isn't returned by the backend
    createdAt: link.createdAt,
    updatedAt: link.updatedAt || link.createdAt
  };
};

export const getLink = async (token: string, id: string): Promise<Link> => {
  const response = await fetch(`${API_URL}/links/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await handleResponse(response);
  
  // The backend returns { link: {...} }
  const link = data.link;
  return {
    id: link.id,
    url: link.url,
    title: link.title || 'Untitled',
    description: link.summary || '',
    image: link.image,
    domain: link.domain,
    embedding: link.embedding,
    tags: link.tags.map((tag: string) => ({ id: '', name: tag })),
    userId: '', // This field isn't returned by the backend
    createdAt: link.createdAt,
    updatedAt: link.updatedAt || link.createdAt
  };
};

export const deleteLink = async (token: string, id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/links/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(response);
};

// Chat API calls
export const sendChatMessage = async (token: string, query: string): Promise<{
  message: ChatMessage;
  similarLinks: Array<{
    id: string;
    url: string;
    title: string | null;
    domain: string | null;
    summary: string | null;
    similarity: number;
    relevanceScore?: number;
  }>;
}> => {
  const response = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query }),
  });
  const data = await handleResponse(response);
  
  return {
    message: {
      content: data.response,
      role: 'assistant'
    },
    similarLinks: data.similarLinks || []
  };
};

// Link preview
export const getLinkPreview = async (token: string, url: string): Promise<any> => {
  const response = await fetch(`${API_URL}/links/preview?url=${encodeURIComponent(url)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(response);
}; 