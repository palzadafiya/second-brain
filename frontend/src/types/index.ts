export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Link {
  id: string;
  url: string;
  title: string;
  description: string;
  image?: string;
  domain?: string;
  embedding?: number[] | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
  userId: string;
  tags: Tag[];
}

export interface Tag {
  id: string;
  name: string;
}

export interface ChatMessage {
  id?: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
} 