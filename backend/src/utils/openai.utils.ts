import openai from '../config/openai';

// Default embedding dimensions for text-embedding-ada-002
const EMBEDDING_DIMENSIONS = 1536;

// Available tags for link categorization
const AVAILABLE_TAGS = [
  'Article', 
  'Blog', 
  'News', 
  'Tutorial', 
  'Documentation',
  'Video', 
  'Image', 
  'Social Media',
  'Research',
  'Tool',
  'Product',
  'Forum',
  'Discussion',
  'Review',
  'Music'
];

/**
 * Generate an embedding for a given text using OpenAI's API
 * @param text - The text to generate an embedding for
 * @returns A 1536-dimensional embedding vector
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    // Truncate text if it's too long
    const truncatedText = text.length > 8000 ? text.substring(0, 8000) : text;

    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: truncatedText,
    });

    const embedding = response.data[0].embedding;

    // Validate embedding dimensions
    if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(`Invalid embedding dimensions: ${Array.isArray(embedding) ? embedding.length : 'not an array'}`);
    }

    // Quick sanity-check for invalid numbers
    if (embedding.some((val) => Number.isNaN(val) || !Number.isFinite(val))) {
      throw new Error('Embedding contains NaN or non-finite values');
    }

    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Generate a summary for a given URL content
 * @param content - The content to summarize
 * @returns A 3-4 line summary
 */
export const generateSummary = async (content: string): Promise<string> => {
  try {
    // Truncate content if it's too long
    const truncatedContent = content.length > 8000 ? content.substring(0, 8000) + '...' : content;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates concise summaries. Create a 3-4 line summary of the provided content. Focus on the main points and key information.'
        },
        {
          role: 'user',
          content: truncatedContent
        }
      ],
      max_tokens: 150,
      temperature: 0.5 // Lower temperature for more focused summaries
    });
    
    const summary = response.choices[0].message.content || '';
    return summary.trim();
  } catch (error) {
    console.error('Error generating summary:', error);
    // Return a placeholder summary instead of throwing
    return 'No summary available due to processing error.';
  }
};

/**
 * Generate tags for a given content from a fixed list
 * @param content - The content to generate tags for
 * @returns An array of tags
 */
export const generateTags = async (content: string): Promise<string[]> => {
  try {
    // Truncate content if it's too long
    const truncatedContent = content.length > 8000 ? content.substring(0, 8000) + '...' : content;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that categorizes content. 
          From the following list of tags: ${AVAILABLE_TAGS.join(', ')}, 
          select 2-4 of the most appropriate tags for the provided content. 
          Return only the tag names as a JSON array with no explanation or additional text.
          Example response format: ["Tag1", "Tag2"]`
        },
        {
          role: 'user',
          content: truncatedContent
        }
      ],
      max_tokens: 50,
      temperature: 0.3 // Lower temperature for more consistent tags
    });
    
    const responseContent = response.choices[0].message.content || '[]';
    let parsedTags: string[] = [];
    
    try {
      // Try to parse the response as a JSON array
      parsedTags = JSON.parse(responseContent);
      
      // If it's not an array, look for array-like text and try to parse that
      if (!Array.isArray(parsedTags)) {
        const arrayMatch = responseContent.match(/\[(.*)\]/);
        if (arrayMatch && arrayMatch[1]) {
          // Try to parse the matched content as a JSON array with proper formatting
          const formattedMatch = arrayMatch[1]
            .replace(/'/g, '"')  // Replace single quotes with double quotes
            .replace(/,\s*]/g, ']'); // Remove trailing commas
          
          parsedTags = JSON.parse(`[${formattedMatch}]`);
        } else {
          parsedTags = [];
        }
      }
    } catch (parseError) {
      console.error('Error parsing tags response:', parseError);
      // Fallback: split by commas if JSON parsing fails
      parsedTags = responseContent
        .replace(/[\[\]"']/g, '')  // Remove brackets and quotes
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);
    }
    
    // Ensure we only return valid tags from our list and limit to 5 tags max
    const validTags = parsedTags
      .filter(tag => AVAILABLE_TAGS.some(validTag => 
        validTag.toLowerCase() === tag.toLowerCase()
      ))
      .map(tag => {
        // Find the correctly cased version of the tag
        const correctCase = AVAILABLE_TAGS.find(validTag => 
          validTag.toLowerCase() === tag.toLowerCase()
        );
        return correctCase || tag;
      })
      .slice(0, 5);
    
    // If no valid tags were found, return some default tags
    if (validTags.length === 0) {
      return ['Article', 'Blog'];
    }
    
    return validTags;
  } catch (error) {
    console.error('Error generating tags:', error);
    // Return default tags instead of throwing
    return ['Article', 'Blog'];
  }
};

/**
 * Generate a response from the chatbot based on a user query and relevant links
 * @param query - The user's query
 * @param relevantLinks - Array of relevant links to provide as context
 * @returns The chatbot's response
 */
export const generateChatResponse = async (
  query: string, 
  relevantLinks: Array<{
    url: string;
    title?: string | null;
    summary?: string | null;
  }>
): Promise<string> => {
  try {
    // Build context from relevant links with clear separation and formatting
    const context = relevantLinks.map((link, index) => {
      return `LINK ${index + 1}:
TITLE: ${link.title || 'Untitled'}
URL: ${link.url}
SUMMARY: ${link.summary || 'No summary available'}
`;
    }).join('\n---\n');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that answers questions based on the user's saved links. 
          Use the following saved links as context for answering the user's question. 
          When you find information in the provided links that helps answer the query, mention which link(s) 
          contained that information.
          
          If the links don't contain relevant information to answer the question, 
          acknowledge that and provide your best response based on your general knowledge.
          
          CONTEXT LINKS:
          ${context}`
        },
        {
          role: 'user',
          content: query
        }
      ],
      max_tokens: 800,
      temperature: 0.5
    });
    
    return response.choices[0].message.content || 'I could not generate a response.';
  } catch (error) {
    console.error('Error generating chat response:', error);
    return 'Sorry, I encountered an error while generating a response. Please try again later.';
  }
}; 