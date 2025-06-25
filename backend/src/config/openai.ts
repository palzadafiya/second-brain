import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('Missing OpenAI API key in environment variables');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey,
});

export default openai; 