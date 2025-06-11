require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const crypto = require('crypto');

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

const GAS_URL = process.env.GAS_URL; // 環境変数からGAS_URLを取得

async function fetchDeals() {
  try {
    console.log('🔍 Starting GAS fetch (GET)...'); // Changed from POST to GET
    console.log('🌐 GAS URL:', GAS_URL);

    // const requestBody = { // Removed for GET request
    //   overview: "doGet" 
    // };
    // console.log('📡 Request body:', JSON.stringify(requestBody)); // Removed for GET request
    
    const res = await fetch(GAS_URL, { 
      method: 'GET', // Changed to GET
      headers: {
        // 'Content-Type': 'application/json', // Removed for GET request
        'User-Agent': 'CustomerService/1.0', 
        'Accept': 'application/json, text/plain, */*'
      }
      // body: JSON.stringify(requestBody) // Removed for GET request
    });
    
    console.log('📊 Response status:', res.status);
    console.log('📊 Response status text:', res.statusText);
    // console.log('📊 Response headers:', Object.fromEntries(res.headers.entries())); // 詳細デバッグ用にコメントアウト

    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ Failed to fetch deals from GAS:', res.status, res.statusText);
      console.error('❌ GAS Response body (first 500 chars):', errorText.slice(0, 500));
      return [];
    }

    const text = await res.text();
    console.log('📝 Raw GAS response text length:', text.length);
    console.log('📝 Raw GAS response text preview (first 500 chars):', text.slice(0, 500));
    
    try {
      const data = JSON.parse(text);
      console.log('✅ Successfully parsed JSON from GAS');
      // console.log('📦 GAS Response structure:', JSON.stringify(data, null, 2)); // 詳細デバッグ用にコメントアウト

      // GASからの期待されるレスポンス構造に適応
      if (data && data.status === 'success' && data.data !== undefined) {
        console.log('📦 GAS reported success. Data type:', typeof data.data, 'Is array:', Array.isArray(data.data));
        return Array.isArray(data.data) ? data.data : [];
      } else if (Array.isArray(data)) { // GASが直接配列を返す場合のフォールバック
        console.log('📦 GAS response is a direct array.');
        return data;
      } else if (data && data.status === 'error') {
        console.error('❌ GAS returned an error status:', data.message || 'No message provided.');
        return [];
      } else {
        console.warn('📦 Unexpected JSON structure from GAS (first 500 chars):', JSON.stringify(data, null, 2).slice(0,500));
        return [];
      }
      
    } catch (parseErr) {
      console.error('❌ Failed to parse JSON response from GAS:', parseErr.message);
      console.error('❌ GAS Response text was (first 500 chars):', text.slice(0, 500));
      if (text.toLowerCase().includes('<html')) {
        console.error('⚠️ GAS response appears to be HTML. Check GAS script deployment and doGet function (it must return a ContentService response).'); // Added note about ContentService
      }
      return [];
    }

  } catch (fetchErr) {
    console.error('❌ Network or fetch error calling GAS:', fetchErr.message);
    // console.error('❌ Fetch error stack:', fetchErr.stack); // 詳細デバッグ用にコメントアウト
    if (fetchErr.cause) {
      console.error('❌ Fetch error cause:', fetchErr.cause);
    }
    return [];
  }
}

function createFormLinkMessage(link, prefix = '') {
  return {
    type: 'template',
    altText: 'お客様サポートフォーム',
    template: {
      type: 'buttons',
      text: `${prefix}\nお客様サポートフォームをご利用ください`,
      actions: [
        { type: 'uri', label: 'フォームを開く', uri: link }
      ]
    }
  };
}

function createDealCarousel(deals) {
  return {
    type: 'flex',
    altText: '案件情報',
    contents: {
      type: 'carousel',
      contents: deals.slice(0, 10).map(d => ({
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            { type: 'text', text: d.rawtext || JSON.stringify(d), wrap: true }
          ]
        }
      }))
    }
  };
}

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
  const userId = req.query.userId || '';
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Customer Service Form</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
    .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #333; text-align: center; }
    label { display: block; margin: 15px 0 5px; font-weight: bold; }
    input[type="text"] { width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px; font-size: 16px; }
    button { background-color: #00C300; color: white; padding: 15px 30px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; width: 100%; margin-top: 20px; }
    button:hover { background-color: #00A300; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Customer Service Form</h1>
    <form method="POST" action="/submit">
      <input type="hidden" name="userId" value="${userId}">
      <label>お名前:</label>
      <input type="text" name="name" required>

      <label>都道府県コード:</label>
      <select name="prefectureCode" required>
        <option value="01">北海道</option>
        <option value="02">青森県</option>
        <option value="03">岩手県</option>
        <option value="04">宮城県</option>
        <option value="05">秋田県</option>
        <option value="06">山形県</option>
        <option value="07">福島県</option>
        <option value="08">茨城県</option>
        <option value="09">栃木県</option>
        <option value="10">群馬県</option>
        <option value="11">埼玉県</option>
        <option value="12">千葉県</option>
        <option value="13">東京都</option>
        <option value="14">神奈川県</option>
        <option value="15">新潟県</option>
        <option value="16">富山県</option>
        <option value="17">石川県</option>
        <option value="18">福井県</option>
        <option value="19">山梨県</option>
        <option value="20">長野県</option>
        <option value="21">岐阜県</option>
        <option value="22">静岡県</option>
        <option value="23">愛知県</option>
        <option value="24">三重県</option>
        <option value="25">滋賀県</option>
        <option value="26">京都府</option>
        <option value="27">大阪府</option>
        <option value="28">兵庫県</option>
        <option value="29">奈良県</option>
        <option value="30">和歌山県</option>
        <option value="31">鳥取県</option>
        <option value="32">島根県</option>
        <option value="33">岡山県</option>
        <option value="34">広島県</option>
        <option value="35">山口県</option>
        <option value="36">徳島県</option>
        <option value="37">香川県</option>
        <option value="38">愛媛県</option>
        <option value="39">高知県</option>
        <option value="40">福岡県</option>
        <option value="41">佐賀県</option>
        <option value="42">長崎県</option>
        <option value="43">熊本県</option>
        <option value="44">大分県</option>
        <option value="45">宮崎県</option>
        <option value="46">鹿児島県</option>
        <option value="47">沖縄県</option>
      </select>

      <label>車両の有無:</label>
      <select name="hasVehicle" required>
        <option value="yes">あり</option>
        <option value="no">なし</option>
      </select>

      <label>報酬希望:</label>
      <input type="text" name="reward" required>

      <button type="submit">送信</button>
    </form>
  </div>
</body>
</html>`);
});

// handle form submission
app.post('/submit', async (req, res) => {
  const { userId, name, prefectureCode, hasVehicle, reward } = req.body;
  console.log('Form submitted:', { userId, name, prefectureCode, hasVehicle, reward });

  if (userId && name && prefectureCode && hasVehicle && reward) {
    const vehicleText = hasVehicle === 'yes' ? 'あり' : 'なし';
    const confirmationMessage = `${name}様、エントリーありがとうございます！\n都道府県コード: ${prefectureCode}\n車両有無: ${vehicleText}\n報酬希望: ${reward}\n担当者より後日ご連絡いたします。`;

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
      messages.push(createDealCarousel(matched));
    } else {
      messages.push({ type: 'text', text: '現在該当する案件はありません。' });
    }

    client.pushMessage(userId, messages)
      .then(() => {
        console.log('Message sent successfully to user:', userId);
        res.send(`
          <html>
            <head>
              <meta charset="utf-8">
              <title>送信完了</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
                .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
                h1 { color: #00C300; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>送信完了</h1>
                <p>お問い合わせを受け付けました。<br>LINEにメッセージをお送りしました。</p>
              </div>
            </body>
          </html>
        `);
      })
      .catch((err) => {
        console.error('Error sending message:', err);
        res.status(500).send(`
          <html>
            <head><meta charset="utf-8"><title>エラー</title></head>
            <body>
              <h1>エラーが発生しました</h1>
              <p>メッセージの送信に失敗しました。</p>
            </body>
          </html>
        `);
      });
  } else {
    res.status(400).send('必要な情報が不足しています');
  }
});

function handleEvent(event) {
  console.log('Handling event:', event.type);
  
  if (event.type === 'follow') {
    const userId = event.source.userId;
    const link = `https://customer-service-hjly.onrender.com/form?userId=${userId}`;

    console.log('Sending form link to new follower:', link);

    const messages = [createFormLinkMessage(link, 'ご登録ありがとうございます！')];

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
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server running at port ${port}`);
  console.log(`📝 Form available at: http://localhost:${port}/form?userId=test123`);
});
