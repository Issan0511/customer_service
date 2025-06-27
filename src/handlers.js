import { createFormLinkMessage } from './messages.js';
import { generateGeminiReply } from './gemini.js';

// In-memory store to track progress of the psychological test for each user
const userStates = {};

// Simple psychological test questions
const psychQuestions = [
  '心理テスト1: 今、誰にも見られてないとしたら「何をしてみたい」ですか？',
  '心理テスト2: この世界から「1つだけ」消せるとしたら、何を消しますか？'
];

function createHandleEvent(client) {
  return async function handleEvent(event) {
    console.log('Handling event:', event.type);

    if (event.type === 'follow') {
      const userId = event.source.userId;
      // Start psychological test
      userStates[userId] = 0;
      console.log('Starting psychological test for new follower:', userId);
      return client.replyMessage(event.replyToken, [{ type: 'text', text: psychQuestions[0] }]);
    }

    if (event.type === 'message' && event.message.type === 'text') {
      const userId = event.source.userId;
      if (userStates[userId] !== undefined) {
        const step = userStates[userId];
        if (step + 1 < psychQuestions.length) {
          // Ask next question
          userStates[userId] = step + 1;
          return client.replyMessage(event.replyToken, [{ type: 'text', text: psychQuestions[step + 1] }]);
        } else {
          // End of test -> send form link
          delete userStates[userId];
          const link = `https://customer-service-hjly.onrender.com/form?userId=${userId}`;
          const messages = [createFormLinkMessage(link, '心理テストへのご回答ありがとうございました！')];
          return client.replyMessage(event.replyToken, messages);
        }
      }
      try {
        const reply = await generateGeminiReply(event.message.text);
        const messages = [{ type: 'text', text: reply || 'No response' }];
        return client.replyMessage(event.replyToken, messages);
      } catch (e) {
        console.error('Gemini API error:', e);
        return client.replyMessage(event.replyToken, [{ type: 'text', text: 'エラーが発生しました。' }]);
      }
    }

    return Promise.resolve(null);
  };
}

export default createHandleEvent;
