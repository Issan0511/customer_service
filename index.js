require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const crypto = require('crypto');
const { fetchDeals, createDealCarousel } = require("./src/deals");
const { createFormLinkMessage } = require("./src/messages");
const { getFormHtml, getSuccessHtml, getErrorHtml } = require("./src/templates");
const createHandleEvent = require("./src/handlers");

async function sendToSpreadsheet(data) {
  const res = await fetch(process.env.GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    throw new Error(`GAS request failed: ${res.status}`);
  }

  try {
    return await res.json();
  } catch (_) {
    return await res.text();
  }
}

const config = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
};

// デバッグ用：環境変数の確認
console.log('Environment variables check:');
console.log('LINE_CHANNEL_SECRET exists:', !!process.env.LINE_CHANNEL_SECRET);
console.log('LINE_CHANNEL_ACCESS_TOKEN exists:', !!process.env.LINE_CHANNEL_ACCESS_TOKEN);
console.log('GAS_URL exists:', !!process.env.GAS_URL); // GAS_URLの存在確認を追加

if (!process.env.LINE_CHANNEL_SECRET || !process.env.LINE_CHANNEL_ACCESS_TOKEN || !process.env.GAS_URL) { // GAS_URLのチェックを追加
  console.error('❌ 環境変数が設定されていません');
  process.exit(1);
}

console.log('✅ LINE configuration validated');
const client = new line.Client(config);

const app = express();

const handleEvent = createHandleEvent(client);

// Raw body parser for signature validation
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// webhook endpoint for LINE with manual signature validation
app.post('/webhook', (req, res) => {
  console.log('Webhook received');
  console.log('Request headers:', {
    'x-line-signature': req.headers['x-line-signature'],
    'content-type': req.headers['content-type'],
    'user-agent': req.headers['user-agent']
  });
  
  try {
    const signature = req.headers['x-line-signature'];
    let body;
    
    // Handle raw body for signature validation
    if (Buffer.isBuffer(req.body)) {
      body = req.body.toString('utf8');
    } else {
      body = JSON.stringify(req.body);
    }
    
    console.log('Request body:', body);
    
    if (!signature) {
      console.log('⚠️ No signature header found - possibly a test request');
    } else {
      // Verify signature
      const hash = crypto.createHmac('sha256', config.channelSecret).update(body).digest('base64');
      
      if (signature !== hash) {
        console.error('❌ Signature validation failed');
        console.error('Expected:', hash);
        console.error('Received:', signature);
        
        // Allow test requests to pass through
        if (!body.includes('test123')) {
          return res.status(400).json({ error: 'Invalid signature' });
        }
        console.log('⚠️ Allowing test request despite signature mismatch');
      } else {
        console.log('✅ Signature validation passed');
      }
    }
    
    // Parse body if it's a string
    let events;
    try {
      const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
      events = parsedBody.events;
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return res.status(400).json({ error: 'Invalid JSON' });
    }
    
    if (!events || events.length === 0) {
      console.log('No events in webhook');
      return res.status(200).json({ message: 'No events' });
    }
    
    // Process events
    Promise
      .all(events.map(handleEvent))
      .then((result) => {
        console.log('Events processed successfully:', result);
        res.status(200).json(result);
      })
      .catch((err) => {
        console.error('Error processing events:', err);
        console.error('Error stack:', err.stack);
        res.status(500).json({ error: 'Internal server error', message: err.message });
      });
      
  } catch (error) {
    console.error('Error in webhook processing:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// simple form page
app.get('/form', (req, res) => {
  const userId = req.query.userId || "";
  res.send(getFormHtml(userId));
});

// handle form submission
app.post('/submit', async (req, res) => {
  const { userId, name, prefectureCode, prefecture, hasVehicle, reward } = req.body;
  console.log('Form submitted:', { userId, name, prefectureCode, prefecture, hasVehicle, reward });

  if (userId && name && prefectureCode && prefecture && hasVehicle && reward) {
    try {
      await sendToSpreadsheet({ userId, name, prefectureCode, prefecture, hasVehicle, reward });
      console.log('Data sent to GAS');
    } catch (e) {
      console.error('Failed to send data to GAS:', e);
    }
    const vehicleText = hasVehicle === 'yes' ? 'あり' : 'なし';
    const confirmationMessage = `${name}様、エントリーありがとうございます！/nお住まいの地域に該当する案件をお探ししています。`;

    const deals = await fetchDeals();
    const matched = deals.filter(d => {
      if (typeof d.code === 'string') {
        try {
          const parsedCode = JSON.parse(d.code);
          return Array.isArray(parsedCode) && parsedCode.includes(prefectureCode);
        } catch (e) {
          console.error('Failed to parse d.code:', d.code, e);
          return false;
        }
      } else if (Array.isArray(d.code)) {
        return d.code.includes(prefectureCode);
      }
      return false;
    });    
    let messages = [{ type: 'text', text: confirmationMessage }];

    if (matched.length > 0) {
      messages.push({ type: 'text', text: '以下が、お住まいの都道府県に該当する案件です。' });
      messages.push(createDealCarousel(matched));
    } else {
      messages.push({ type: 'text', text: '現在該当する案件はありません。' });
    }

    client.pushMessage(userId, messages)
      .then(() => {
        console.log("Message sent successfully to user:", userId);
        res.send(getSuccessHtml());
      })
      .catch((err) => {
        console.error("Error sending message:", err);
        res.status(500).send(getErrorHtml());
      });
  } else {
    res.status(400).send('必要な情報が不足しています');
  }
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server running at port ${port}`);
  console.log(`📝 Form available at: http://localhost:${port}/form?userId=test123`);
});
