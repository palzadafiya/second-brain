import { Request, Response } from 'express';
import { supabase } from '../config/database';
import { generateEmbedding, generateChatResponse } from '../utils/openai.utils';
import { validate, chatQuerySchema } from '../utils/validation';

interface SimilarLink {
  id: string;
  url: string;
  title: string | null;
  domain: string | null;
  summary: string | null;
  similarity: number;
}

export const chatWithLinks = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const validation = validate(chatQuerySchema)(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: 'Validation error', errors: validation.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) });
    }

    const { query } = validation.data;

    const enhancedQuery = `This is about: ${query}`;
    const queryEmbedding = await generateEmbedding(enhancedQuery);

    const { data: similarLinks, error } = await supabase.rpc('match_links', {
      query_embedding: queryEmbedding,
      match_threshold: 0,
      match_count: 5,
      user_id: req.user.id
    });

    if (error) {
      console.error('Error finding similar links:', error);
      return res.status(500).json({ message: 'Error finding similar links' });
    }

    if (!similarLinks || similarLinks.length === 0) {
      const response = await generateChatResponse(query, []);
      return res.status(200).json({ response, similarLinks: [] });
    }

    const response = await generateChatResponse(query, similarLinks as Array<{ url: string; title?: string | null; summary?: string | null; }>);

    const formattedLinks = (similarLinks as SimilarLink[]).map(link => ({
      id: link.id,
      url: link.url,
      title: link.title,
      domain: link.domain,
      summary: link.summary,
      similarity: link.similarity,
      relevanceScore: Math.round(link.similarity * 100)
    }));

    return res.status(200).json({ response, similarLinks: formattedLinks });
  } catch (error) {
    console.error('Error in chat:', error);
    return res.status(500).json({ message: 'Server error processing chat request' });
  }
}; 