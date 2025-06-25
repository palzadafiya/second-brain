import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardCopy } from "lucide-react";
import { AddIcon } from "../icons/AddIcon";
import { BrainIcon } from "../icons/BrainIcon";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { CancelIcon } from "../icons/CancelIcon";
import { useAuth } from "../contexts/AuthContext";
import * as api from "../services/api";
import { Link as LinkType, Tag } from "../types";

// Local interface for dashboard content
interface DashboardLink {
  id: string;
  url: string;
  title: string;
  description: string;
  image?: string;
  domain?: string;
  tags: Tag[];
  userId: string;
}

export function Dashboard() {
  const [showForm, setShowForm] = useState(false);
  const [contentList, setContentList] = useState<LinkType[]>([]);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<any | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  async function fetchLinks() {
    try {
      setIsLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const links = await api.getLinks(token);
      setContentList(links);
    } catch (error) {
      console.error("Failed to fetch links:", error);
      setError("Failed to load links. Please try again.");
      // If unauthorized, redirect to login
      if ((error as any)?.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchLinks();
    }
  }, [isAuthenticated]);

  function toggleAddForm() {
    setShowForm(!showForm);
    setError("");
  }

  async function submitLink() {
    if (!urlInputRef.current || !urlInputRef.current.value) {
      setError("Please enter a valid URL");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      await api.createLink(token, urlInputRef.current.value);
      setShowForm(false);
      await fetchLinks();
    } catch (error) {
      console.error("Failed to add link:", error);
      setError("Failed to add link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteLink(id: string) {
    try {
      setIsLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      // Call the deleteLink API function
      await api.deleteLink(token, id);
      setContentList(contentList.filter(link => link.id !== id));
    } catch (error) {
      console.error("Failed to delete link:", error);
      setError("Failed to delete link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchPreview() {
    if (!urlInputRef.current || !urlInputRef.current.value) {
      setError('Please enter a valid URL');
      return;
    }
    try {
      setIsPreviewing(true);
      setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const data = await api.getLinkPreview(token, urlInputRef.current.value);
      setPreview(data.preview);
    } catch (error) {
      console.error('Failed to fetch preview:', error);
      setError('Failed to fetch preview. Please try again.');
    } finally {
      setIsPreviewing(false);
    }
  }

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
          <div className="flex gap-4 items-center">
            <Button 
              variant="secondary" 
              text="Add Link" 
              startIcon={<AddIcon />} 
              onClick={toggleAddForm}
            />

            <Button 
              variant="secondary" 
              text="Chat with Links" 
              onClick={() => navigate('/chat')}
            />
  
            <Button
              variant="secondary"
              text="Logout"
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-black-600">Your Saved Links</h2>
          <p className="text-gray-600">Access your saved links and their AI-generated summaries</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-6">
          {isLoading ? (
            <div className="w-full text-center py-10">
              <p className="text-xl">Loading your links...</p>
            </div>
          ) : contentList.length === 0 ? (
            <div className="w-full text-center py-10 bg-white rounded-lg shadow-md">
              <p className="text-xl mb-4">You haven't saved any links yet</p>
            </div>
          ) : (
            contentList.map((link) => (
              <Card 
                key={link.id} 
                id={link.id} 
                type={link.domain || "link"} 
                title={link.title} 
                link={link.url} 
                image={link.image}
                domain={link.domain}
                tags={link.tags}
                onDelete={deleteLink} 
              />
            ))
          )}
        </div>
      </main>

      {/* Add Link Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Add New Link</h2>
              <div className="cursor-pointer">
                <CancelIcon onClick={() => setShowForm(false)} />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">URL</label>
              <input 
                type="url" 
                ref={urlInputRef} 
                required 
                className="w-full border rounded px-3 py-2" 
                placeholder="https://example.com"
              />
              <p className="text-sm text-gray-500 mt-2">
                We'll automatically extract the title, image, and generate tags and a summary using AI.
              </p>
            </div>

            {preview && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Preview</h3>
                <Card
                  id={''}
                  type={preview.domain || 'link'}
                  title={preview.title || 'Untitled'}
                  link={preview.url}
                  image={preview.image}
                  domain={preview.domain}
                  tags={preview.tags.map((t:string)=>({id:'',name:t}))}
                  onDelete={()=>{}}
                />
              </div>
            )}

            <div className="flex justify-end">
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  text={isPreviewing ? 'Fetching...' : 'Fetch & Preview'}
                  disabled={isPreviewing}
                  onClick={fetchPreview}
                />
                <Button 
                  variant="primary" 
                  text="Add Link" 
                  startIcon={<AddIcon />} 
                  onClick={submitLink}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 