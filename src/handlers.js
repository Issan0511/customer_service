const { createFormLinkMessage } = require('./messages');

function createHandleEvent(client) {
  return function handleEvent(event) {
    console.log('Handling event:', event.type);

    if (event.type === 'follow') {
      const userId = event.source.userId;
      const link = `https://customer-service-hjly.onrender.com/form?userId=${userId}`;
      console.log('Sending form link to new follower:', link);
      const messages = [createFormLinkMessage(link, '友達追加ありがとうございます！')];
      return client.replyMessage(event.replyToken, messages);
    }

    if (event.type === 'message' && event.message.type === 'text') {
      const userId = event.source.userId;
      const domain = process.env.NGROK_DOMAIN || 'localhost:3000';
      const protocol = domain.includes('ngrok') ? 'https' : 'http';
      const link = `${protocol}://${domain}/form?userId=${userId}`;
      const messages = [createFormLinkMessage(link)];
      return client.replyMessage(event.replyToken, messages);
    }

    return Promise.resolve(null);
  };
}

module.exports = createHandleEvent;
