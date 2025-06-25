import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';

interface UrlMetadata {
  title: string | null;
  image: string | null;
  domain: string;
}

/**
 * Extract metadata from a URL including title, image, and domain
 * @param url - The URL to extract metadata from
 * @returns Object containing title, image, and domain
 */
export const extractUrlMetadata = async (url: string): Promise<UrlMetadata> => {
  try {
    // Ensure URL is properly formatted
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
    
    // Parse the URL to get the domain
    const parsedUrl = new URL(formattedUrl);
    const domain = parsedUrl.hostname.replace('www.', '');
    
    // Default values
    let title: string | null = null;
    let image: string | null = null;
    
    try {
      // Fetch the HTML content with timeout and headers
      const response = await axios.get(formattedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 8000, // 8 seconds timeout
        maxContentLength: 10 * 1024 * 1024, // 10MB max content size
      });
      
      // Load the HTML into cheerio
      const $ = cheerio.load(response.data);
      
      // Try to get Open Graph title, fallback to regular title
      title = $('meta[property="og:title"]').attr('content') || 
              $('meta[name="twitter:title"]').attr('content') || 
              $('title').text() || null;
      
      // Clean up the title
      if (title) {
        title = title.trim();
      }
      
      // Try to get Open Graph image, fallback to other image meta tags
      image = $('meta[property="og:image"]').attr('content') || 
              $('meta[name="twitter:image"]').attr('content') || 
              $('meta[name="twitter:image:src"]').attr('content') || null;
      
      // If image is a relative URL, make it absolute
      if (image && !image.startsWith('http')) {
        image = new URL(image, parsedUrl.origin).toString();
      }
    } catch (fetchError) {
      console.error(`Error fetching URL content for ${url}:`, fetchError);
      // Continue with default values if fetching fails
    }
    
    return { title, image, domain };
  } catch (error) {
    console.error('Error extracting URL metadata:', error);
    
    // If URL parsing fails, try to extract domain from the raw URL
    let domain = 'unknown';
    try {
      // Simple regex to extract domain from URL
      const matches = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)/im);
      if (matches && matches.length > 1) {
        domain = matches[1];
      }
    } catch (e) {
      console.error('Error extracting domain from URL:', e);
    }
    
    return { title: null, image: null, domain };
  }
};

/**
 * Extract the main content from a URL for summarization
 * @param url - The URL to extract content from
 * @returns The main content as a string
 */
export const extractUrlContent = async (url: string): Promise<string> => {
  try {
    // Ensure URL is properly formatted
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
    
    // Fetch the HTML content
    const response = await axios.get(formattedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 8000, // 8 seconds timeout
      maxContentLength: 10 * 1024 * 1024, // 10MB max content size
    });
    
    // Load the HTML into cheerio
    const $ = cheerio.load(response.data);
    
    // Remove script, style, and other non-content elements
    $('script, style, nav, footer, header, aside, iframe, noscript, svg, form, button').remove();
    
    // Try to find the main content
    let content = '';
    
    // Look for common content containers
    const contentSelectors = [
      'article', 
      'main', 
      '.content', 
      '.post-content', 
      '.article-content', 
      '.entry-content',
      '#content',
      '[role="main"]',
      '.post',
      '.blog-post'
    ];
    
    // Try each selector
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text().trim();
        break;
      }
    }
    
    // If no content found, use body text but try to be smarter about it
    if (!content) {
      // Get all paragraphs with reasonable length
      const paragraphs = $('p').filter(function() {
        const text = $(this).text().trim();
        return text.length > 50; // Only consider paragraphs with substantial text
      }).map(function() {
        return $(this).text().trim();
      }).get();
      
      if (paragraphs.length > 0) {
        content = paragraphs.join('\n\n');
      } else {
        content = $('body').text().trim();
      }
    }
    
    // Clean up the content
    content = content
      .replace(/\s+/g, ' ')  // Replace multiple spaces with a single space
      .replace(/\n+/g, '\n') // Replace multiple newlines with a single newline
      .trim();
    
    // Limit content length to avoid overwhelming the API
    const maxLength = 8000; // Increased from 4000 to capture more content
    if (content.length > maxLength) {
      content = content.substring(0, maxLength) + '...';
    }
    
    return content || `Could not extract meaningful content from ${url}`;
  } catch (error) {
    console.error('Error extracting URL content:', error);
    return `Failed to extract content from ${url}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}; 