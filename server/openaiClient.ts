import OpenAI from 'openai';

let client: OpenAI | undefined;

export function getOpenAIClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY ?? process.env.OPEN_AI_KEY;
    if (!apiKey) {
      throw new Error(
        'Missing OpenAI API key. Set OPENAI_API_KEY in your environment.',
      );
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}

export const DEFAULT_OPENAI_MODEL =
  process.env.OPENAI_MODEL ?? 'gpt-4.1-mini';
