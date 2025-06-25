import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainIcon } from '../icons/BrainIcon';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';
import { ChatMessage } from '../types';

interface SimilarLink {
  id: string;
  url: string;
  title: string | null;
  domain: string | null;
  summary: string | null;
  similarity: number;
  relevanceScore?: number; // Added for formatted percentage display
}

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hi! I can help you find information from your saved links. Ask me anything!'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [similarLinks, setSimilarLinks] = useState<SimilarLink[]>([]);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      // Send the message to the API
      const { message, similarLinks: links } = await api.sendChatMessage(token, userMessage.content);
      
      // Add the response to the messages
      setMessages(prev => [...prev, message]);
      
      // Set similar links
      setSimilarLinks(links);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      
      // Add an error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-beige-200">
      {/* Header */}
      <header className="bg-black-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10">
              <BrainIcon />
            </div>
            <h1 className="text-xl font-bold">Second Brain Chat</h1>
          </div>
          <div className="flex gap-4 items-center">
            <Button
              variant="secondary"
              text="Back to Dashboard"
              onClick={() => navigate('/dashboard')}
            />
            <Button
              variant="secondary"
              text="Logout"
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-6">
        {/* Chat area */}
        <div className="flex-grow md:w-2/3">
          <div className="bg-white rounded-lg shadow-md p-4 h-[70vh] flex flex-col">
            {/* Messages area */}
            <div className="flex-grow overflow-y-auto mb-4 p-2">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
                >
                  <div 
                    className={`inline-block p-3 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-blue-500 text-white rounded-br-none' 
                        : 'bg-gray-200 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="text-left mb-4">
                  <div className="inline-block p-3 rounded-lg bg-gray-200 text-gray-800 rounded-bl-none">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input area */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask a question about your saved links..."
                className="flex-grow p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="bg-black-600 hover:bg-opacity-80 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                disabled={isLoading || !inputValue.trim()}
              >
                Send
              </button>
            </form>
            
            {error && (
              <div className="mt-2 text-red-500 text-sm">{error}</div>
            )}
          </div>
        </div>
        
        {/* Similar links area */}
        <div className="md:w-1/3">
          <div className="bg-white rounded-lg shadow-md p-4 h-[70vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Related Links</h2>
            {similarLinks.length === 0 ? (
              <p className="text-gray-500">
                {isLoading 
                  ? 'Finding related links...' 
                  : messages.length <= 1 
                    ? 'Ask a question to see related links' 
                    : 'No related links found'}
              </p>
            ) : (
              <ul className="space-y-3">
                {similarLinks.map((link) => (
                  <li key={link.id} className="border rounded-lg p-3 hover:bg-gray-50">
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="block"
                    >
                      <h3 className="font-medium text-blue-600 hover:underline">
                        {link.title || 'Untitled'}
                      </h3>
                      <div className="text-sm text-gray-500 flex justify-between mb-1">
                        <span>{link.domain || 'unknown domain'}</span>
                        <span className="font-semibold text-green-600">
                          Relevance: {link.relevanceScore || Math.round(link.similarity * 100)}%
                        </span>
                      </div>
                      {link.summary && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {link.summary}
                        </p>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 