import { z } from 'zod';

// Auth validation schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Link validation schemas
export const createLinkSchema = z.object({
  url: z.string().url('Invalid URL format'),
});

export const updateLinkSchema = z.object({
  title: z.string().optional(),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Chat validation schema
export const chatQuerySchema = z.object({
  query: z.string().min(1, 'Query is required'),
});

// Helper function to validate request body against a schema
export const validate = <T>(schema: z.ZodType<T, any, any>) => {
  return (data: unknown): { success: true; data: T } | { success: false; error: z.ZodError } => {
    try {
      const validData = schema.parse(data);
      return { success: true, data: validData };
    } catch (error) {
      return { success: false, error: error as z.ZodError };
    }
  };
}; 