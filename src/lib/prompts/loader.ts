import fs from 'fs';
import path from 'path';

export const loadPrompt = (filename: string, fallback: string): string => {
  const filePath = path.join(process.cwd(), 'data', 'prompts', filename);
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
  } catch (error) {
    console.error(`Error loading prompt from ${filePath}:`, error);
  }
  return fallback;
};
