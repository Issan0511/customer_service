import { createFormLinkMessage } from './messages.js';
import { generateDifyReply } from './dify.js';

// ------ Psychological test feature (temporarily disabled) ------
// const userStates = {};
// const psychQuestions = [
//   '今、誰にも見られてないとしたら「何をしてみたい」ですか？',
//   'この世界から「1つだけ」消せるとしたら、何を消しますか？',
//   'あなたの親のことをどう思いますか？',
//   '全てのことに等しく意味があると思いますか？'
// ];

function createHandleEvent(client) {
  return async function handleEvent(event) {
    console.log('Handling event:', event.type);

    if (event.type === 'follow') {
      const userId = event.source.userId;
      const link = `https://customer-service-hjly.onrender.com/form?userId=${userId}`;
      console.log('Sending form link to new follower:', userId);
      const messages = [createFormLinkMessage(
        link,
        '友達追加ありがとうございます！',
        'すぐにお仕事紹介を希望ならこちらから👇🏻\nたった1分で完了',
        '▶ フォームを開く'
      )];
      return client.replyMessage(event.replyToken, messages);
    }

    if (event.type === 'message' && event.message.type === 'text') {
      const userId = event.source.userId;
      // if (userStates[userId] !== undefined) {
      //   const step = userStates[userId];
      //   if (step + 1 < psychQuestions.length) {
      //     // Ask next question
      //     userStates[userId] = step + 1;
      //     return client.replyMessage(event.replyToken, [{ type: 'text', text: psychQuestions[step + 1] }]);
      //   } else {
      //     // End of test -> send form link
      //     delete userStates[userId];
      //     const link = `https://customer-service-hjly.onrender.com/form?userId=${userId}`;
      //     const messages = [createFormLinkMessage(link, '心理テストへのご回答ありがとうございました！')];
      //     return client.replyMessage(event.replyToken, messages);
      //   }
      // }
      try {
        const reply = await generateDifyReply(event.message.text, userId);
        const messages = [{ type: 'text', text: reply || 'No response' }];
        return client.replyMessage(event.replyToken, messages);
      } catch (e) {
        console.error('Dify API error:', e);
        return client.replyMessage(event.replyToken, [{ type: 'text', text: 'エラーが発生しました。' }]);
      }
    }

    return Promise.resolve(null);
  };
}

export default createHandleEvent;
