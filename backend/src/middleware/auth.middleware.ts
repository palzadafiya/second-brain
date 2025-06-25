import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

// Initialize Supabase client only if both URL and key are available
let supabase: any = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (error) {
    console.error('Failed to initialize Supabase client in auth middleware:', error);
  }
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN format
    
    if (!token) {
      return res.status(401).json({ message: 'Invalid authorization format' });
    }

    // First try to verify with our JWT
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      console.error('JWT_SECRET not set in environment variables');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as { id: string; email: string };
      
      req.user = {
        id: decoded.id,
        email: decoded.email
      };
      
      next();
    } catch (jwtError) {
      // If JWT verification fails, try Supabase Auth if available
      if (supabase) {
        try {
          const { data, error } = await supabase.auth.getUser(token);
          
          if (error || !data.user) {
            console.error('Authentication error:', error || 'No user found');
            return res.status(401).json({ message: 'Invalid or expired token' });
          }
          
          req.user = {
            id: data.user.id,
            email: data.user.email || ''
          };
          
          next();
        } catch (supabaseError) {
          console.error('Supabase authentication error:', supabaseError);
          return res.status(401).json({ message: 'Invalid or expired token' });
        }
      } else {
        // If Supabase client is not available, just return JWT error
        console.error('JWT verification failed and Supabase client not available:', jwtError);
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}; 