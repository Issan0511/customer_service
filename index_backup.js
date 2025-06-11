require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const path = require('path');

const config = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
};

// デバッグ用：環境変数の確認
console.log('Environment variables check:');
console.log('LINE_CHANNEL_SECRET exists:', !!process.env.LINE_CHANNEL_SECRET);
console.log('LINE_CHANNEL_ACCESS_TOKEN exists:', !!process.env.LINE_CHANNEL_ACCESS_TOKEN);

if (!process.env.LINE_CHANNEL_SECRET || !process.env.LINE_CHANNEL_ACCESS_TOKEN) {
  console.error('❌ 環境変数が設定されていません');
  process.exit(1);
}

// Validate LINE configuration
if (!config.channelSecret || !config.channelAccessToken) {
  console.error('❌ LINE configuration is missing!');
  console.error('Required environment variables:');
  console.error('- LINE_CHANNEL_SECRET:', config.channelSecret ? '✅ Set' : '❌ Missing');
  console.error('- LINE_CHANNEL_ACCESS_TOKEN:', config.channelAccessToken ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

console.log('✅ LINE configuration validated');
const client = new line.Client(config);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// webhook endpoint for LINE
app.post('/webhook', (req, res) => {
  console.log('Webhook received:', JSON.stringify(req.body, null, 2));
  console.log('Request headers:', req.headers);
  
  // 手動でLINE署名検証を実行
  try {
    // LINE署名検証ミドルウェアを手動で実行
    const middleware = line.middleware(config);
    middleware(req, res, (err) => {
      if (err) {
        console.error('Signature validation failed:', err);
        return res.status(400).json({ error: 'Invalid signature' });
      }
      
      // 署名検証成功後の処理
      processWebhookEvents(req, res);
    });
  } catch (error) {
    console.error('Error in webhook processing:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

function processWebhookEvents(req, res) {
  
  if (!req.body.events || req.body.events.length === 0) {
    console.log('No events in webhook');
    return res.status(200).json({ message: 'No events' });
  }

  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => {
      console.log('Events processed successfully:', result);
      res.status(200).json(result);
    })
    .catch((err) => {
      console.error('Error processing events:', err);
      console.error('Error stack:', err.stack);
      res.status(500).json({ error: 'Internal server error', message: err.message });
    });
});

// simple form page
app.get('/form', (req, res) => {
  const userId = req.query.userId || '';
  res.send(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Input</title></head>
<body>
  <form method="POST" action="/submit">
    <input type="hidden" name="userId" value="${userId}">
    <label>Name: <input type="text" name="name"></label><br>
    <button type="submit">Send</button>
  </form>
</body>
</html>`);
});

// handle form submission
app.post('/submit', (req, res) => {
  const { userId, name } = req.body;
  // send to LINE webhook (example: push message)
  if (userId && name) {
    client.pushMessage(userId, { type: 'text', text: `Received: ${name}` })
      .then(() => {
        res.send('Thank you!');
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error');
      });
  } else {
    res.status(400).send('Missing parameters');
  }
});

function handleEvent(event) {
  console.log('Handling event:', JSON.stringify(event, null, 2));
  
  try {
    if (event.type === 'follow') {
      const userId = event.source.userId;
      if (!userId) {
        console.error('No userId found in event');
        return Promise.reject(new Error('No userId found'));
      }
      
      // Use environment variable for domain or default to localhost
      const domain = process.env.NGROK_DOMAIN || 'localhost:3000';
      const protocol = process.env.NGROK_DOMAIN ? 'https' : 'http';
      const link = `${protocol}://${domain}/form?userId=${userId}`;
      
      console.log('Sending form link:', link);
      
      const messages = [{ type: 'text', text: `Please fill the form: ${link}` }];
      return client.replyMessage(event.replyToken, messages)
        .then(() => {
          console.log('Reply message sent successfully');
          return { success: true };
        })
        .catch((err) => {
          console.error('Error sending reply message:', err);
          throw err;
        });
    } else if (event.type === 'message' && event.message.type === 'text') {
      // Handle text messages
      const replyText = `Echo: ${event.message.text}`;
      const messages = [{ type: 'text', text: replyText }];
      return client.replyMessage(event.replyToken, messages);
    } else {
      console.log(`Unhandled event type: ${event.type}`);
      return Promise.resolve({ message: 'Event ignored' });
    }
  } catch (error) {
    console.error('Error in handleEvent:', error);
    return Promise.reject(error);
  }
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at ${port}`);
});
