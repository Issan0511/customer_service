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

console.log('✅ LINE configuration validated');
const client = new line.Client(config);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// webhook endpoint for LINE with better error handling
app.post('/webhook', (req, res) => {
  console.log('Webhook received:', JSON.stringify(req.body, null, 2));
  console.log('Request headers:', {
    'x-line-signature': req.headers['x-line-signature'],
    'content-type': req.headers['content-type'],
    'user-agent': req.headers['user-agent']
  });
  
  // 手動で署名検証を実行
  try {
    const signature = req.headers['x-line-signature'];
    if (!signature) {
      console.log('⚠️ No signature header found - possibly a test request');
      return processWebhookEvents(req, res);
    }
    
    // LINE署名検証
    const crypto = require('crypto');
    const body = JSON.stringify(req.body);
    const hash = crypto.createHmac('sha256', config.channelSecret).update(body).digest('base64');
    
    if (signature !== hash) {
      console.error('❌ Signature validation failed');
      console.error('Expected:', hash);
      console.error('Received:', signature);
      console.error('Body:', body);
      
      // テスト環境では署名検証をスキップ
      if (process.env.NODE_ENV === 'development' || req.body.events?.[0]?.source?.userId === 'test123') {
        console.log('⚠️ Skipping signature validation for development/test');
        return processWebhookEvents(req, res);
      }
      
      return res.status(400).json({ error: 'Invalid signature' });
    }
    
    console.log('✅ Signature validation passed');
    processWebhookEvents(req, res);
    
  } catch (error) {
    console.error('Error in signature validation:', error);
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
<head><meta charset="utf-8"><title>Customer Service Form</title></head>
<body>
  <h1>Customer Service Form</h1>
  <form method="POST" action="/submit">
    <input type="hidden" name="userId" value="${userId}">
    <label>Name: <input type="text" name="name" required></label><br><br>
    <button type="submit">Send</button>
  </form>
</body>
</html>`);
});

// handle form submission
app.post('/submit', (req, res) => {
  const { userId, name } = req.body;
  console.log('Form submitted:', { userId, name });
  
  if (userId && name) {
    client.pushMessage(userId, { type: 'text', text: `Thank you ${name}! We received your request.` })
      .then(() => {
        console.log('Message sent successfully to user:', userId);
        res.send(`
          <html>
            <head><title>Thank You</title></head>
            <body>
              <h1>Thank you!</h1>
              <p>Your message has been sent to LINE.</p>
            </body>
          </html>
        `);
      })
      .catch((err) => {
        console.error('Error sending message:', err);
        res.status(500).send('Error sending message');
      });
  } else {
    res.status(400).send('Missing parameters');
  }
});

function handleEvent(event) {
  console.log('Handling event:', event.type);
  
  if (event.type === 'follow') {
    const userId = event.source.userId;
    // Use environment variable for domain or default to localhost
    const domain = process.env.NGROK_DOMAIN || 'localhost:3000';
    const protocol = domain.includes('ngrok') ? 'https' : 'http';
    const link = `${protocol}://${domain}/form?userId=${userId}`;
    
    console.log('Sending form link to new follower:', link);
    
    const messages = [
      { 
        type: 'text', 
        text: `Welcome! Please fill out our customer service form: ${link}` 
      }
    ];
    
    return client.replyMessage(event.replyToken, messages);
  }
  
  if (event.type === 'message' && event.message.type === 'text') {
    const userId = event.source.userId;
    const domain = process.env.NGROK_DOMAIN || 'localhost:3000';
    const protocol = domain.includes('ngrok') ? 'https' : 'http';
    const link = `${protocol}://${domain}/form?userId=${userId}`;
    
    const messages = [
      { 
        type: 'text', 
        text: `Please use our customer service form: ${link}` 
      }
    ];
    
    return client.replyMessage(event.replyToken, messages);
  }
  
  return Promise.resolve(null);
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server running at port ${port}`);
  console.log(`📝 Form available at: http://localhost:${port}/form?userId=test123`);
});
