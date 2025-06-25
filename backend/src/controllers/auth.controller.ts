import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { validate, registerSchema, loginSchema } from '../utils/validation';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const JWT_SECRET: string = process.env.JWT_SECRET || 'default-secret-key';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

// Debug logging
console.log('Environment variables:');
console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('SUPABASE_KEY:', SUPABASE_KEY ? 'Set (not showing for security)' : 'Not set');
console.log('JWT_SECRET:', JWT_SECRET ? 'Set (not showing for security)' : 'Not set');

// Initialize Supabase client only if both URL and key are available
let supabase: any = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('Supabase client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
  }
} else {
  console.error('Missing Supabase credentials. Please check your .env file.');
}

export const register = async (req: Request, res: Response) => {
  try {
    const validation = validate(registerSchema)(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validation.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    
    const { email, password, name } = validation.data;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }
    
    // If Supabase client is available, use it
    if (supabase) {
      try {
        // Register user with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name || null
            }
          }
        });
        
        if (authError) {
          console.error('Supabase Auth error:', authError);
          return res.status(500).json({ message: authError.message });
        }
        
        if (!authData.user) {
          return res.status(500).json({ message: 'Failed to create user' });
        }
        
        // Generate JWT token
        const token = jwt.sign(
          { id: authData.user.id, email: authData.user.email },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
        );
        
        return res.status(201).json({
          message: 'User registered successfully',
          user: {
            id: authData.user.id,
            email: authData.user.email,
            name: authData.user.user_metadata.name
          },
          token
        });
      } catch (supabaseError) {
        console.error('Supabase registration error:', supabaseError);
        // Fall back to Prisma if Supabase fails
      }
    }
    
    // Fall back to Prisma if Supabase is not available or failed
    console.log('Falling back to Prisma for user registration');
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    try {
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || null
        }
      });
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
      );
      
      return res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        token
      });
    } catch (prismaError) {
      console.error('Prisma registration error:', prismaError);
      return res.status(500).json({ message: 'Failed to create user account' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validation = validate(loginSchema)(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validation.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    
    const { email, password } = validation.data;
    
    // If Supabase client is available, use it
    if (supabase) {
      try {
        // Sign in with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (authError) {
          console.error('Supabase Auth error:', authError);
          // Don't return error here, try Prisma next
        } else if (authData.user) {
          // Generate JWT token
          const token = jwt.sign(
            { id: authData.user.id, email: authData.user.email },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
          );
          
          return res.status(200).json({
            message: 'Login successful',
            user: {
              id: authData.user.id,
              email: authData.user.email,
              name: authData.user.user_metadata.name
            },
            token
          });
        }
      } catch (supabaseError) {
        console.error('Supabase login error:', supabaseError);
        // Fall back to Prisma if Supabase fails
      }
    }
    
    // Fall back to Prisma if Supabase is not available or failed
    console.log('Falling back to Prisma for user login');
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );
    
    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // If Supabase client is available, use it
    if (supabase) {
      try {
        // Get user from Supabase
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (!userError && userData.user) {
          return res.status(200).json({
            user: {
              id: userData.user.id,
              email: userData.user.email,
              name: userData.user.user_metadata.name,
              createdAt: userData.user.created_at
            }
          });
        }
      } catch (supabaseError) {
        console.error('Supabase get profile error:', supabaseError);
        // Fall back to Prisma if Supabase fails
      }
    }
    
    // Fall back to Prisma if Supabase is not available or failed
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: 'Server error fetching profile' });
  }
}; 