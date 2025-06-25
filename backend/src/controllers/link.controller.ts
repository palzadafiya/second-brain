import { Request, Response } from 'express';
import { prisma, supabase } from '../config/database';
import { validate, createLinkSchema, updateLinkSchema } from '../utils/validation';
import { extractUrlMetadata, extractUrlContent } from '../utils/url.utils';
import { generateEmbedding, generateSummary, generateTags } from '../utils/openai.utils';

// Interface for tag object
interface TagType {
  id: string;
  name: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

// Interface for link response object
interface LinkResponse {
  id: string;
  url: string;
  title: string | null;
  image: string | null;
  domain: string | null;
  summary: string | null;
  tags: string[];
  embedding?: number[] | null;
  createdAt: Date | null;
  updatedAt?: Date | null;
}

/**
 * Helper function to create tags and connect them to a link
 * @param linkId - The ID of the link to connect tags to
 * @param tagNames - Array of tag names to create or find
 */
async function createTagsForLink(linkId: string, tagNames: string[]): Promise<void> {
  try {
    // Process each tag name
    for (const tagName of tagNames) {
      // Find or create the tag
      const tag = await prisma.tag.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName }
      });
      
      // Create link_to_tag connection with proper UUID casting
      await prisma.$executeRaw`
        INSERT INTO public.link_to_tag (link_id, tag_id)
        VALUES (${linkId}::uuid, ${tag.id}::uuid)
        ON CONFLICT (link_id, tag_id) DO NOTHING
      `;
    }
  } catch (error) {
    console.error('Error creating tags for link:', error);
    throw new Error('Failed to create tags for link');
  }
}

/**
 * Helper function to get tags for a link
 * @param linkId - The ID of the link to get tags for
 * @returns Array of tag objects
 */
async function getTagsForLink(linkId: string): Promise<TagType[]> {
  try {
    // Use raw SQL via Prisma.$queryRaw to get tags for a link
    const tags = await prisma.$queryRaw<TagType[]>`
      SELECT t.id, t.name, t.created_at as "createdAt", t.updated_at as "updatedAt"
      FROM public.tags t
      JOIN public.link_to_tag lt ON t.id = lt.tag_id
      WHERE lt.link_id = ${linkId}::uuid
    `;
    return tags;
  } catch (error) {
    console.error('Error getting tags for link:', error);
    return [];
  }
}

/**
 * Helper function to delete link_to_tag connections
 * @param linkId - The ID of the link to delete tag connections for
 */
async function deleteTagsForLink(linkId: string): Promise<void> {
  try {
    await prisma.$executeRaw`
      DELETE FROM public.link_to_tag
      WHERE link_id = ${linkId}::uuid
    `;
  } catch (error) {
    console.error('Error deleting tags for link:', error);
    throw new Error('Failed to delete tags for link');
  }
}

/**
 * Format a link object for response
 * @param link - The link object from the database
 * @param tags - Array of tag objects
 * @returns Formatted link response object
 */
function formatLinkResponse(
  link: {
    id: string;
    url: string;
    title: string | null;
    image: string | null;
    domain: string | null;
    summary: string | null;
    embedding?: any;
    createdAt: Date | null;
    updatedAt?: Date | null;
  },
  tags: TagType[]
): LinkResponse {
  return {
    id: link.id,
    url: link.url,
    title: link.title,
    image: link.image,
    domain: link.domain,
    summary: link.summary,
    tags: tags.map(tag => tag.name),
    embedding: link.embedding,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt
  };
}

/**
 * Create a new link
 * @route POST /api/links
 */
export const createLink = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Validate request body
    const validation = validate(createLinkSchema)(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validation.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    
    const { url } = validation.data;
    
    try {
      console.log(`[LINK] Processing new link: ${url}`);
      
      // Extract metadata from the URL
      const { title, image, domain } = await extractUrlMetadata(url);
      
      // Extract content for summary and embedding
      const content = await extractUrlContent(url);
      
      // Generate summary using OpenAI
      const summary = await generateSummary(content);
      
      // Generate tags using OpenAI
      const suggestedTags = await generateTags(content);
      
      // Generate embedding using OpenAI
      const embedding = await generateEmbedding(content);
      
      // Check embedding dimensions before saving
      if (!Array.isArray(embedding) || embedding.length !== 1536) {
        console.error(`[LINK] Invalid embedding dimensions: ${Array.isArray(embedding) ? embedding.length : 'not an array'}`);
        return res.status(500).json({ message: 'Failed to generate valid embedding' });
      }
      
      // Create the link in the database with embedding
      const link = await prisma.$executeRaw`
        INSERT INTO public.links (url, title, image, domain, summary, user_id, embedding)
        VALUES (${url}, ${title}, ${image}, ${domain}, ${summary}, ${req.user.id}::uuid, ${JSON.stringify(embedding)}::vector)
        RETURNING id, url, title, image, domain, summary, embedding, created_at, updated_at
      `;
      
      // Get the newly created link
      const newLink = await prisma.link.findFirst({
        where: {
          url,
          userId: req.user.id
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      if (!newLink) {
        return res.status(500).json({ message: 'Failed to create link' });
      }
      
      // Create tags and connect them to the link
      await createTagsForLink(newLink.id, suggestedTags);
      
      // Get the embedding from Supabase
      const { data: linkWithEmbedding } = await supabase
        .from('links')
        .select('embedding')
        .eq('id', newLink.id)
        .single();
      
      // Get the tags for the link
      const tags = await getTagsForLink(newLink.id);
      
      // Return the created link with tags and embedding
      return res.status(201).json({
        message: 'Link created successfully',
        link: formatLinkResponse(
          { 
            ...newLink, 
            embedding: linkWithEmbedding?.embedding || null 
          }, 
          tags
        )
      });
    } catch (error) {
      console.error('Error processing link:', error);
      return res.status(500).json({ 
        message: 'Error processing link',
        error: process.env.NODE_ENV === 'development' ? String(error) : 'Server error'
      });
    }
  } catch (error) {
    console.error('Error creating link:', error);
    return res.status(500).json({ message: 'Server error creating link' });
  }
};

/**
 * Get all links for the authenticated user
 * @route GET /api/links
 */
export const getLinks = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Get links from Prisma
    const links = await prisma.link.findMany({
      where: {
        userId: req.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Get embeddings from Supabase
    const { data: embeddings } = await supabase
      .from('links')
      .select('id, embedding')
      .in('id', links.map(link => link.id));
    
    // Create a map of embeddings by link ID
    const embeddingMap = new Map();
    if (embeddings) {
      embeddings.forEach((item: any) => {
        embeddingMap.set(item.id, item.embedding);
      });
    }
    
    // Get tags for each link and add embeddings
    const linksWithTagsAndEmbeddings = await Promise.all(links.map(async (link) => {
      const tags = await getTagsForLink(link.id);
      return formatLinkResponse(
        { 
          ...link, 
          embedding: embeddingMap.get(link.id) || null 
        }, 
        tags
      );
    }));
    
    return res.status(200).json({ links: linksWithTagsAndEmbeddings });
  } catch (error) {
    console.error('Error fetching links:', error);
    return res.status(500).json({ message: 'Server error fetching links' });
  }
};

/**
 * Get a specific link by ID
 * @route GET /api/links/:id
 */
export const getLinkById = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const { id } = req.params;
    
    const link = await prisma.link.findUnique({
      where: {
        id,
        userId: req.user.id
      }
    });
    
    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }
    
    // Get embedding from Supabase
    const { data: linkWithEmbedding } = await supabase
      .from('links')
      .select('embedding')
      .eq('id', id)
      .single();
    
    // Get tags for the link
    const tags = await getTagsForLink(link.id);
    
    return res.status(200).json({
      link: formatLinkResponse(
        { 
          ...link, 
          embedding: linkWithEmbedding?.embedding || null 
        }, 
        tags
      )
    });
  } catch (error) {
    console.error('Error fetching link:', error);
    return res.status(500).json({ message: 'Server error fetching link' });
  }
};

/**
 * Update a link
 * @route PUT /api/links/:id
 */
export const updateLink = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const { id } = req.params;
    
    const validation = validate(updateLinkSchema)(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validation.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    
    const { title, summary, tags } = validation.data;
    
    // Check if link exists and belongs to the user
    const existingLink = await prisma.link.findUnique({
      where: {
        id,
        userId: req.user.id
      }
    });
    
    if (!existingLink) {
      return res.status(404).json({ message: 'Link not found' });
    }
    
    // Update the link
    const updateData: { title?: string; summary?: string } = {};
    if (title !== undefined) updateData.title = title;
    if (summary !== undefined) updateData.summary = summary;
    
    const updatedLink = await prisma.link.update({
      where: { id },
      data: updateData
    });
    
    // Update tags if provided
    if (tags && Array.isArray(tags)) {
      // Delete all existing link_to_tag connections
      await deleteTagsForLink(id);
      
      // Create new tags and connections
      await createTagsForLink(id, tags);
    }
    
    // Get embedding from Supabase
    const { data: linkWithEmbedding } = await supabase
      .from('links')
      .select('embedding')
      .eq('id', id)
      .single();
    
    // Get updated tags
    const updatedTags = await getTagsForLink(id);
    
    return res.status(200).json({
      message: 'Link updated successfully',
      link: formatLinkResponse(
        { 
          ...updatedLink, 
          embedding: linkWithEmbedding?.embedding || null 
        }, 
        updatedTags
      )
    });
  } catch (error) {
    console.error('Error updating link:', error);
    return res.status(500).json({ message: 'Server error updating link' });
  }
};

/**
 * Delete a link
 * @route DELETE /api/links/:id
 */
export const deleteLink = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const { id } = req.params;
    
    // Check if link exists and belongs to the user
    const link = await prisma.link.findUnique({
      where: {
        id,
        userId: req.user.id
      }
    });
    
    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }
    
    // Delete the link (this will cascade delete link_to_tag entries)
    await prisma.link.delete({
      where: { id }
    });
    
    return res.status(200).json({
      message: 'Link deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting link:', error);
    return res.status(500).json({ message: 'Server error deleting link' });
  }
};

/**
 * Preview a link without saving it – returns metadata, summary and suggested tags
 * @route GET /api/links/preview?url=...
 */
export const previewLink = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.query.url || typeof req.query.url !== 'string') {
      return res.status(400).json({ message: 'URL parameter is required' });
    }

    const url = req.query.url as string;

    try {
      // Extract metadata
      const { title, image, domain } = await extractUrlMetadata(url);

      // Extract content for summary and tags
      const content = await extractUrlContent(url);

      // Generate summary and tags using OpenAI
      const [summary, tags] = await Promise.all([
        generateSummary(content),
        generateTags(content),
      ]);

      return res.status(200).json({
        preview: {
          url,
          title,
          image,
          domain,
          summary,
          tags,
        },
      });
    } catch (error) {
      console.error('Error generating link preview:', error);
      return res.status(500).json({ message: 'Error generating link preview' });
    }
  } catch (error) {
    console.error('Error in previewLink:', error);
    return res.status(500).json({ message: 'Server error generating preview' });
  }
};