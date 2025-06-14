// src/gemini.js
import { GoogleGenerativeAI } from '@google/generative-ai';

// 環境変数に GOOGLE_API_KEY を設定してください
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('環境変数 GEMINI_API_KEY が設定されていません');
}

// Client インスタンスを生成
const client = new GoogleGenerativeAI(apiKey);

// 使用するモデル名
const MODEL_NAME = 'gemini-pro';

// テキストを投げて返信を得る関数
export async function generateGeminiReply(text) {
  try {
    const model = client.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(text);
    const response = await result.response;
    return response.text() ?? '';
  } catch (err) {
    // エラー時にはステータスや詳細を投げてデバッグしやすく
    console.error('Gemini API エラー:', err);
    throw err;
  }
}
