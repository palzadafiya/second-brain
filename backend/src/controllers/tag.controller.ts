import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';

// Define interfaces that match Prisma's actual types
interface TagType {
  id: string;
  name: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

interface LinkType {
  id: string;
  url: string;
  title: string | null;
  image: string | null;
  domain: string | null;
  summary: string | null;
  embedding?: any;
  createdAt: Date | null;
  updatedAt: Date | null;
  userId: string;
}

/**
 * Get all tags
 * @route GET /api/tags
 */
export const getAllTags = async (req: Request, res: Response): Promise<Response> => {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    
    return res.status(200).json({
      tags: tags.map(tag => ({
        id: tag.id,
        name: tag.name
      }))
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return res.status(500).json({ message: 'Server error fetching tags' });
  }
};

/**
 * Get links by tag name
 * @route GET /api/tags/:tagName/links
 */
export const getLinksByTag = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const { tagName } = req.params;
    
    // Find the tag
    const tag = await prisma.tag.findUnique({
      where: {
        name: tagName
      }
    });
    
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }
    
    // Find links with this tag using raw SQL with proper UUID casting
    const links = await prisma.$queryRaw<LinkType[]>`
      SELECT l.id, l.url, l.title, l.image, l.domain, l.summary, l.created_at as "createdAt", l.updated_at as "updatedAt", l.user_id as "userId"
      FROM public.links l
      JOIN public.link_to_tag lt ON l.id = lt.link_id
      WHERE lt.tag_id = ${tag.id}::uuid
      AND l.user_id = ${req.user.id}::uuid
      ORDER BY l.created_at DESC
    `;
    
    // For each link, get its tags
    const linksWithTags = await Promise.all(links.map(async (link) => {
      const tags = await prisma.$queryRaw<TagType[]>`
        SELECT t.id, t.name, t.created_at as "createdAt", t.updated_at as "updatedAt"
        FROM public.tags t
        JOIN public.link_to_tag lt ON t.id = lt.tag_id
        WHERE lt.link_id = ${link.id}::uuid
      `;
      
      return {
        id: link.id,
        url: link.url,
        title: link.title,
        image: link.image,
        domain: link.domain,
        summary: link.summary,
        tags: tags.map(t => t.name),
        createdAt: link.createdAt
      };
    }));
    
    return res.status(200).json({
      tag: {
        id: tag.id,
        name: tag.name
      },
      links: linksWithTags
    });
  } catch (error) {
    console.error('Error fetching links by tag:', error);
    return res.status(500).json({ message: 'Server error fetching links by tag' });
  }
}; 