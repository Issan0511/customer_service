import { ChatClient } from 'dify-client';

const apiKey = process.env.DIFY_API_KEY;
if (!apiKey) {
  throw new Error('環境変数 DIFY_API_KEY が設定されていません');
}

const baseUrl = process.env.DIFY_BASE_URL;
const client = new ChatClient(apiKey, baseUrl);

let systemPrompt = '';
export function setSystemPrompt(prompt) {
  systemPrompt = prompt;
}

export async function generateDifyReply(text, user = 'anonymous') {
  try {
    const inputs = {};
    if (systemPrompt) {
      inputs.system_prompt = systemPrompt;
    }
    const res = await client.createChatMessage(inputs, text, user);
    const data = res.data || {};
    if (data.answer) return data.answer;
    if (data.message && data.message.answer) return data.message.answer;
    return '';
  } catch (err) {
    console.error('Dify API error:', err);
    throw err;
  }
}
