import { createFormLinkMessage } from './messages.js';
import { generateGeminiReply } from './gemini.js';

function createHandleEvent(client) {
  return async function handleEvent(event) {
    console.log('Handling event:', event.type);

    if (event.type === 'follow') {
      const userId = event.source.userId;
      const link = `https://customer-service-hjly.onrender.com/form?userId=${userId}`;
      console.log('Sending form link to new follower:', link);
      const messages = [createFormLinkMessage(link, '友達追加ありがとうございます！')];
      return client.replyMessage(event.replyToken, messages);
    }

    if (event.type === 'message' && event.message.type === 'text') {
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
