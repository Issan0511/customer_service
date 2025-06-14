// src/gemini.js
import { Client } from '@google/genai';

// 環境変数に GOOGLE_API_KEY を設定してください
const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  throw new Error('環境変数 GOOGLE_API_KEY が設定されていません');
}

// Client インスタンスを生成
const client = new Client({ apiKey });

// 使用するモデル名
const MODEL_NAME = 'gemini-2.0-flash';

// テキストを投げて返信を得る関数
export async function generateGeminiReply(text) {
  try {
    const response = await client.generateContent({
      model: MODEL_NAME,
      contents: [
        { role: 'user', parts: [{ text }] }
      ],
      // 必要に応じて generationConfig を追加可能
      // generationConfig: { maxOutputTokens: 1024, temperature: 0.7 }
    });

    // レスポンスから第一候補のテキストを返す
    return response.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  } catch (err) {
    // エラー時にはステータスや詳細を投げてデバッグしやすく
    console.error('Gemini API エラー:', err);
    throw err;
  }
}
